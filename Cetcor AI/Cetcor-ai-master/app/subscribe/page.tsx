'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { PayPalEmbeddedCheckout } from '@/components/paypal-embedded-checkout';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/stores/language-store';
import { CreditsSummary } from '@/components/credits-summary';
import { AuthButton } from '@/components/auth-button';
import { SelectedPlanCard } from '@/components/selected-plan-card';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import {
  BillingType,
  ONE_TIME_PLAN_CREDITS,
  PlanId,
  SUBSCRIPTION_PLAN_CREDITS,
  isOneTimePlanId,
} from '@/constants/billing';

type BillingCycle = 'monthly' | 'yearly' | 'oneTime';

const BILLING_CYCLE_IDS: BillingCycle[] = ['monthly', 'yearly', 'oneTime'];
const AVAILABLE_PLAN_IDS: PlanId[] = ['basic', 'pro', 'max'];

interface PlanPricing {
  headline: string;
  suffix: string;
  secondary?: string;
  original?: string;
  badge?: string;
  total: string;
}

interface Plan {
  id: PlanId;
  name: string;
  description: string;
  badge?: string;
  highlight: Record<BillingCycle, string>;
  pricing: Record<BillingCycle, PlanPricing>;
  features: string[];
}

export default function SubscribePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-purple-50">
          <p className="text-sm text-slate-600">正在加载订阅信息...</p>
        </div>
      }
    >
      <SubscribePageContent />
    </React.Suspense>
  );
}

function SubscribePageContent() {
  const t = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plans = t.pricing.plans as Plan[];

  const planFromQuery = (searchParams.get('plan') as PlanId | null) ?? 'pro';
  const billingParam = searchParams.get('billing');

  const defaultCycle: BillingCycle = BILLING_CYCLE_IDS.includes(
    billingParam as BillingCycle
  )
    ? (billingParam as BillingCycle)
    : 'yearly';

  const normalizedPlanFromQuery: PlanId =
    planFromQuery && AVAILABLE_PLAN_IDS.includes(planFromQuery) ? planFromQuery : 'pro';
  const initialPlan: PlanId =
    defaultCycle === 'oneTime' && !isOneTimePlanId(normalizedPlanFromQuery)
      ? 'pro'
      : normalizedPlanFromQuery;

  const [billingCycle] = useState<BillingCycle>(defaultCycle);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);

  React.useEffect(() => {
    console.log('=== PayPal环境检查 ===');
    console.log('Client ID:', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '[未配置]');
    console.log(
      'Environment:',
      process.env.NEXT_PUBLIC_PAYPAL_ENV || process.env.PAYPAL_ENV || '[未暴露（服务器变量）]'
    );
    console.log(
      'Plan Mapping:',
      process.env.NEXT_PUBLIC_PAYPAL_PLAN_MAPPING || '[未暴露（服务器变量）]'
    );
  }, []);

  const updateQuery = useCallback(
    (planId: PlanId, cycle: BillingCycle) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      const normalizedPlan = cycle === 'oneTime' && !isOneTimePlanId(planId) ? 'pro' : planId;
      params.set('plan', normalizedPlan);
      params.set('billing', cycle);
      router.replace(`/subscribe?${params.toString()}`);
    },
    [router, searchParams]
  );

  const selectablePlans = useMemo(() => {
    if (billingCycle !== 'oneTime') {
      return plans;
    }
    return plans.filter((plan) => isOneTimePlanId(plan.id));
  }, [billingCycle, plans]);

  const effectivePlan = useMemo<Plan>(() => {
    const fallback = selectablePlans[0] ?? plans[0];
    if (!fallback) {
      throw new Error('No pricing plans configured');
    }
    return selectablePlans.find((plan) => plan.id === selectedPlan) ?? fallback;
  }, [plans, selectablePlans, selectedPlan]);

  React.useEffect(() => {
    if (!selectablePlans.length) {
      return;
    }
    const hasSelected = selectablePlans.some((plan) => plan.id === selectedPlan);
    if (!hasSelected) {
      const fallbackPlan = selectablePlans[0].id;
      setSelectedPlan(fallbackPlan);
      updateQuery(fallbackPlan, billingCycle);
    }
  }, [billingCycle, selectablePlans, selectedPlan, updateQuery]);

  const isOneTime = billingCycle === 'oneTime';
  const effectiveBillingCycle: BillingType = billingCycle === 'yearly' ? 'yearly' : 'monthly';
  const isOneTimeSupported = isOneTime ? isOneTimePlanId(selectedPlan) : true;

  const planPricing = effectivePlan.pricing[billingCycle];
  const priceSuffixLabel =
    billingCycle === 'oneTime'
      ? planPricing?.suffix ?? ''
      : billingCycle === 'monthly'
        ? '/month'
        : '/year';

  const planCredits = isOneTime
    ? (isOneTimePlanId(selectedPlan) ? ONE_TIME_PLAN_CREDITS[selectedPlan] : 0)
    : SUBSCRIPTION_PLAN_CREDITS[selectedPlan];

  const purchaseType: 'subscription' | 'one_time' = isOneTime ? 'one_time' : 'subscription';
  const billingType: BillingType | null = isOneTime ? null : effectiveBillingCycle;

  const handlePromptLogin = useCallback(async () => {
    if (!supabaseBrowserClient) {
      return;
    }
    const { error } = await supabaseBrowserClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });
    if (error) {
      console.error('登录失败:', error);
    }
  }, []);

  const planLabel = useMemo(() => {
    if (purchaseType === 'one_time') {
      return `${effectivePlan.name} · One-Time Credits`;
    }
    const label = billingType === 'yearly' ? 'Yearly' : 'Monthly';
    return `${effectivePlan.name} · ${label}`;
  }, [billingType, effectivePlan.name, purchaseType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-purple-50">
      <header className="border-b bg-white/95 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.checkout.back}
            </Link>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cetcor AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_0.9fr]">
          {/* 左侧：固定套餐信息卡片 */}
          <section className="order-2 lg:order-1">
            <SelectedPlanCard
              plan={effectivePlan}
              billingCycle={billingCycle}
              credits={planCredits}
            />
          </section>

          {/* 右侧：支付区域 */}
          <section className="order-1 space-y-4 sm:space-y-6 lg:order-2">
            <CreditsSummary />

            <div className="payment-section rounded-2xl sm:rounded-3xl border border-white/60 bg-white/95 p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur">
              {/* Total Amount Display */}
              <div className="mb-4 sm:mb-6 space-y-2 border-b border-slate-200 pb-4 sm:pb-6">
                <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-slate-500">
                  Order Total
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900">
                    {planPricing.total}
                  </span>
                  <span className="text-sm sm:text-base font-medium text-muted-foreground">
                    {priceSuffixLabel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {purchaseType === 'one_time'
                    ? 'One-time payment, credits never expire'
                    : billingType === 'yearly'
                      ? 'Yearly subscription, auto-renewal, cancel anytime'
                      : 'Monthly subscription, auto-renewal, cancel anytime'}
                </p>
              </div>

              {/* 支付按钮区域 */}
              <div className="mb-6">
                {isOneTime && !isOneTimeSupported ? (
                  <div className="space-y-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-700">
                    <p>One-time credit packages are only available for Pro and Max plans.</p>
                    <Link
                      href="/pricing"
                      className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                    >
                      Back to Pricing
                    </Link>
                  </div>
                ) : (
                  <PayPalEmbeddedCheckout
                    planId={selectedPlan}
                    billingType={billingType}
                    purchaseType={purchaseType}
                    planLabel={planLabel}
                    priceLabel={planPricing.total}
                    credits={planCredits}
                    onRequireAuth={handlePromptLogin}
                    onSuccess={({ paypalId, purchaseType: type }) => {
                      const params = new URLSearchParams();
                      params.set('paypal_id', paypalId);
                      params.set('type', type);
                      params.set('plan', selectedPlan);
                      params.set('billing', billingType ?? 'one_time');
                      router.push(`/payment/success?${params.toString()}`);
                    }}
                  />
                )}
              </div>

              {/* Security Badge */}
              <div className="flex items-start gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                </div>
                <div className="space-y-1 text-[11px] sm:text-xs text-slate-700">
                  <p className="font-semibold text-emerald-700">Secure Payment Processing</p>
                  <p>
                    Payments are securely processed through PayPal with bank-level SSL encryption. 
                    Credits are synced immediately upon payment completion, and our system verifies 
                    transactions via webhook to ensure your account is properly credited.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 text-xs sm:text-sm text-slate-600 shadow">
              <h4 className="text-base font-semibold text-slate-900">Frequently Asked Questions</h4>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>Credits are credited instantly. If you don&apos;t see changes, please refresh the page after 5 seconds.</li>
                <li>Unused credits from subscription plans do not roll over to the next billing cycle.</li>
                <li>For enterprise purchases or custom plans, please email us at support@cetcorai.com.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


