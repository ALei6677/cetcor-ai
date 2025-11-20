'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

interface AuthContextValue {
  token: string | null;
  loading: boolean;
  user: User | null;
  refresh: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  loading: true,
  user: null,
  refresh: async () => null,
});

const TOKEN_STORAGE_KEY = 'cetcor_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((value: string | null) => {
    if (typeof window === 'undefined') return;
    if (value) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, value);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const syncSession = useCallback(async () => {
    if (!supabaseBrowserClient) {
      setToken((prev) => prev ?? null);
      setUser(null);
      return null;
    }

    const { data, error } = await supabaseBrowserClient.auth.getSession();

    if (error) {
      console.error('[AuthProvider] 获取会话时出错:', error);
    }

    const nextToken = data.session?.access_token ?? null;
    setToken(nextToken);
    setUser(data.session?.user ?? null);
    persistToken(nextToken);

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[AuthProvider] 会话同步完成', {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        userEmail: data.session?.user?.email,
        error: error?.message,
      });
    }

    return data.session ?? null;
  }, [persistToken]);

  useEffect(() => {
    if (!supabaseBrowserClient) {
      setToken((prev) => prev ?? null);
      setUser(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const hydrateSession = async () => {
      try {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');

          if (code) {
            console.log('[AuthProvider] 检测到URL中的code参数，等待页面组件处理...');
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        await syncSession();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      // 在开发环境下记录日志
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[AuthProvider] 认证状态变化', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
        });
      }
      
      const nextToken = session?.access_token ?? null;
      setToken(nextToken);
      setUser(session?.user ?? null);
      persistToken(nextToken);
      
      // 如果是SIGNED_IN事件，确保loading状态已更新
      if (event === 'SIGNED_IN' && isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [persistToken, syncSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      loading,
      user,
      refresh: syncSession,
    }),
    [token, loading, user, syncSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthToken() {
  return useContext(AuthContext);
}

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

