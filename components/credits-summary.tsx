'use client';

import React, { startTransition, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Coins, Loader2 } from 'lucide-react';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import { useAuthToken } from '@/components/providers/auth-provider';

interface SubscriptionSummary {
  credits_total: number;
  credits_used: number;
  status: string;
}

interface CreditsSummaryProps {
  className?: string;
  size?: 'default' | 'compact';
}

export function CreditsSummary({ className = '', size = 'default' }: CreditsSummaryProps) {
  const { token, loading: authLoading } = useAuthToken();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Track when component has mounted on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!supabaseBrowserClient || !token) {
      startTransition(() => {
        setSummary(null);
        setError(null);
        setLoading(false);
      });
    }
  }, [token]);

  useEffect(() => {
    if (!supabaseBrowserClient || !token) {
      return;
    }

    let isEffectMounted = true;
    startTransition(() => {
      setLoading(true);
    });
    const latestSubscriptionPromise = supabaseBrowserClient
      .from('user_subscriptions')
      .select('credits_total, credits_used, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    latestSubscriptionPromise
      .then(
        ({ data, error: queryError }) => {
          if (!isEffectMounted) return;
          if (queryError) {
            console.error('获取订阅信息失败:', queryError);
            startTransition(() => {
              setError('无法获取点数信息，请稍后再试');
              setSummary(null);
            });
          } else if (!data) {
            startTransition(() => {
              setError('暂无有效订阅，欢迎前往定价页购买套餐');
              setSummary(null);
            });
          } else {
            startTransition(() => {
              setSummary(data as SubscriptionSummary);
              setError(null);
            });
          }
        },
        (promiseError: unknown) => {
          /**
           * Supabase promise 失败的兜底日志，按规范输出便于定位网络异常
           */
          console.error('订阅查询 Promise 失败:', promiseError);
        }
      )
      .then(() => {
        if (isEffectMounted) {
          startTransition(() => {
            setLoading(false);
          });
        }
      });

    return () => {
      isEffectMounted = false;
    };
  }, [token]);

  const remainingCredits = useMemo(() => {
    if (!summary) return 0;
    return Math.max(0, (summary.credits_total ?? 0) - (summary.credits_used ?? 0));
  }, [summary]);

  const wrapperPadding = size === 'compact' ? 'p-4' : 'p-5';
  const titleSize = size === 'compact' ? 'text-sm' : 'text-base';
  const valueSize = size === 'compact' ? 'text-2xl' : 'text-3xl';
  const descriptionSize = size === 'compact' ? 'text-xs' : 'text-sm';

  // Only show authenticated state after component has mounted to avoid hydration mismatch
  const isAuthenticated = isMounted && Boolean(token);
  const stateIcon = (() => {
    if (loading || authLoading) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
    if (error || !isAuthenticated) {
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
    return <Coins className="h-5 w-5 text-emerald-600" />;
  })();

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur ${wrapperPadding} ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-slate-100 p-3">{stateIcon}</div>
        <div>
          <p className={`${titleSize} font-semibold text-slate-900`}>当前剩余点数</p>
          <p className={`${descriptionSize} text-slate-500`}>
            {isAuthenticated ? '从最新的激活订阅中读取' : '登录后即可查看当前套餐点数'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className={`${valueSize} font-bold text-slate-900`}>
          {isAuthenticated ? (
            loading ? (
              '加载中...'
            ) : summary ? (
              remainingCredits
            ) : (
              '--'
            )
          ) : (
            '--'
          )}
        </span>
        {isAuthenticated && summary && (
          <span className={`${descriptionSize} text-slate-500`}>
            共 {summary.credits_total ?? 0}，已用 {summary.credits_used ?? 0}
          </span>
        )}
      </div>

      {(error || !isAuthenticated) && (
        <p className={`${descriptionSize} mt-3 text-amber-600`}>
          {isAuthenticated ? error ?? '暂无有效订阅，请先购买套餐' : '请先登录以查看点数信息'}
        </p>
      )}
    </div>
  );
}

