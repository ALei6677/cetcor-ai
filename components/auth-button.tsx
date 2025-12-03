'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import {
  getAuthErrorMessage,
  isInvalidCredentialsError,
  signInWithPassword,
  signUpWithPassword,
} from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubscriptionSummary } from '@/hooks/use-subscription-summary';
import type { PlanId } from '@/constants/billing';
import { useAuthToken } from '@/components/providers/auth-provider';
import { Loader2, Wallet } from 'lucide-react';
import { useTranslation } from '@/stores/language-store';
import { formatTimeUntilReset } from '@/lib/utils';
import { resolvePlanDisplayKey } from '@/lib/subscription';
import { useRouter } from 'next/navigation';

export const AuthButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPasswordLogin, setIsPasswordLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const isDevMode = process.env.NODE_ENV !== 'production';
  const tempMailDomains = ['mailinator.com', 'tempmail.io', '10minutemail.com', 'yopmail.com'] as const;
  const presetTestAccounts = [
    { email: 'cetcor-test-1@mailinator.com', password: 'Test123456!' },
    { email: 'cetcor-test-2@mailinator.com', password: 'Test123456!' },
  ];
  const { accountMenu: accountT, auth: authT } = useTranslation();

  const generateTestEmail = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    return `cetcor-${randomId}@${tempMailDomains[0]}`;
  };

  const syncToken = useCallback(
    async () => {
      if (!supabaseBrowserClient) {
        return;
      }

      const { data } = await supabaseBrowserClient.auth.getSession();
      setUserEmail(data.session?.user?.email ?? null);
    },
    []
  );

  useEffect(() => {
    // 初始同步一次 token 和用户信息
    syncToken().finally(() => setSessionChecked(true));

    if (!supabaseBrowserClient) return;

    // 监听 auth 状态变化，自动更新 token
    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange(() => {
      syncToken();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncToken]);

  const handleSignOut = async () => {
    if (!supabaseBrowserClient) return;
    setLoading(true);
    try {
      await supabaseBrowserClient.auth.signOut();
      setUserEmail(null);
    } finally {
      setLoading(false);
    }
  };

  const resetEmailDialogState = () => {
    setEmailInput('');
    setEmailSent(false);
    setEmailError(null);
    setGlobalError(null);
    setEmailSending(false);
    setPasswordInput('');
    setIsPasswordLogin(false);
    setPasswordMessage(null);
  };

  const handleEmailDialogChange = (open: boolean) => {
    setEmailDialogOpen(open);
    if (!open) {
      resetEmailDialogState();
    }
  };

  const resolveMagicLinkRedirect = () => {
    const localRedirect = 'http://localhost:3000/auth/callback';

    if (typeof window === 'undefined') {
      return localRedirect;
    }

    const { protocol, hostname, port } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return localRedirect;
    }

    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    return `${baseUrl}/auth/callback`;
  };

  const handleSendMagicLink = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!supabaseBrowserClient) {
      alert('认证功能未配置，请联系管理员。');
      return;
    }
    if (!emailInput.trim()) {
      setEmailError('请输入邮箱地址');
      return;
    }

    setEmailError(null);
    setGlobalError(null);
    setEmailSending(true);
    setEmailSent(false);

    try {
      const trimmedEmail = emailInput.trim();
      const { error } = await supabaseBrowserClient.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: resolveMagicLinkRedirect(),
        },
      });

      if (error) {
        console.error('发送登录邮件失败:', error);
        if (trimmedEmail.toLowerCase().endsWith('@example.com')) {
          setGlobalError('测试邮箱域名 @example.com 不被支持。请使用下方测试工具生成有效测试邮箱。');
        } else {
          setEmailError('发送失败，请稍后重试。');
        }
        return;
      }

      setEmailSent(true);
    } catch (err) {
      console.error('发送登录邮件异常:', err);
      const trimmedEmail = emailInput.trim();
      if (trimmedEmail.toLowerCase().endsWith('@example.com')) {
        setGlobalError('测试邮箱域名 @example.com 不被支持。请使用下方测试工具生成有效测试邮箱。');
      } else {
        setEmailError('发送失败，请稍后重试。');
      }
    } finally {
      setEmailSending(false);
    }
  };

  const handlePasswordAuth = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!supabaseBrowserClient) {
      alert('认证功能未配置，请联系管理员。');
      return;
    }
    const email = emailInput.trim();
    if (!email) {
      setEmailError('请输入邮箱地址');
      return;
    }
    if (!passwordInput) {
      setEmailError('请输入密码');
      return;
    }

    setEmailError(null);
    setGlobalError(null);
    setPasswordMessage(null);
    setEmailSending(true);

    const closeDialog = () => {
      setPasswordMessage('登录成功，窗口即将关闭');
      setTimeout(() => {
        handleEmailDialogChange(false);
      }, 800);
    };

    try {
      await signInWithPassword(email, passwordInput);
      await syncToken();
      closeDialog();
    } catch (error) {
      if (email.toLowerCase().endsWith('@example.com')) {
        setGlobalError('测试邮箱域名 @example.com 不被支持。请使用下方测试工具生成有效测试邮箱。');
        return;
      }
      if (isInvalidCredentialsError(error)) {
        try {
          await signUpWithPassword(email, passwordInput, resolveMagicLinkRedirect());
          setPasswordMessage('注册成功，正在自动登录...');
          await signInWithPassword(email, passwordInput);
          await syncToken();
          closeDialog();
          return;
        } catch (signupError) {
          const signupMessage = getAuthErrorMessage(signupError, '注册失败，请稍后重试。');
          if (signupMessage.toLowerCase().includes('invalid') && email.toLowerCase().endsWith('@example.com')) {
            setGlobalError('测试邮箱域名 @example.com 不被支持。请使用下方测试工具生成有效测试邮箱。');
            return;
          }
          setGlobalError(signupMessage);
          return;
        }
      }
      setGlobalError(getAuthErrorMessage(error, '登录失败，请稍后重试。'));
    } finally {
      setEmailSending(false);
    }
  };

  if (!sessionChecked) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {accountT.loading}
      </Button>
    );
  }

  if (!userEmail) {
    return (
      <div className="flex items-center gap-2">
        <Dialog open={emailDialogOpen} onOpenChange={handleEmailDialogChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {authT.emailLogin}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{authT.emailLogin}</DialogTitle>
              <DialogDescription>
                {isPasswordLogin ? '使用邮箱和密码快速登录或注册' : '我们将发送登录链接到您的邮箱'}
              </DialogDescription>
            </DialogHeader>
            {isDevMode && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                💡 <strong>测试提示：</strong>由于邮箱验证限制，请使用临时邮箱服务进行测试，系统会自动注册新账户。
              </div>
            )}
            <div className="flex gap-2 rounded-2xl bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordLogin(true);
                  setEmailError(null);
                  setGlobalError(null);
                  setEmailSent(false);
                }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isPasswordLogin ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
                }`}
              >
                密码登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordLogin(false);
                  setPasswordMessage(null);
                  setPasswordInput('');
                  setEmailError(null);
                  setGlobalError(null);
                }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  !isPasswordLogin ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
                }`}
              >
                魔法链接登录
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => (isPasswordLogin ? handlePasswordAuth(event) : handleSendMagicLink(event))}
            >
              <div className="space-y-2">
                <Label htmlFor="auth-email-input">邮箱地址</Label>
                <Input
                  id="auth-email-input"
                  type="email"
                  placeholder="name@example.com 或使用下方测试工具生成"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  required
                />
              </div>
              {isPasswordLogin && (
                <div className="space-y-2">
                  <Label htmlFor="auth-password-input">密码</Label>
                  <Input
                    id="auth-password-input"
                    type="password"
                    placeholder="输入密码，测试账户使用: Test123456!"
                    value={passwordInput}
                    onChange={(event) => setPasswordInput(event.target.value)}
                    required
                  />
                </div>
              )}
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              {globalError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                  {globalError}
                </div>
              )}
              {!isPasswordLogin && emailSent && (
                <p className="text-sm text-green-600">请查收邮箱中的登录链接</p>
              )}
              {isPasswordLogin && passwordMessage && (
                <p className="text-sm text-emerald-600">{passwordMessage}</p>
              )}
              <Button type="submit" className="w-full" disabled={emailSending}>
                {emailSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    处理中...
                  </span>
                ) : isPasswordLogin ? (
                  '登录 / 自动注册'
                ) : (
                  '发送验证邮件'
                )}
              </Button>
            </form>
            {isDevMode && (
              <>
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h3 className="mb-3 text-sm font-medium text-blue-800">🚀 开发环境测试工具</h3>
                  <div className="mb-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                      onClick={() => {
                        const newEmail = generateTestEmail();
                        setEmailInput(newEmail);
                        setPasswordInput('Test123456!');
                        setIsPasswordLogin(true);
                        setEmailError(null);
                        setGlobalError(null);
                        setPasswordMessage('已生成新的测试账户');
                        alert(
                          `生成的测试账户：\n邮箱: ${newEmail}\n密码: Test123456!\n\n如需查看邮件，请访问: https://www.mailinator.com/`
                        );
                      }}
                    >
                      生成新测试账户
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-blue-600">或选择预设账户：</p>
                    {presetTestAccounts.map((account, index) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => {
                          setEmailInput(account.email);
                          setPasswordInput(account.password);
                          setIsPasswordLogin(true);
                          setEmailError(null);
                          setGlobalError(null);
                          setPasswordMessage(`已填充测试账户 ${index + 1}`);
                        }}
                        className="w-full rounded border border-blue-200 bg-white px-3 py-2 text-sm text-blue-700 transition hover:bg-gray-50"
                      >
                        测试账户 {index + 1}: {account.email}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 rounded border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-700">
                    <p className="font-medium">使用说明：</p>
                    <ul className="mt-1 space-y-1">
                      <li>• 点击“生成新测试账户”创建随机邮箱</li>
                      <li>• 使用预设账户快速测试不同场景</li>
                      <li>• 密码统一为 Test123456!</li>
                      <li>
                        • 查看邮件请访问{' '}
                        <a
                          className="underline"
                          href="https://www.mailinator.com/"
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          mailinator.com
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                  <h4 className="mb-2 text-sm font-medium text-green-800">📧 如何查看测试邮件</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-green-700">
                    <li>使用生成的测试邮箱登录后</li>
                    <li>
                      打开{' '}
                      <a
                        className="font-medium underline"
                        href="https://www.mailinator.com/"
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        https://www.mailinator.com/
                      </a>
                    </li>
                    <li>在搜索框中输入邮箱前缀（如：cetcor-abc123）</li>
                    <li>点击“GO”查看收到的所有邮件</li>
                  </ol>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return <UserAccountMenu email={userEmail} onSignOut={handleSignOut} signOutLoading={loading} />;
};

interface UserAccountMenuProps {
  email: string;
  onSignOut: () => Promise<void>;
  signOutLoading: boolean;
}

const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ email, onSignOut, signOutLoading }) => {
  const {
    summary,
    loading,
    error,
    isAuthenticated,
    authLoading,
    remainingCredits,
    remainingDaily,
    totalRemaining,
  } = useSubscriptionSummary();
  const { user } = useAuthToken();
  const [menuVisible, setMenuVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { accountMenu: accountT } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setMenuVisible(false);
      }
    };

    if (menuVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [menuVisible]);

  const initials = useMemo(() => {
    const displayName = user?.user_metadata?.full_name ?? email;
    return displayName?.[0]?.toUpperCase() ?? 'U';
  }, [email, user?.user_metadata?.full_name]);

  // 顶部显示真实剩余积分：今日免费剩余 + 套餐剩余
  const totalPoints = totalRemaining;
  const planKey = resolvePlanDisplayKey(summary?.plan_id, summary?.billing_type);
  const fallbackPlanName =
    summary?.plan_id && accountT.planNames
      ? accountT.planNames[summary.plan_id as PlanId] ?? summary.plan_id
      : accountT.freePlan;
  const planLabel = accountT.planDisplay?.[planKey] ?? fallbackPlanName;
  const resetLabel = formatTimeUntilReset(summary?.current_cycle_end ?? null, accountT.reset);
  const helperText = error ?? accountT.helperText;
  const stats = [
    { label: accountT.dailyCreditsLabel, value: `${remainingDaily} ${accountT.pointsUnit}` },
    { label: accountT.planCreditsLabel, value: `${remainingCredits} ${accountT.pointsUnit}` },
    { label: accountT.planType, value: planLabel },
    { label: accountT.planTimeLabel, value: resetLabel },
  ];

  const handleSignOutClick = () => {
    setMenuVisible(false);
    void onSignOut();
  };

  const openMenu = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setMenuVisible(true);
  };

  const closeMenuWithDelay = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setMenuVisible(false);
    }, 200);
  };

  const toggleMenu = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setMenuVisible((prev) => !prev);
  };

  return (
    <div ref={containerRef} className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenuWithDelay}>
      <button
        type="button"
        aria-haspopup="true"
        onClick={toggleMenu}
        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm transition hover:shadow-md"
      >
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{accountT.triggerLabel}</p>
          <p className="text-sm font-medium text-slate-900 max-w-[160px] truncate">{email}</p>
        </div>
        <Wallet className="h-4 w-4 text-slate-400 sm:hidden" />
      </button>

      {menuVisible && (
        <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white">
            <div className="text-xs uppercase tracking-[0.2em] text-white/70">
              <span>{accountT.currentCredits}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-4xl font-semibold">
                {loading || authLoading ? accountT.loading : totalPoints}
              </p>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 px-3 py-1.5 text-[11px] font-semibold text-slate-900 shadow-md hover:brightness-110"
                onClick={() => {
                  setMenuVisible(false);
                  router.push('/pricing');
                }}
              >
                升级套餐
              </Button>
            </div>
            <p className="mt-2 text-xs text-white/80">{accountT.helperSecondary}</p>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            {isAuthenticated ? helperText : accountT.signInPrompt}
          </p>

          <div className="mt-4 grid gap-2">
            <Button
              variant="outline"
              className="w-full border-transparent bg-slate-800 text-white hover:bg-slate-700"
              onClick={handleSignOutClick}
              disabled={signOutLoading}
            >
              {signOutLoading ? accountT.signOutLoading : accountT.signOut}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};


