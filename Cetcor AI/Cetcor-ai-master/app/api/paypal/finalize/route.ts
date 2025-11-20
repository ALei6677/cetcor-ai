import { NextRequest, NextResponse } from 'next/server';
import { capturePaypalOrder, getPaypalSubscriptionDetails } from '@/lib/paypal';
import { getUserFromRequest, supabaseAdmin } from '@/lib/supabase-admin';
import { getCreditsForPurchase, PlanId, PurchaseType } from '@/constants/billing';

type FinalizePayload =
  | {
      type: 'order';
      paypalId: string;
    }
  | {
      type: 'subscription';
      paypalId: string;
    };

const addMonths = (date: Date, months: number) => {
  const clone = new Date(date);
  clone.setMonth(clone.getMonth() + months);
  return clone;
};

const addYears = (date: Date, years: number) => {
  const clone = new Date(date);
  clone.setFullYear(clone.getFullYear() + years);
  return clone;
};

const resolveCycleEnd = (billingType: string | null | undefined, now: Date) => {
  if (!billingType || billingType === 'one_time') {
    return null;
  }
  if (billingType === 'monthly') {
    return addMonths(now, 1);
  }
  if (billingType === 'yearly') {
    return addYears(now, 1);
  }
  return null;
};

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase 未正确配置。' }, { status: 500 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: '未登录或 token 已过期。' }, { status: 401 });
    }

    const payload = (await request.json()) as FinalizePayload;
    if (!payload?.paypalId || !payload?.type) {
      return NextResponse.json({ error: '缺少支付标识或类型。' }, { status: 400 });
    }

    const lookupColumn =
      payload.type === 'order' ? 'paypal_order_id' : 'paypal_subscription_id';

    const { data: subscription, error: queryError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, user_id, plan_id, billing_type, status, credits_total, credits_used')
      .eq(lookupColumn, payload.paypalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError || !subscription) {
      console.error('[paypal/finalize] 未找到对应的订阅记录', queryError);
      return NextResponse.json(
        { error: '未找到对应的订阅记录，请稍后再试。' },
        { status: 404 }
      );
    }

    if (subscription.user_id !== user.id) {
      return NextResponse.json(
        { error: '无权操作该支付记录。' },
        { status: 403 }
      );
    }

    // 避免重复处理
    if (subscription.status === 'active') {
      return NextResponse.json({
        success: true,
        subscription,
      });
    }

    if (payload.type === 'order') {
      try {
        await capturePaypalOrder(payload.paypalId);
      } catch (error) {
        console.error('[paypal/finalize] capture 订单失败', error);
        return NextResponse.json(
          { error: '捕获 PayPal 订单失败，请稍后再试。' },
          { status: 400 }
        );
      }
    } else {
      try {
        const remoteSubscription = await getPaypalSubscriptionDetails(payload.paypalId);
        if (remoteSubscription.status !== 'ACTIVE' && remoteSubscription.status !== 'APPROVAL_PENDING') {
          return NextResponse.json(
            { error: `订阅状态异常：${remoteSubscription.status}` },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('[paypal/finalize] 查询 PayPal 订阅失败', error);
        return NextResponse.json(
          { error: '查询 PayPal 订阅状态失败。' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const creditsTotal = getCreditsForPurchase(
      subscription.plan_id as PlanId,
      (subscription.billing_type ?? (payload.type === 'order' ? 'one_time' : 'monthly')) as PurchaseType
    );
    const cycleEnd = resolveCycleEnd(subscription.billing_type, now);

    const { data: updatedRow, error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active',
        credits_total: creditsTotal,
        credits_used: 0,
        current_cycle_start: now.toISOString(),
        current_cycle_end: cycleEnd ? cycleEnd.toISOString() : null,
        updated_at: now.toISOString(),
      })
      .eq('id', subscription.id)
      .select('id, plan_id, billing_type, status, credits_total, credits_used')
      .maybeSingle();

    if (updateError || !updatedRow) {
      console.error('[paypal/finalize] 更新订阅记录失败', updateError);
      return NextResponse.json(
        { error: '更新用户订阅状态失败，请稍后再试。' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: updatedRow,
    });
  } catch (error) {
    console.error('[paypal/finalize] 未知错误', error);
    return NextResponse.json(
      { error: '同步支付状态失败，请稍后再试。' },
      { status: 500 }
    );
  }
}


