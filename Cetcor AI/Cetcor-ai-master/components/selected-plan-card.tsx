'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanId } from '@/constants/billing';
import { useTranslation } from '@/stores/language-store';

type BillingCycle = 'monthly' | 'yearly' | 'oneTime';

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

interface SelectedPlanCardProps {
  plan: Plan;
  billingCycle: BillingCycle;
  credits: number;
  className?: string;
}

export function SelectedPlanCard({
  plan,
  billingCycle,
  credits,
  className,
}: SelectedPlanCardProps) {
  const t = useTranslation();
  const planPricing = plan.pricing[billingCycle] ?? plan.pricing.yearly;
  const planHighlight = plan.highlight[billingCycle] ?? plan.highlight.yearly;
  const isOneTime = billingCycle === 'oneTime';

  const billingCycleLabel = isOneTime
    ? t.checkout.billedFrequency.oneTime
    : t.checkout.billedFrequency[billingCycle];

  const priceSuffix = isOneTime
    ? planPricing.suffix
    : billingCycle === 'monthly'
      ? '/month'
      : '/year';

  const creditPeriodLabel = isOneTime
    ? 'total'
    : billingCycle === 'monthly'
      ? 'per month'
      : 'per year';

  return (
    <div
      className={cn(
        'rounded-2xl sm:rounded-3xl border border-white/60 bg-white/90 p-5 sm:p-6 md:p-8 shadow-lg backdrop-blur',
        className
      )}
    >
      <div className="space-y-6">
        {/* Plan Name and Price */}
        <div className="space-y-3">
          {plan.badge && (
            <span className="inline-block rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
              {plan.badge}
            </span>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{plan.name}</h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-slate-900">
              {planPricing.total}
            </span>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {priceSuffix}
            </span>
          </div>
          {planPricing.original && !isOneTime && (
            <p className="text-sm text-muted-foreground line-through">{planPricing.original}</p>
          )}
          {planPricing.secondary && (
            <p className="text-sm font-medium text-emerald-600">{planPricing.secondary}</p>
          )}
        </div>

        {/* Billing Cycle Info */}
        <div className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Billing Cycle</span>
              <span className="font-semibold text-slate-900">{billingCycleLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Plan Highlight</span>
              <span className="font-semibold text-slate-900">{planHighlight}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Credits</span>
              <span className="text-right">
                <span className="block font-semibold text-emerald-600">
                  {credits.toLocaleString()} credits
                </span>
                <span className="text-xs text-slate-500">{creditPeriodLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">Plan Features</h3>
          <ul className="space-y-2 sm:space-y-2.5">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 sm:gap-3">
                <div className="mt-0.5 flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
                </div>
                <span className="text-xs sm:text-sm text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">调试信息</p>
            <p>Plan: {plan.id}</p>
            <p>Billing Cycle: {billingCycle}</p>
            <p>Price: {planPricing.total}</p>
            <p>Credits: {credits}</p>
          </div>
        )}
      </div>
    </div>
  );
}

