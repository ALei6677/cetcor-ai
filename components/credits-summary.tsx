'use client';

import React from 'react';
import { AlertCircle, Coins, Loader2 } from 'lucide-react';
import { useSubscriptionSummary } from '@/hooks/use-subscription-summary';

interface CreditsSummaryProps {
  className?: string;
  size?: 'default' | 'compact';
}

export function CreditsSummary({ className = '', size = 'default' }: CreditsSummaryProps) {
  const { summary, loading, error, remainingCredits, authLoading, isAuthenticated } = useSubscriptionSummary();

  const wrapperPadding = size === 'compact' ? 'p-4' : 'p-5';
  const titleSize = size === 'compact' ? 'text-sm' : 'text-base';
  const valueSize = size === 'compact' ? 'text-2xl' : 'text-3xl';
  const descriptionSize = size === 'compact' ? 'text-xs' : 'text-sm';

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

