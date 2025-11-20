import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  SUBSCRIPTION_PLAN_CREDITS,
  buildCancelUrl,
  buildSuccessUrl,
  getPaypalPlanId,
  PlanId,
  BillingType,
} from '@/constants/billing';
import { createPaypalSubscription } from '@/lib/paypal';
import { getUserFromRequest, supabaseAdmin } from '@/lib/supabase-admin';

/**
 * @description 仅记录一次关键环境变量存在性，避免每次请求重复刷日志
 */
const logEnvStatusOnce = (() => {
  let logged = false;
  return () => {
    if (logged) return;
    logged = true;
    console.log('=== PayPal API 启动检查 ===');
    console.log('PAYPAL_CLIENT_ID 存在:', !!process.env.PAYPAL_CLIENT_ID);
    console.log('PAYPAL_CLIENT_SECRET 存在:', !!process.env.PAYPAL_CLIENT_SECRET);
    console.log('PAYPAL_PLAN_MAPPING 存在:', !!process.env.PAYPAL_PLAN_MAPPING);
    console.log('SUPABASE_SERVICE_ROLE_KEY 存在:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!process.env.PAYPAL_CLIENT_ID) {
      console.error('❌ PAYPAL_CLIENT_ID 未配置');
    }
    if (!process.env.PAYPAL_CLIENT_SECRET) {
      console.error('❌ PAYPAL_CLIENT_SECRET 未配置');
    }
  };
})();

export async function POST(request: NextRequest) {
  // 启动阶段即验证环境变量状态，确保服务端 log 中可见
  logEnvStatusOnce();

  const requestId = randomUUID();
  const startedAt = Date.now();

  const log = (message: string, payload?: Record<string, unknown>) => {
    console.log('[PayPal][CreateSubscription]', message, {
      requestId,
      ...payload,
    });
  };

  const logError = (
    message: string,
    error: unknown,
    payload?: Record<string, unknown>
  ) => {
    console.error('[PayPal][CreateSubscription] ❌', message, {
      requestId,
      error,
      ...payload,
    });
  };

  log('Request received', {
    method: request.method,
    url: request.nextUrl.pathname,
    headers: {
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'user-agent': request.headers.get('user-agent'),
    },
  });

  try {
    if (!supabaseAdmin) {
      logError('Supabase admin client is missing', null);
      return NextResponse.json(
        { error: 'Supabase 未正确配置，无法创建订阅' },
        { status: 500 }
      );
    }

    const user = await getUserFromRequest(request);
    log('User resolved', { hasUser: !!user, userId: user?.id });

    if (!user) {
      return NextResponse.json({ error: '未登录或 token 无效' }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as PlanId | undefined;
    const billingType = body.billingType as BillingType | undefined;

    log('Payload parsed', { planId, billingType });

    if (!planId || !billingType) {
      logError('Missing planId or billingType', null, { planId, billingType });
      return NextResponse.json({ error: '缺少 planId 或 billingType 参数' }, { status: 400 });
    }

    if (!['basic', 'pro', 'max'].includes(planId)) {
      logError('Invalid plan type', null, { planId });
      return NextResponse.json({ error: '无效的套餐类型' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(billingType)) {
      // 订阅仅支持 monthly / yearly
      logError('Invalid billing type for subscription', null, { billingType });
      return NextResponse.json({ error: '订阅仅支持月付或年付' }, { status: 400 });
    }

    const paypalPlanId = getPaypalPlanId(planId, billingType);
    log('Resolved PayPal plan mapping', { paypalPlanId });

    if (!paypalPlanId) {
      logError('Missing PayPal plan ID mapping', null, {
        planId,
        billingType,
      });
      return NextResponse.json(
        { error: 'PayPal 套餐未在配置中映射，请检查 PAYPAL_PLAN_MAPPING' },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;
    const successUrl = buildSuccessUrl(origin);
    const cancelUrl = buildCancelUrl(origin);

    log('Creating PayPal subscription', {
      origin,
      successUrl,
      cancelUrl,
    });

    const subscription = await createPaypalSubscription(
      paypalPlanId,
      successUrl,
      cancelUrl,
      {
        subscriberEmail: user.email ?? undefined,
      }
    );

    log('PayPal subscription API response', {
      subscriptionId: subscription.id,
      status: subscription.status,
      linksCount: subscription.links?.length ?? 0,
    });

    const approvalUrl =
      subscription.links?.find((link) => link.rel === 'approve')?.href ?? null;

    if (!approvalUrl) {
      logError('Missing approval URL in PayPal response', subscription);
      return NextResponse.json(
        { error: '未从 PayPal 返回授权链接，请检查配置' },
        { status: 500 }
      );
    }

    const creditsTotal = SUBSCRIPTION_PLAN_CREDITS[planId];
    log('Persisting subscription to database', {
      userId: user.id,
      planId,
      billingType,
      subscriptionId: subscription.id,
      creditsTotal,
    });

    // 在数据库中创建或更新用户订阅记录，先标记为 pending
    const { error: dbError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        billing_type: billingType,
        paypal_subscription_id: subscription.id,
        status: 'pending',
        credits_total: creditsTotal,
        credits_used: 0,
      });

    if (dbError) {
      logError('Failed to insert user_subscriptions record', dbError, {
        userId: user.id,
        planId,
        billingType,
        subscriptionId: subscription.id,
      });
      // 即便插入失败，仍然返回 PayPal 授权链接，但提示需要查看服务端日志
    }

    const responsePayload = {
      id: subscription.id,
      status: subscription.status,
      approvalUrl,
    };

    log('Subscription creation completed', {
      ...responsePayload,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    logError('Unexpected error while creating subscription', error);
    if (error instanceof Error) {
      logError('Error stack trace', error.stack);
    }

    return NextResponse.json(
      { error: '创建订阅失败，请稍后重试' },
      { status: 500 }
    );
  } finally {
    log('Request finished', { durationMs: Date.now() - startedAt });
  }
}

