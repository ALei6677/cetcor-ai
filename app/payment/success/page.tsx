'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreditsSummary } from '@/components/credits-summary';
import {
  ONE_TIME_PLAN_CREDITS,
  PlanId,
  SUBSCRIPTION_PLAN_CREDITS,
} from '@/constants/billing';
import { useAuthToken } from '@/components/providers/auth-provider';
import { emitCreditsRefresh } from '@/lib/credits-events';

const PLAN_NAME: Record<PlanId, string> = {
  basic: 'Basic',
  pro: 'Pro',
  max: 'Max',
};

export default function PaymentSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-purple-100">
          <p className="text-sm text-slate-600">正在获取支付结果...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </React.Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuthToken();

  const planId = (searchParams.get('plan') as PlanId) ?? 'pro';
  const purchaseTypeParam = searchParams.get('type');
  const billing = searchParams.get('billing') ?? 'monthly';
  const status = searchParams.get('status') ?? 'completed';
  const transactionToken = searchParams.get('tx') ?? searchParams.get('token');

  const paypalId =
    searchParams.get('paypal_id') ??
    searchParams.get('payment_id') ??
    searchParams.get('paymentId') ??
    searchParams.get('token') ??
    'unknown';

  const purchaseType = purchaseTypeParam === 'one_time' ? 'one_time' : 'subscription';
  const credits =
    purchaseType === 'one_time'
      ? ONE_TIME_PLAN_CREDITS[planId as Exclude<PlanId, 'basic'>] ?? 0
      : SUBSCRIPTION_PLAN_CREDITS[planId];

  useEffect(() => {
    // 刷新会话信息，并通知全局“积分可能发生变化”，触发前端实时重新拉取
    refresh();
    emitCreditsRefresh();
  }, [refresh]);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  const planTitle =
    purchaseType === 'one_time'
      ? `${PLAN_NAME[planId]} · One-Time Credits`
      : `${PLAN_NAME[planId]} · ${billing === 'yearly' ? 'Yearly' : 'Monthly'} Plan`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-purple-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16">
        <div className="rounded-3xl border border-white/60 bg-white/95 p-10 text-center shadow-xl backdrop-blur">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-slate-900">支付成功</h1>
          <p className="mt-2 text-sm text-slate-600">
            我们已经从 PayPal 收到支付确认，并开始同步你的积分。3 秒后将自动跳转至图片生成页。
          </p>

          <div className="mt-8 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-6 text-left text-sm text-slate-600 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">订单编号</p>
              <p className="font-semibold text-slate-900">{paypalId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">支付状态</p>
              <p className="font-semibold capitalize text-slate-900">{status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">套餐</p>
              <p className="font-semibold text-slate-900">{planTitle}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">本周期积分</p>
              <p className="font-semibold text-slate-900">{credits} 点</p>
            </div>
            {transactionToken && (
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">交易凭证</p>
                <p className="font-semibold text-slate-900">{transactionToken}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => router.push('/')} className="min-w-[200px]">
              开始生成图片
            </Button>
            <Button variant="outline" onClick={() => router.push('/subscribe')}>
              查看其他套餐
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg backdrop-blur">
          <CreditsSummary />
        </div>
      </div>
    </div>
  );
}


