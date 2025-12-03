import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabase-admin';
import { FREE_PLAN_DAILY_CREDITS } from '@/constants/billing';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, data: null, error: 'Supabase 未正确配置' },
        { status: 500 }
      );
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, data: null, error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

    // 1. 统计当日已使用的每日赠送点数
    const { data: dailyRows, error: dailyError } = await supabaseAdmin
      .from('credit_transactions')
      .select('credits')
      .eq('user_id', user.id)
      .eq('reason', 'daily_usage')
      .gte('created_at', todayStart.toISOString());

    if (dailyError) {
      console.error('[credits] 查询每日使用点数失败:', dailyError);
    }

    const totalDailyUsed =
      dailyRows?.reduce((sum, row) => sum + (row.credits as number), 0) ?? 0;

    const remainingDaily = Math.max(0, FREE_PLAN_DAILY_CREDITS - totalDailyUsed);

    // 2. 查询当前订阅剩余点数
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('credits_total, credits_used, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('[credits] 查询订阅信息失败:', subError);
    }

    const remainingPlan =
      subscription && subscription.credits_total != null && subscription.credits_used != null
        ? Math.max(0, (subscription.credits_total as number) - (subscription.credits_used as number))
        : 0;

    const totalRemaining = remainingDaily + remainingPlan;

    return NextResponse.json({
      success: true,
      data: {
        remainingDaily,
        remainingPlan,
        totalRemaining,
      },
      error: null,
    });
  } catch (error) {
    console.error('[credits] 未知错误:', error);
    return NextResponse.json(
      { success: false, data: null, error: '获取剩余积分失败' },
      { status: 500 }
    );
  }
}


