'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PayPalButtons, PayPalButtonsComponentProps } from '@paypal/react-paypal-js';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { isOneTimePlanId } from '@/constants/billing';
import type { BillingType, PlanId } from '@/constants/billing';
import { useAuthToken } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

type PurchaseType = 'subscription' | 'one_time';

interface PayPalEmbeddedCheckoutProps {
  planId: PlanId;
  billingType: BillingType | null;
  purchaseType: PurchaseType;
  planLabel: string;
  priceLabel?: string;
  credits?: number;
  onRequireAuth?: () => Promise<void>;
  onSuccess?: (payload: { paypalId: string; purchaseType: PurchaseType }) => void;
}

class PayPalButtonBoundary extends React.Component<
  {
    onReset?: () => void;
    children: React.ReactNode;
  },
  { hasError: boolean; details?: string }
> {
  state = { hasError: false, details: undefined as string | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, details: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PayPal] ❌ PayPalButtons render failed', {
      error,
      componentStack: info.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, details: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">PayPal buttons failed to initialize.</p>
          {this.state.details && <p className="mt-1 text-red-600">{this.state.details}</p>}
          <Button size="sm" variant="outline" className="mt-3" onClick={this.handleReset}>
            Retry PayPal Buttons
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function PayPalEmbeddedCheckout(props: PayPalEmbeddedCheckoutProps) {
  const {
    planId,
    billingType,
    purchaseType,
    planLabel,
    priceLabel,
    credits,
    onRequireAuth,
    onSuccess,
  } = props;
  const { token, loading: authLoading } = useAuthToken();
  const [status, setStatus] = useState<'idle' | 'creating' | 'approving' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [buttonInstanceKey, setButtonInstanceKey] = useState(0);
  const renderCountRef = useRef(0);

  const requiresSubscriptionConfig =
    purchaseType === 'subscription' && (!billingType || !planId);

  const handleRequireAuth = useCallback(async () => {
    if (onRequireAuth) {
      await onRequireAuth();
      return;
    }

    // 兜底提示
    alert('请先登录账号后再完成支付。');
  }, [onRequireAuth]);

  const finalizePurchase = useCallback(
    async (type: PurchaseType, paypalId: string) => {
      if (!token) {
        throw new Error('请先登录后再完成支付。');
      }

      const res = await fetch('/api/paypal/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: type === 'one_time' ? 'order' : 'subscription',
          paypalId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '同步支付状态失败，请稍后再试。');
      }

      return data;
    },
    [token]
  );

  const handleCreateSubscription = useCallback<
    NonNullable<PayPalButtonsComponentProps['createSubscription']>
  >(async () => {
    console.log('[PayPal] ====== Create Subscription Flow Started ======');
    console.log('[PayPal] Input Parameters:', { 
      planId, 
      billingType, 
      hasToken: !!token,
      tokenLength: token?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!token) {
      console.warn('[PayPal] ❌ No authentication token found');
      console.log('[PayPal] Triggering authentication flow...');
      await handleRequireAuth();
      throw new Error('Please log in to complete payment.');
    }

    if (!planId || !billingType) {
      const errorMsg = 'Missing plan ID or billing type';
      console.error('[PayPal] ❌ Validation failed:', errorMsg, { planId, billingType });
      setError(errorMsg);
      setStatus('idle');
      throw new Error(errorMsg);
    }

    // Log PayPal Plan ID mapping
    console.log('[PayPal] Checking PayPal Plan ID mapping...');
    console.log('[PayPal] Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      hasPaypalMapping: !!process.env.PAYPAL_PLAN_MAPPING,
    });

    setError(null);
    setStatus('creating');
    console.log('[PayPal] Status changed to: creating');

    try {
      console.log('[PayPal] Sending request to /api/paypal/create-subscription');
      const requestBody = { planId, billingType };
      console.log('[PayPal] Request body:', requestBody);
      
      const res = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[PayPal] Response received:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
      });

      const data = await res.json();
      console.log('[PayPal] Response data:', data);

      if (!res.ok || !data.id) {
        const message = data.error || 'Failed to create subscription. Please try again.';
        console.error('[PayPal] ❌ Subscription creation failed:', {
          status: res.status,
          error: message,
          responseData: data,
        });
        setError(message);
        setStatus('idle');
        throw new Error(message);
      }

      console.log('[PayPal] ✅ Subscription created successfully');
      console.log('[PayPal] Subscription ID:', data.id);
      console.log('[PayPal] Subscription status:', data.status);
      console.log('[PayPal] Approval URL:', data.approvalUrl);
      setStatus('approving');
      console.log('[PayPal] Status changed to: approving');
      return data.id;
    } catch (err) {
      console.error('[PayPal] ❌ Exception during subscription creation:', err);
      if (err instanceof Error) {
        console.error('[PayPal] Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      }
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred while creating subscription';
      setError(errorMsg);
      setStatus('idle');
      throw err;
    }
  }, [token, planId, billingType, handleRequireAuth]);

  const handleCreateOrder = useCallback<
    NonNullable<PayPalButtonsComponentProps['createOrder']>
  >(async () => {
    console.log('[PayPal] ====== Create Order Flow Started ======');
    console.log('[PayPal] Input Parameters:', { 
      planId, 
      hasToken: !!token,
      tokenLength: token?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!token) {
      console.warn('[PayPal] ❌ No authentication token found');
      console.log('[PayPal] Triggering authentication flow...');
      await handleRequireAuth();
      throw new Error('Please log in to complete payment.');
    }

    if (!planId || !isOneTimePlanId(planId)) {
      const errorMsg = 'One-time payment is only available for Pro or Max plans';
      console.error('[PayPal] ❌ Validation failed:', errorMsg, { planId });
      setError(errorMsg);
      setStatus('idle');
      throw new Error(errorMsg);
    }

    setError(null);
    setStatus('creating');
    console.log('[PayPal] Status changed to: creating');

    try {
      console.log('[PayPal] Sending request to /api/paypal/create-order');
      const requestBody = { planId };
      console.log('[PayPal] Request body:', requestBody);
      
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[PayPal] Response received:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
      });

      const data = await res.json();
      console.log('[PayPal] Response data:', data);

      if (!res.ok || !data.id) {
        const message = data.error || 'Failed to create order. Please try again.';
        console.error('[PayPal] ❌ Order creation failed:', {
          status: res.status,
          error: message,
          responseData: data,
        });
        setError(message);
        setStatus('idle');
        throw new Error(message);
      }

      console.log('[PayPal] ✅ Order created successfully');
      console.log('[PayPal] Order ID:', data.id);
      setStatus('approving');
      console.log('[PayPal] Status changed to: approving');
      return data.id;
    } catch (err) {
      console.error('[PayPal] ❌ Exception during order creation:', err);
      if (err instanceof Error) {
        console.error('[PayPal] Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      }
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred while creating order';
      setError(errorMsg);
      setStatus('idle');
      throw err;
    }
  }, [token, planId, handleRequireAuth]);

  const handleApprove = useCallback<NonNullable<PayPalButtonsComponentProps['onApprove']>>(
    async (data) => {
      console.log('[PayPal] ====== Payment Approval Callback ======');
      console.log('[PayPal] Approval data:', {
        purchaseType,
        orderID: data.orderID,
        subscriptionID: data.subscriptionID,
        payerID: data.payerID,
        fullData: data,
        timestamp: new Date().toISOString(),
      });

      try {
        const paypalId =
          purchaseType === 'subscription' ? data.subscriptionID : data.orderID;

        if (!paypalId) {
          const errorMsg = 'Failed to retrieve PayPal payment ID';
          console.error('[PayPal] ❌', errorMsg, { data, purchaseType });
          throw new Error(errorMsg);
        }

        console.log('[PayPal] Starting payment finalization...');
        console.log('[PayPal] Payment details:', { paypalId, purchaseType });
        setError(null);
        setStatus('success');
        console.log('[PayPal] Status changed to: success');

        console.log('[PayPal] Calling finalizePurchase API...');
        await finalizePurchase(purchaseType, paypalId);
        console.log('[PayPal] ✅ Payment finalized successfully');
        console.log('[PayPal] Payment ID:', paypalId);

        console.log('[PayPal] Triggering success callback...');
        onSuccess?.({
          paypalId,
          purchaseType,
        });
        console.log('[PayPal] ====== Payment Flow Completed Successfully ======');
      } catch (err) {
        console.error('[PayPal] ❌ Payment approval processing failed:', err);
        if (err instanceof Error) {
          console.error('[PayPal] Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack,
          });
        }
        setError(err instanceof Error ? err.message : 'Payment synchronization failed. Please contact support.');
        setStatus('idle');
      }
    },
    [finalizePurchase, onSuccess, purchaseType]
  );

  const handleButtonError = useCallback(
    (err: unknown) => {
      console.error('[PayPal] ❌ Button error occurred:', err);
      console.error('[PayPal] Error details:', {
        error: err,
        errorString: String(err),
        errorType: typeof err,
        timestamp: new Date().toISOString(),
      });
      setStatus('idle');
      setError(
        'PayPal payment encountered an error. Please try again or contact support if the issue persists.'
      );
    },
    []
  );

  const buttonDisabled =
    !sdkReady ||
    !token ||
    authLoading ||
    !!requiresSubscriptionConfig ||
    status === 'creating';

  const buttonProps = useMemo<PayPalButtonsComponentProps>(() => {
    const base: PayPalButtonsComponentProps = {
      style: {
        layout: 'vertical',
        label: purchaseType === 'subscription' ? 'subscribe' : 'pay',
        height: 48,
      },
      onApprove: handleApprove,
      onError: handleButtonError,
      onCancel: () => {
        console.log('[PayPal] ⚠️ User cancelled payment');
        setStatus('idle');
        setError(null);
      },
      disabled: buttonDisabled,
      forceReRender: [planId, purchaseType, billingType ?? '', token ?? ''],
    };

    if (purchaseType === 'subscription') {
      base.createSubscription = handleCreateSubscription;
    } else {
      base.createOrder = handleCreateOrder;
    }

    return base;
  }, [
    billingType,
    buttonDisabled,
    handleApprove,
    handleButtonError,
    handleCreateOrder,
    handleCreateSubscription,
    planId,
    purchaseType,
    token,
  ]);

  const handleResetButtons = useCallback(() => {
    setButtonInstanceKey((key) => key + 1);
    setError(null);
    setStatus('idle');
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    console.log('[PayPal] SDK readiness monitor started');
    let attempts = 0;
    const maxAttempts = 20;
    const interval = window.setInterval(() => {
      attempts += 1;
      const scriptDetected = !!document.querySelector('script[src*="paypal"]');
      const namespaceReady = typeof window.paypal !== 'undefined' && !!window.paypal?.Buttons;

      if (attempts <= 3 || namespaceReady || attempts === maxAttempts) {
        console.log('[PayPal] SDK readiness update', {
          attempts,
          scriptDetected,
          namespaceReady,
          timestamp: new Date().toISOString(),
        });
      }

      if (namespaceReady) {
        setSdkReady(true);
        setSdkError(null);
        window.clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        const message =
          'PayPal SDK did not finish loading. Please refresh the page or switch network and try again.';
        setSdkError(message);
        setSdkReady(false);
        window.clearInterval(interval);
      }
    }, 700);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    renderCountRef.current += 1;
    console.log('[PayPal] Button render attempt', {
      renderCount: renderCountRef.current,
      sdkReady,
      buttonDisabled,
      purchaseType,
      planId,
      timestamp: new Date().toISOString(),
    });
  }, [sdkReady, buttonDisabled, purchaseType, planId]);

  const renderStatus = () => {
    if (sdkError) {
      return (
        <div className="flex flex-col gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold">PayPal SDK Error</span>
          </div>
          <p>{sdkError}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold">Payment Error</span>
          </div>
          <p>{error}</p>
          <p className="text-xs text-red-500 mt-1">
            If this issue persists, please contact support@cetcorai.com
          </p>
        </div>
      );
    }

    if (status === 'creating' || status === 'approving') {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {status === 'creating'
              ? 'Creating payment session...'
              : 'Waiting for PayPal to process payment...'}
          </span>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          <span>Payment successful! We&apos;re updating your credits now.</span>
        </div>
      );
    }

    return null;
  };

  // Debug information
  React.useEffect(() => {
    console.log('[PayPal] ====== Component State Update ======');
    console.log('[PayPal] Component state:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      authLoading,
      planId,
      billingType,
      purchaseType,
      requiresSubscriptionConfig,
      disabled: !token || authLoading || !!requiresSubscriptionConfig,
      currentStatus: status,
      hasError: !!error,
      timestamp: new Date().toISOString(),
    });
    
    // Check PayPal Script Provider
    if (typeof window !== 'undefined') {
      const paypalScript = document.querySelector('script[src*="paypal"]');
      console.log('[PayPal] PayPal script loaded:', !!paypalScript);
      if (paypalScript) {
        console.log('[PayPal] PayPal script src:', paypalScript.getAttribute('src'));
      }
    }
  }, [token, authLoading, planId, billingType, purchaseType, requiresSubscriptionConfig, status, error]);

  if (requiresSubscriptionConfig) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-red-500">
        No valid subscription cycle selected. Please select a plan first.
      </div>
    );
  }

  if (!token && !authLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
        <p>
          Please log in to enable PayPal embedded checkout. Credits will be automatically synced after
          payment completion.
        </p>
        <Button onClick={handleRequireAuth}>Log In Now</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white/80 p-3 sm:p-4 shadow-sm">
        <div className="space-y-1 text-xs sm:text-sm text-slate-600">
          <p>
            {planLabel}
            {priceLabel && (
              <span className="ml-2 font-semibold text-slate-900">{priceLabel}</span>
            )}
          </p>
          {typeof credits === 'number' && credits > 0 && (
            <p>
              This payment will unlock{' '}
              <span className="font-semibold text-slate-900">{credits.toLocaleString()} credits</span>
            </p>
          )}
        </div>
        <div className="mt-3 sm:mt-4">
          {!sdkReady && !sdkError ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading PayPal SDK...</span>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              <PayPalButtonBoundary key={buttonInstanceKey} onReset={handleResetButtons}>
                <PayPalButtons {...buttonProps} />
              </PayPalButtonBoundary>
            </div>
          )}
        </div>
      </div>
      {renderStatus()}
    </div>
  );
}
