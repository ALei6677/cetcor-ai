import { NextRequest, NextResponse } from 'next/server';
import { getCreditsForPurchase, PlanId, PurchaseType } from '@/constants/billing';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyPaypalWebhookSignature } from '@/lib/paypal';

type PayPalResource = {
  id?: string;
  billing_agreement_id?: string;
  resource_type?: string;
  supplementary_data?: {
    related_ids?: {
      order_id?: string;
    };
  };
  [key: string]: unknown;
};

/**
 * PayPal Webhook 入口
 *
 * 注意：为简化示例，这里未做签名校验。
 * 生产环境强烈建议调用 PayPal `/v1/notifications/verify-webhook-signature`
 * 进行验证，并使用 PAYPAL_WEBHOOK_ID 做匹配。
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase 未正确配置，无法处理 Webhook' },
        { status: 500 }
      );
    }

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID 未配置，拒绝处理 Webhook');
      return NextResponse.json({ error: 'Webhook 未配置' }, { status: 500 });
    }

    // 需要原始 body 字符串来做签名验证
    const rawBody = await request.text();

    // PayPal 通过 HTTP 头传递签名相关字段
    const transmissionId = request.headers.get('paypal-transmission-id') ?? '';
    const transmissionTime = request.headers.get('paypal-transmission-time') ?? '';
    const certUrl = request.headers.get('paypal-cert-url') ?? '';
    const authAlgo = request.headers.get('paypal-auth-algo') ?? '';
    const transmissionSig = request.headers.get('paypal-transmission-sig') ?? '';

    try {
      const verified = await verifyPaypalWebhookSignature({
        transmissionId,
        transmissionTime,
        certUrl,
        authAlgo,
        transmissionSig,
        webhookId,
        rawBody,
      });

      if (!verified) {
        console.warn('PayPal Webhook 签名验证未通过，拒绝处理');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    } catch (verifyError) {
      console.error('PayPal Webhook 签名验证失败:', verifyError);
      return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type as string | undefined;
    const resource = payload.resource as PayPalResource | undefined;

    // 记录原始事件
    const paypalResourceId = resource?.id ?? 'unknown';
    let subscriptionId: string | null = null;
    let userId: string | null = null;

    // 处理订阅相关事件
    if (
      eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
      eventType === 'BILLING.SUBSCRIPTION.RENEWED' ||
      eventType === 'PAYMENT.SALE.COMPLETED'
    ) {
      const paypalSubId = resource?.id ?? resource?.billing_agreement_id;

      if (paypalSubId) {
        const { data, error } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id, user_id, plan_id, billing_type')
          .eq('paypal_subscription_id', paypalSubId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          subscriptionId = data.id;
          userId = data.user_id;

          const creditsTotal = getCreditsForPurchase(
            data.plan_id as PlanId,
            data.billing_type as PurchaseType
          );
          const now = new Date();
          let currentCycleEnd: Date | null = null;

          if (data.billing_type === 'monthly') {
            currentCycleEnd = new Date(now);
            currentCycleEnd.setMonth(currentCycleEnd.getMonth() + 1);
          } else if (data.billing_type === 'yearly') {
            currentCycleEnd = new Date(now);
            currentCycleEnd.setFullYear(currentCycleEnd.getFullYear() + 1);
          }

          const { error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'active',
              credits_total: creditsTotal,
              credits_used: 0,
              current_cycle_start: now.toISOString(),
              current_cycle_end: currentCycleEnd ? currentCycleEnd.toISOString() : null,
              updated_at: now.toISOString(),
            })
            .eq('id', data.id);

          if (updateError) {
            console.error('更新订阅周期失败:', updateError);
          }
        }
      }
    }

    // 处理一次性订单成功事件（示例：CHECKOUT.ORDER.APPROVED 或 PAYMENT.CAPTURE.COMPLETED）
    if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = resource?.id ?? resource?.supplementary_data?.related_ids?.order_id;

      if (orderId) {
        const { data, error } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id, user_id, plan_id')
          .eq('paypal_order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          subscriptionId = data.id;
          userId = data.user_id;

          const creditsTotal = getCreditsForPurchase(
            data.plan_id as PlanId,
            'one_time'
          );
          const now = new Date();

          const { error: updateError } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'active',
              credits_total: creditsTotal,
              credits_used: 0,
              current_cycle_start: now.toISOString(),
              current_cycle_end: null, // 一次性订单没有周期结束时间
              updated_at: now.toISOString(),
            })
            .eq('id', data.id);

          if (updateError) {
            console.error('更新一次性订单订阅失败:', updateError);
          }
        }
      }
    }

    // 将事件记录到 payment_events 表中，方便对账与调试
    const { error: insertEventError } = await supabaseAdmin.from('payment_events').insert({
      user_id: userId,
      subscription_id: subscriptionId,
      paypal_resource_id: paypalResourceId,
      resource_type: resource?.resource_type ?? 'unknown',
      event_type: eventType ?? 'UNKNOWN',
      amount: null,
      currency: null,
      raw_payload: payload,
    });

    if (insertEventError) {
      console.error('记录 payment_events 失败:', insertEventError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('/api/paypal/webhook 错误:', error);
    return NextResponse.json(
      { error: '处理 Webhook 失败' },
      { status: 500 }
    );
  }
}


