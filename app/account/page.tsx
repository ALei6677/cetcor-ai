'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, ShieldCheck, User, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuthToken } from '@/components/providers/auth-provider';
import { useSubscriptionSummary } from '@/hooks/use-subscription-summary';
import { FREE_PLAN_DAILY_CREDITS, type PlanId } from '@/constants/billing';
import { formatTimeUntilReset } from '@/lib/utils';
import { resolvePlanDisplayKey, normalizePlanId } from '@/lib/subscription';
import { useTranslation } from '@/stores/language-store';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

const AccountPage = () => {
  const router = useRouter();
  const { user } = useAuthToken();
  const { summary, loading, authLoading, totalRemaining } = useSubscriptionSummary();
  const { accountPage, accountMenu } = useTranslation();
  const [signOutLoading, setSignOutLoading] = useState(false);

  const planId = normalizePlanId(summary?.plan_id) ?? 'free';
  const planDisplayKey = resolvePlanDisplayKey(summary?.plan_id, summary?.billing_type);
  const planLabel =
    accountMenu.planDisplay?.[planDisplayKey] ??
    (summary?.plan_id ? accountMenu.planNames?.[summary.plan_id as PlanId] ?? summary.plan_id : accountMenu.freePlan);

  const planCredits = summary?.credits_total ?? 0;
  // 使用真实剩余积分（今日免费剩余 + 套餐剩余）
  const currentPoints = totalRemaining;
  const resetLabel = formatTimeUntilReset(summary?.current_cycle_end ?? null, accountMenu.reset);
  const perks = useMemo(() => accountPage.planPerks[planId], [accountPage.planPerks, planId]);

  const displayName = user?.user_metadata?.full_name ?? accountPage.placeholders.name;
  const email = user?.email ?? accountPage.placeholders.email;

  const handleSignOut = async () => {
    if (!supabaseBrowserClient) return;
    setSignOutLoading(true);
    try {
      await supabaseBrowserClient.auth.signOut();
      router.push('/');
    } finally {
      setSignOutLoading(false);
    }
  };

  if (!user && !authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-semibold">{accountPage.loginRequired}</p>
          <Button className="mt-6" onClick={() => router.push('/')}>
            {accountPage.goHome}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{accountPage.title}</p>
            <h1 className="mt-2 text-3xl font-semibold">{accountPage.subtitle}</h1>
          </div>
          <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {accountPage.back}
          </Button>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[340px,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-2xl font-semibold">
                  {displayName?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="text-lg font-semibold">{displayName}</p>
                  <p className="text-sm text-slate-400">{email}</p>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>{accountPage.labels.plan}</span>
                  <span className="font-medium text-white">{planLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{accountPage.labels.dailyCredits}</span>
                  <span className="font-medium text-white">{FREE_PLAN_DAILY_CREDITS}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{accountPage.labels.planCredits}</span>
                  <span className="font-medium text-white">{planCredits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{accountPage.labels.nextReset}</span>
                  <span className="font-medium text-white">{resetLabel}</span>
                </div>
              </div>
              <Button
                variant="secondary"
                className="mt-6 w-full justify-center bg-white/10 text-slate-50 hover:bg-white/20"
                disabled={signOutLoading || authLoading}
                onClick={handleSignOut}
              >
                {signOutLoading ? accountPage.actions.signOutLoading : accountPage.actions.signOut}
                <LogOut className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-3xl bg-slate-900/60 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{accountPage.sections.credits}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary"
                  onClick={() => router.push('/pricing')}
                >
                  {accountPage.actions.upgrade}
                </Button>
              </div>
              <p className="mt-4 text-4xl font-semibold text-white">
                {loading ? accountMenu.loading : currentPoints}
              </p>
              <p className="mt-2 text-sm text-slate-400">{accountPage.infoHelper}</p>
              <div className="mt-5 grid gap-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>{accountPage.labels.currentPoints}</span>
                  <span className="font-medium text-white">{currentPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{accountPage.labels.planCredits}</span>
                  <span className="font-medium text-white">{planCredits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{accountPage.labels.dailyCredits}</span>
                  <span className="font-medium text-white">{FREE_PLAN_DAILY_CREDITS}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{accountPage.labels.refreshHint}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white/5 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{accountPage.sections.plan}</p>
                <Wallet className="h-5 w-5 text-emerald-300" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{planLabel}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {accountPage.labels.planCredits}: {planCredits}
              </p>
              <div className="mt-6 space-y-3">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-3 rounded-2xl bg-slate-900/70 p-3 text-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <Button
                className="mt-6 w-full"
                onClick={() => router.push('/pricing')}
              >
                {accountPage.actions.upgrade}
              </Button>
              <p className="mt-3 text-xs text-slate-400">{accountPage.perksHelper}</p>
            </div>

            <div className="rounded-3xl bg-slate-900/70 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{accountPage.sections.profile}</p>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800/60 p-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-slate-500">{accountPage.labels.name}</span>
                    <span className="font-medium text-white">{displayName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800/60 p-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-slate-500">{accountPage.labels.email}</span>
                    <span className="font-medium text-white">{email}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="mt-5 w-full text-white border-slate-700">
                {accountPage.actions.updateProfile}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AccountPage;


