'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DISPATCH_ACTION,
  PayPalButtons,
  PayPalButtonsComponentProps,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import type { BillingType, PlanId } from '@/constants/billing';
import {
  PLAN_IDS,
  PLAN_PRICING,
  SubscriptionBillingCycle,
  getPlanPricing,
} from '@/constants/plan-pricing';
import { useAuthToken } from '@/components/providers/auth-provider';
import { Loader2 } from 'lucide-react';

type BillingCycle = SubscriptionBillingCycle;

const planLabels: Record<PlanId, string> = {
  basic: 'Basic',
  pro: 'Pro',
  max: 'Max',
};

const capitalizeBilling = (cycle: BillingCycle) => (cycle === 'monthly' ? 'month' : 'year');

const formatPrice = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const validatePricingDisplay = () => {
  console.group('=== 价格显示验证 ===');
  PLAN_IDS.forEach((plan) => {
    (['monthly', 'yearly'] as BillingCycle[]).forEach((cycle) => {
      const pricing = getPlanPricing(plan, cycle);
      console.log(
        `${planLabels[plan]} - ${cycle}: ${formatPrice(pricing.price)}/${capitalizeBilling(cycle)}`
      );
    });
  });
  console.groupEnd();
};

interface PriceDisplayProps {
  plan: PlanId;
  billingCycle: BillingCycle;
  isSelected: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ plan, billingCycle, isSelected }) => {
  const pricing = PLAN_PRICING[plan][billingCycle];
  const monthlyTotal = PLAN_PRICING[plan].monthly.price * 12;
  const yearlySavings =
    billingCycle === 'yearly' ? monthlyTotal - PLAN_PRICING[plan].yearly.price : 0;

  return (
    <div
      className={`rounded-lg border p-4 transition ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{planLabels[plan]}</h3>
        <span className="text-sm text-gray-500">{pricing.credits} credits</span>
      </div>
      <div className="my-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{formatPrice(pricing.price)}</span>
        <span className="text-gray-600">/{capitalizeBilling(billingCycle)}</span>
      </div>
      {billingCycle === 'yearly' && (
        <div className="text-sm text-green-600">
          Save {formatPrice(yearlySavings)} per year
        </div>
      )}
      <p className="mt-3 text-sm text-gray-600">
        {pricing.credits} credits per {capitalizeBilling(billingCycle)}
      </p>
    </div>
  );
};

interface OrderSummaryProps {
  selectedPlan: PlanId;
  billingCycle: BillingCycle;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ selectedPlan, billingCycle }) => {
  const pricing = PLAN_PRICING[selectedPlan][billingCycle];

  return (
    <div className="rounded-lg bg-gray-50 p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">ORDER TOTAL</h3>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(pricing.price)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-900">
          <span>Total due today</span>
          <span>{formatPrice(pricing.price)}</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} subscription, auto-renewal, cancel anytime
      </p>
      <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-gray-700">
        <p className="font-medium">
          {planLabels[selectedPlan]} · {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} plan
        </p>
        <p>
          {formatPrice(pricing.price)} billed per {capitalizeBilling(billingCycle)} · unlocks{' '}
          {pricing.credits} credits
        </p>
      </div>
    </div>
  );
};

type PaymentStatus = 'idle' | 'creating' | 'awaitingApproval' | 'approving' | 'success' | 'error';

interface PayPalButtonProps {
  planId: PlanId;
  billingCycle: BillingCycle;
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ planId, billingCycle }) => {
  const { token, loading } = useAuthToken();
  const [{ options }, dispatch] = usePayPalScriptReducer();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const amount = PLAN_PRICING[planId][billingCycle].price;

  React.useEffect(() => {
    if (!options) {
      return;
    }
    if (options.intent === 'subscription' && options.vault === true) {
      return;
    }

    console.log('[Checkout] Resetting PayPal script options for subscriptions', {
      previousIntent: options.intent,
      nextIntent: 'subscription',
      previousVault: options.vault,
      nextVault: true,
    });

    dispatch({
      type: DISPATCH_ACTION.RESET_OPTIONS,
      value: {
        ...options,
        intent: 'subscription',
        vault: true,
      },
    });
  }, [dispatch, options]);

  const createSubscription = useCallback<
    NonNullable<PayPalButtonsComponentProps['createSubscription']>
  >(async () => {
    if (!token) {
      const message = 'Please log in to continue with PayPal checkout.';
      setError(message);
      throw new Error(message);
    }

    setStatus('creating');
    setError(null);

    const response = await fetch('/api/paypal/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId,
        billingType: billingCycle as BillingType,
        amount,
        paypalPlanId: PLAN_PRICING[planId][billingCycle].paypalPlanId,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      const message = data.error || 'Failed to create subscription. Please try again.';
      setStatus('error');
      setError(message);
      throw new Error(message);
    }

    setStatus('awaitingApproval');
    return data.id as string;
  }, [amount, billingCycle, planId, token]);

  const handleApprove = useCallback<NonNullable<PayPalButtonsComponentProps['onApprove']>>(
    async (details) => {
      if (!token) {
        const message = 'Please log in to finalize your payment.';
        setError(message);
        throw new Error(message);
      }

      const paypalId = details.subscriptionID ?? details.orderID;
      if (!paypalId) {
        const message = 'PayPal did not return a subscription ID.';
        setError(message);
        setStatus('error');
        throw new Error(message);
      }

      setStatus('approving');

      const response = await fetch('/api/paypal/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'subscription',
          paypalId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload.error || 'Failed to finalize subscription.';
        setError(message);
        setStatus('error');
        throw new Error(message);
      }

      setStatus('success');
      setError(null);
    },
    [token]
  );

  const handleError = useCallback<NonNullable<PayPalButtonsComponentProps['onError']>>((err) => {
    console.error('[Checkout] PayPal button error', err);
    setStatus('error');
    setError(err instanceof Error ? err.message : 'PayPal encountered an unknown error.');
  }, []);

  const handleCancel = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  if (!token && !loading) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        请先登录账号以启用 PayPal 结账。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <PayPalButtons
          style={{ layout: 'vertical' }}
          disabled={!token || status === 'creating'}
          createSubscription={createSubscription}
          onApprove={handleApprove}
          onError={handleError}
          onCancel={handleCancel}
          forceReRender={[planId, billingCycle, amount, token ?? '', status]}
        />
          </div>
      {status === 'creating' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating PayPal session...
          </div>
      )}
      {status === 'awaitingApproval' && (
        <p className="text-sm text-blue-600">Waiting for PayPal approval...</p>
      )}
      {status === 'approving' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finalizing payment...
        </div>
      )}
      {status === 'success' && (
        <p className="text-sm font-medium text-emerald-600">
          Payment successful! Credits will be added shortly.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          {error} {status === 'error' && 'Please retry or contact support.'}
        </p>
      )}
    </div>
  );
};

const PricingDebugPanel = () => (
  <div className="mt-8 rounded-lg bg-gray-100 p-4">
    <h3 className="mb-3 font-semibold text-gray-900">价格显示测试</h3>
    <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-2">
      {PLAN_IDS.map((plan) => (
        <div key={plan}>
          <p className="font-medium text-gray-900">{planLabels[plan]}</p>
          {(Object.keys(PLAN_PRICING[plan]) as BillingCycle[]).map((cycle) => (
            <p key={cycle}>
              {cycle}: {formatPrice(PLAN_PRICING[plan][cycle].price)}/
              {cycle === 'monthly' ? '月' : '年'}
            </p>
          ))}
        </div>
      ))}
    </div>
              </div>
);

export default function CheckoutPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      validatePricingDisplay();
    }
  }, []);

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-10">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            Secure checkout
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Choose your plan</h1>
          <p className="mt-2 text-gray-600">
            Toggle billing cycles to see the exact monthly or yearly pricing before you pay.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap gap-3">
          {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                billingCycle === cycle
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly (Save up to 50%)'}
            </button>
          ))}
                </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_IDS.map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => setSelectedPlan(plan)}
              className="text-left"
              aria-label={`${planLabels[plan]} ${billingCycle} plan`}
            >
              <PriceDisplay
                plan={plan}
                billingCycle={billingCycle}
                isSelected={selectedPlan === plan}
              />
            </button>
          ))}
                </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
            <p className="mt-1 text-sm text-gray-600">
              Review your plan before starting the PayPal checkout.
            </p>
            <div className="mt-6">
              <OrderSummary selectedPlan={selectedPlan} billingCycle={billingCycle} />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Pay with PayPal</h2>
            <p className="mt-1 text-sm text-gray-600">
              We use PayPal Subscriptions so you can cancel anytime inside your PayPal dashboard.
            </p>
            <div className="mt-6">
              <PayPalButton planId={selectedPlan} billingCycle={billingCycle} />
              </div>
          </section>
        </div>

        {process.env.NODE_ENV === 'development' && <PricingDebugPanel />}
      </div>
    </div>
  );
}