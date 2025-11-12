'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/stores/language-store';

type BillingCycle = 'monthly' | 'yearly' | 'oneTime';

const BILLING_CYCLE_IDS: BillingCycle[] = ['monthly', 'yearly', 'oneTime'];

interface PlanPricing {
  headline: string;
  suffix: string;
  secondary?: string;
  original?: string;
  badge?: string;
  total: string;
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

const DEFAULT_COUNTRY_OPTIONS = [
  { value: 'china', label: 'China' },
  { value: 'united-states', label: 'United States' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'united-kingdom', label: 'United Kingdom' },
];

const formatTemplate = (template: string, replacements: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '');

const isBillingCycle = (value: string | null): value is BillingCycle =>
  !!value && BILLING_CYCLE_IDS.includes(value as BillingCycle);

export default function CheckoutPage() {
  const t = useTranslation();
  const searchParams = useSearchParams();

  const plans = t.pricing.plans as Plan[];

  const planId = searchParams.get('plan');
  const billingParam = searchParams.get('billing');

  const billingCycle: BillingCycle = isBillingCycle(billingParam) ? billingParam : 'yearly';

  const plan = useMemo(
    () => plans.find((item) => item.id === planId) ?? plans[0],
    [plans, planId]
  );

  const pricing = plan.pricing[billingCycle];
  const highlight = plan.highlight[billingCycle];
  const checkout = t.checkout;
  const countryOptions =
    (checkout.countryOptions as { value: string; label: string }[] | undefined) ??
    DEFAULT_COUNTRY_OPTIONS;

  const heading = formatTemplate(checkout.heading, { plan: plan.name });
  const planLabel = formatTemplate(checkout.planLabel, { plan: plan.name });

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
              {checkout.back}
            </Link>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cetcor AI
            </span>
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3 text-xs font-medium text-emerald-600">
                <CreditCard className="h-4 w-4" />
                {checkout.paymentMethod}
              </div>

              <h1 className="mt-6 text-3xl font-semibold text-slate-900">{heading}</h1>

              <div className="mt-6 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">{pricing.total}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {checkout.pricePeriod[billingCycle]}
                  </span>
                </div>
                {pricing.secondary && (
                  <p className="text-sm text-muted-foreground">{pricing.secondary}</p>
                )}
              </div>

              <div className="mt-8 space-y-6 border-t border-dashed border-slate-200 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{planLabel}</p>
                    <p className="text-sm text-muted-foreground">{highlight}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {checkout.billedFrequency[billingCycle]}
                    </p>
                  </div>
                  <span className="text-base font-semibold text-slate-900">{pricing.total}</span>
                </div>

                <div className="space-y-4 rounded-2xl bg-slate-50/60 p-5">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{checkout.subtotal}</span>
                    <span>{pricing.total}</span>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    {checkout.addPromotionCode}
                  </button>
                  <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                    <span>{checkout.totalDueToday}</span>
                    <span>{pricing.total}</span>
                  </div>
                </div>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {checkout.secureNote}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-lg backdrop-blur">
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="email">
                  {checkout.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder={checkout.emailPlaceholder}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-900">{checkout.paymentMethod}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 sm:flex-none sm:min-w-[140px]"
                  >
                    <span>link</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#FFB300] px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#f5a400] sm:flex-none sm:min-w-[140px]"
                  >
                    <span>amazon pay</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                  <span className="h-px flex-1 rounded-full bg-slate-200" />
                  {checkout.orDivider}
                  <span className="h-px flex-1 rounded-full bg-slate-200" />
                </div>
              </div>

              <fieldset className="space-y-4">
                <legend className="sr-only">{checkout.paymentMethods.card}</legend>
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                  <input
                    type="radio"
                    name="payment-method"
                    defaultChecked
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/40"
                  />
                  {checkout.paymentMethods.card}
                </label>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {checkout.cardInformation}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={checkout.cardNumberPlaceholder}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={checkout.expiryPlaceholder}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={checkout.cvcPlaceholder}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {checkout.cardholderName}
                    </span>
                    <input
                      type="text"
                      placeholder={checkout.cardholderPlaceholder}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <label
                      htmlFor="country-or-region"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {checkout.countryOrRegion}
                    </label>
                    <select
                      id="country-or-region"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {countryOptions.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300">
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-method"
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/40"
                    />
                    {checkout.paymentMethods.cashApp}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                    {checkout.cashAppBonus}
                  </span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-300">
                  <input
                    type="radio"
                    name="payment-method"
                    className="h-4 w-4 border-slate-300 text-primary focus:ring-primary/40"
                  />
                  {checkout.paymentMethods.bank}
                </label>
              </div>

              <Button type="submit" className="h-12 w-full text-base font-semibold">
                {checkout.subscribeButton}
              </Button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

