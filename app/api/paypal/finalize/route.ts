import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  capturePaypalOrder,
  getPaypalSubscriptionDetails,
  getPaypalOrderDetails,
} from '@/lib/paypal';
import { getUserFromRequest, supabaseAdmin } from '@/lib/supabase-admin';
import {
  getCreditsForPurchase,
  PlanId,
  PurchaseType,
  getPlanIdFromPaypalPlanId,
  ONE_TIME_PRICES_USD,
  ONE_TIME_PLAN_CREDITS,
  isOneTimePlanId,
} from '@/constants/billing';

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

    const {
      data: existingSubscription,
      error: queryError,
    } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, user_id, plan_id, billing_type, status, credits_total, credits_used')
      .eq(lookupColumn, payload.paypalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error('[paypal/finalize] 查询订阅记录失败', queryError);
      return NextResponse.json(
        { error: '查询订阅记录失败，请稍后再试。' },
        { status: 500 }
      );
    }

    let subscription = existingSubscription;

    // 如果找不到订阅记录，尝试从 PayPal 获取信息并创建记录
    if (!subscription) {
      console.log('[paypal/finalize] 未找到订阅记录，尝试从 PayPal 获取信息并创建记录', {
        paypalId: payload.paypalId,
        type: payload.type,
      });

      let planId: PlanId | null = null;
      let billingType: PurchaseType | null = null;
      let creditsTotal: number = 0;

      if (payload.type === 'subscription') {
        try {
          const remoteSubscription = await getPaypalSubscriptionDetails(payload.paypalId);
          if (
            remoteSubscription.status !== 'ACTIVE' &&
            remoteSubscription.status !== 'APPROVAL_PENDING'
          ) {
            return NextResponse.json(
              { error: `订阅状态异常：${remoteSubscription.status}` },
              { status: 400 }
            );
          }

          if (remoteSubscription.plan_id) {
            const planInfo = getPlanIdFromPaypalPlanId(remoteSubscription.plan_id);
            if (planInfo) {
              planId = planInfo.planId;
              billingType = planInfo.billingType;
              creditsTotal = getCreditsForPurchase(planId, billingType);
            } else {
              console.error('[paypal/finalize] 无法从 PayPal plan_id 映射到本地 planId', {
                paypalPlanId: remoteSubscription.plan_id,
              });
              return NextResponse.json(
                { error: '无法识别 PayPal 订阅套餐，请联系客服。' },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { error: 'PayPal 订阅信息不完整，请联系客服。' },
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
      } else {
        // 对于订单，从订单金额反向查找 planId
        try {
          const orderDetails = await getPaypalOrderDetails(payload.paypalId);
          const amount = orderDetails.purchase_units?.[0]?.amount?.value;
          if (amount) {
            // 从金额反向查找 planId
            const foundPlanId = Object.entries(ONE_TIME_PRICES_USD).find(
              ([, price]) => price === amount
            )?.[0] as PlanId | undefined;

            if (foundPlanId && isOneTimePlanId(foundPlanId)) {
              planId = foundPlanId;
              billingType = 'one_time';
              creditsTotal = ONE_TIME_PLAN_CREDITS[foundPlanId];
            } else {
              console.error('[paypal/finalize] 无法从订单金额映射到本地 planId', {
                amount,
                availablePrices: ONE_TIME_PRICES_USD,
              });
              return NextResponse.json(
                { error: '无法识别 PayPal 订单套餐，请联系客服。' },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { error: 'PayPal 订单信息不完整，请联系客服。' },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('[paypal/finalize] 查询 PayPal 订单失败', error);
          return NextResponse.json(
            { error: '查询 PayPal 订单状态失败。' },
            { status: 400 }
          );
        }
      }

      // 创建新的订阅记录
      if (!planId || !billingType) {
        return NextResponse.json(
          { error: '无法确定套餐信息，请联系客服。' },
          { status: 400 }
        );
      }

      const creationNow = new Date();
      const normalizedBillingType =
        billingType === 'one_time' ? 'one_time' : billingType;
      const cycleEnd = resolveCycleEnd(
        normalizedBillingType === 'one_time' ? null : normalizedBillingType,
        creationNow
      );

      const insertPayload = {
        user_id: user.id,
        plan_id: planId,
        billing_type: normalizedBillingType,
        paypal_order_id: payload.type === 'order' ? payload.paypalId : null,
        paypal_subscription_id: payload.type === 'subscription' ? payload.paypalId : null,
        status: 'pending',
        credits_total: creditsTotal,
        credits_used: 0,
        current_cycle_start: creationNow.toISOString(),
        current_cycle_end: cycleEnd ? cycleEnd.toISOString() : null,
      };

      const {
        data: newSubscription,
        error: insertError,
      } = await supabaseAdmin
        .from('user_subscriptions')
        .insert(insertPayload)
        .select('id, user_id, plan_id, billing_type, status, credits_total, credits_used')
        .maybeSingle();

      if (insertError || !newSubscription) {
        console.error('[paypal/finalize] 创建订阅记录失败，尝试兜底处理', insertError);

        // 兜底 1：可能是并发创建成功但查询未命中，再查一次
        const {
          data: refetchedSubscription,
          error: refetchError,
        } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id, user_id, plan_id, billing_type, status, credits_total, credits_used')
          .eq(lookupColumn, payload.paypalId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (refetchError) {
          console.error('[paypal/finalize] 再次查询订阅记录失败', refetchError);
        }

        if (refetchedSubscription) {
          subscription = refetchedSubscription;
          console.log('[paypal/finalize] 通过兜底查询找到了订阅记录', {
            subscriptionId: subscription.id,
            planId,
            billingType: normalizedBillingType,
          });
        } else {
          const pgError = insertError as PostgrestError | null;
          const maybeUserConflict =
            pgError?.code === '23505' &&
            typeof pgError.message === 'string' &&
            pgError.message.includes('user_id');

          if (maybeUserConflict) {
            console.warn(
              '[paypal/finalize] 检测到 user_id 冲突，尝试复用已有记录',
              insertError
            );

            const {
              data: latestUserSubscription,
              error: fetchLatestError,
            } = await supabaseAdmin
              .from('user_subscriptions')
              .select('id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (fetchLatestError) {
              console.error(
                '[paypal/finalize] 查询用户现有订阅记录失败，无法兜底复用',
                fetchLatestError
              );
            } else if (latestUserSubscription) {
              const {
                data: takeoverSubscription,
                error: takeoverError,
              } = await supabaseAdmin
                .from('user_subscriptions')
                .update({
                  ...insertPayload,
                  paypal_order_id: payload.type === 'order' ? payload.paypalId : null,
                  paypal_subscription_id:
                    payload.type === 'subscription' ? payload.paypalId : null,
                })
                .eq('id', latestUserSubscription.id)
                .select(
                  'id, user_id, plan_id, billing_type, status, credits_total, credits_used'
                )
                .maybeSingle();

              if (takeoverError) {
                console.error('[paypal/finalize] 复用现有订阅记录失败', takeoverError);
              } else if (takeoverSubscription) {
                subscription = takeoverSubscription;
                console.log('[paypal/finalize] 复用现有订阅记录成功', {
                  subscriptionId: subscription.id,
                  planId,
                  billingType: normalizedBillingType,
                });
              }
            }
          }
        }

        if (!subscription) {
          return NextResponse.json(
            { error: '创建订阅记录失败，请稍后再试。' },
            { status: 500 }
          );
        }
      } else {
        subscription = newSubscription;
        console.log('[paypal/finalize] 成功创建订阅记录', {
          subscriptionId: subscription.id,
          planId,
          billingType: normalizedBillingType,
        });
      }
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

    // 验证 PayPal 支付状态（如果之前没有验证过）
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
    // 如果订阅记录是新创建的，使用已计算的值；否则重新计算
    const finalCreditsTotal =
      subscription.status === 'pending' && subscription.credits_total
        ? subscription.credits_total
        : getCreditsForPurchase(
            subscription.plan_id as PlanId,
            (subscription.billing_type ?? (payload.type === 'order' ? 'one_time' : 'monthly')) as PurchaseType
          );
    const cycleEnd = resolveCycleEnd(subscription.billing_type, now);

    const { data: updatedRow, error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active',
        credits_total: finalCreditsTotal,
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


