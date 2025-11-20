import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  ONE_TIME_PLAN_CREDITS,
  ONE_TIME_PRICES_USD,
  PlanId,
  buildCancelUrl,
  buildSuccessUrl,
  isOneTimePlanId,
} from '@/constants/billing';
import { createPaypalOrder } from '@/lib/paypal';
import { getUserFromRequest, supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  const log = (message: string, payload?: Record<string, unknown>) => {
    console.log('[PayPal][CreateOrder]', message, { requestId, ...payload });
  };

  const logError = (
    message: string,
    error: unknown,
    payload?: Record<string, unknown>
  ) => {
    console.error('[PayPal][CreateOrder] ❌', message, {
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
        { error: 'Supabase 未正确配置，无法创建订单' },
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

    log('Payload parsed', { planId });

    if (!planId || !isOneTimePlanId(planId)) {
      logError('Invalid plan type for one-time order', null, { planId });
      return NextResponse.json({ error: '无效的套餐类型' }, { status: 400 });
    }

    const amount = ONE_TIME_PRICES_USD[planId];
    const origin = request.nextUrl.origin;
    const successUrl = buildSuccessUrl(origin);
    const cancelUrl = buildCancelUrl(origin);

    log('Creating PayPal order', {
      amount,
      currency: 'USD',
      planId,
      successUrl,
      cancelUrl,
    });

    const order = await createPaypalOrder(
      amount,
      'USD',
      successUrl,
      cancelUrl,
      {
        payerEmail: user.email ?? undefined,
      }
    );

    log('PayPal order API response', {
      orderId: order.id,
      status: order.status,
      linksCount: order.links?.length ?? 0,
    });

    const approvalUrl = order.links?.find((link) => link.rel === 'approve')?.href ?? null;

    if (!approvalUrl) {
      logError('Missing approval URL in PayPal response', order);
      return NextResponse.json(
        { error: '未从 PayPal 返回授权链接，请检查配置' },
        { status: 500 }
      );
    }

    const creditsTotal = ONE_TIME_PLAN_CREDITS[planId];
    log('Persisting one-time order in database', {
      userId: user.id,
      planId,
      orderId: order.id,
      creditsTotal,
    });

    // 创建一次性订单对应的订阅记录（billing_type 为 one_time）
    const { error: dbError } = await supabaseAdmin.from('user_subscriptions').insert({
      user_id: user.id,
      plan_id: planId,
      billing_type: 'one_time',
      paypal_order_id: order.id,
      status: 'pending',
      credits_total: creditsTotal,
      credits_used: 0,
    });

    if (dbError) {
      logError('Failed to insert one-time subscription record', dbError, {
        userId: user.id,
        orderId: order.id,
        planId,
      });
    }

    const responsePayload = {
      id: order.id,
      status: order.status,
      approvalUrl,
    };

    log('Order creation completed', {
      ...responsePayload,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    logError('Unexpected error while creating order', error);
    if (error instanceof Error) {
      logError('Error stack trace', error.stack);
    }

    return NextResponse.json(
      { error: '创建订单失败，请稍后重试' },
      { status: 500 }
    );
  } finally {
    log('Request finished', { durationMs: Date.now() - startedAt });
  }
}

