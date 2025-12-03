'use client';

import { useState, useEffect, useMemo, startTransition, useCallback } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import { useAuthToken } from '@/components/providers/auth-provider';
import { subscribeCreditsRefresh } from '@/lib/credits-events';

export interface SubscriptionSummary {
  credits_total: number | null;
  credits_used: number | null;
  status: string | null;
  plan_id: string | null;
  billing_type: string | null;
  current_cycle_end: string | null;
  current_cycle_start: string | null;
}

interface UseSubscriptionSummaryResult {
  summary: SubscriptionSummary | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  remainingCredits: number;
  /** 今日剩余的每日赠送积分 */
  remainingDaily: number;
  /** 总剩余积分 = 今日赠送剩余 + 套餐剩余 */
  totalRemaining: number;
  /** 主动刷新积分信息 */
  refreshCredits: () => void;
}

export function useSubscriptionSummary(): UseSubscriptionSummaryResult {
  const { token, loading: authLoading, user } = useAuthToken();
  const userId = user?.id ?? null;
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingDaily, setRemainingDaily] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refreshCredits = useCallback(() => {
    setRefreshNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCreditsRefresh(() => refreshCredits());
    return () => unsubscribe();
  }, [refreshCredits]);

  useEffect(() => {
    if (!supabaseBrowserClient || !token || !userId) {
      startTransition(() => {
        setSummary(null);
        setError(null);
        setLoading(false);
      });
    }
  }, [token, userId, refreshNonce]);

  useEffect(() => {
    if (!supabaseBrowserClient || !token || !userId) {
      return;
    }

    let isEffectMounted = true;
    startTransition(() => {
      setLoading(true);
    });

    const latestSubscriptionPromise = supabaseBrowserClient
      .from('user_subscriptions')
      .select(
        'credits_total, credits_used, status, plan_id, billing_type, current_cycle_end, current_cycle_start'
      )
      .eq('status', 'active')
      .eq('user_id', userId)
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
  }, [token, userId, refreshNonce]);

  const remainingCredits = useMemo(() => {
    if (!summary) return 0;
    return Math.max(0, (summary.credits_total ?? 0) - (summary.credits_used ?? 0));
  }, [summary]);

  // 额外从 /api/credits 读取“今日剩余赠送积分 + 总剩余积分”，用于前端展示
  useEffect(() => {
    if (!token || !userId) {
      startTransition(() => {
        setRemainingDaily(0);
        setTotalRemaining(remainingCredits);
      });
      return;
    }

    let cancelled = false;

    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          startTransition(() => {
            setRemainingDaily(0);
            setTotalRemaining(remainingCredits);
          });
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        const apiDaily = json?.data?.remainingDaily ?? 0;
        const apiTotal = json?.data?.totalRemaining ?? remainingCredits;
        startTransition(() => {
          setRemainingDaily(apiDaily);
          setTotalRemaining(apiTotal);
        });
      } catch {
        if (cancelled) return;
        startTransition(() => {
          setRemainingDaily(0);
          setTotalRemaining(remainingCredits);
        });
      }
    };

    fetchCredits();

    return () => {
      cancelled = true;
    };
  }, [token, userId, remainingCredits, refreshNonce]);

  return {
    summary,
    loading,
    error,
    remainingCredits,
    authLoading,
    isAuthenticated: Boolean(token),
    remainingDaily,
    totalRemaining,
    refreshCredits,
  };
}


