import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const isBrowser = typeof window !== 'undefined';
const isDevEnv = process.env.NODE_ENV !== 'production';
const hasSupabaseConfig = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

if (isBrowser && isDevEnv) {
  console.debug('[supabase-browser] 环境变量检查', {
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
  });
}

if (!supabaseUrl || (!supabaseAnonKey && isBrowser)) {
  // 在浏览器侧给出提示，方便排查环境问题（不会阻止应用运行）
  console.warn(
    '[supabase-browser] NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY 未配置，前端认证功能不可用。'
  );
}

const shouldCreateClient = isBrowser && hasSupabaseConfig;

if (!shouldCreateClient && isDevEnv) {
  console.debug('[supabase-browser] Supabase 客户端未创建', {
    isBrowser,
    hasSupabaseConfig,
  });
}

export const supabaseBrowserClient = shouldCreateClient
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // 明确使用 PKCE 流程
      },
    })
  : null;

if (supabaseBrowserClient && isDevEnv) {
  console.debug('[supabase-browser] Supabase 客户端已初始化', {
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
  });
}


