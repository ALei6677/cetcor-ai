'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/stores/language-store';

type BillingCycle = 'monthly' | 'yearly' | 'oneTime';

const BILLING_CYCLE_IDS: BillingCycle[] = ['monthly', 'yearly', 'oneTime'];

interface PlanPricing {
  headline: string;
  suffix: string;
  secondary?: string;
  original?: string;
  badge?: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  badge?: string;
  highlight: Record<BillingCycle, string>;
  pricing: Record<BillingCycle, PlanPricing>;
  features: string[];
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const t = useTranslation();
  const router = useRouter();

  const billingOptions = BILLING_CYCLE_IDS.map((id) => ({
    id,
    ...t.pricing.billingOptions[id],
  }));

  const plans = t.pricing.plans as Plan[];
  const handleSubscribe = (planId: string) => {
    router.push(`/checkout?plan=${planId}&billing=${billingCycle}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-purple-50">
      <header className="border-b bg-white/95 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.pricing.back}
            </Link>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cetcor AI
            </span>
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 space-y-12">
        <section className="text-center max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t.pricing.cancelAnytime}
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {t.pricing.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-inner">
              {billingOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setBillingCycle(option.id)}
                  className={cn(
                    'relative rounded-full px-5 py-2 text-sm font-medium transition-colors',
                    billingCycle === option.id
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-slate-900'
                  )}
                >
                  <span>{option.label}</span>
                  {option.helper && (
                    <span
                      className={cn(
                        'ml-2 text-xs font-semibold',
                        billingCycle === option.id
                          ? 'text-primary-foreground/80'
                          : 'text-emerald-600'
                      )}
                    >
                      {option.helper}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const pricing = plan.pricing[billingCycle];
            const highlight = plan.highlight[billingCycle];

            const isPopular = plan.badge && plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-3xl border bg-white/80 p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl',
                  isPopular &&
                    'border-primary shadow-primary/20 ring-2 ring-primary/40'
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-6 py-1 text-sm font-semibold text-primary-foreground shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <p className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {highlight}
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900">
                      {pricing.headline}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {pricing.suffix}
                    </span>
                    {pricing.badge && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                        {pricing.badge}
                      </span>
                    )}
                  </div>
                  {pricing.original && (
                    <div className="text-sm text-muted-foreground line-through">
                      {pricing.original}
                    </div>
                  )}
                  {pricing.secondary && (
                    <div className="text-sm font-medium text-emerald-600">
                      {pricing.secondary}
                    </div>
                  )}
                </div>

                <Button className="mt-6 w-full" onClick={() => handleSubscribe(plan.id)}>
                  {t.pricing.subscribe}
                </Button>

                <ul className="mt-8 space-y-3 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

