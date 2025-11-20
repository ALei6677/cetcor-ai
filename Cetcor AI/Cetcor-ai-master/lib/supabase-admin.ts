import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  // 在构建期抛出更友好的错误可以帮助排查环境变量问题
  console.warn(
    '[supabase-admin] NEXT_PUBLIC_SUPABASE_URL 未配置，相关计费与认证功能将无法正常工作。'
  );
}

if (!serviceRoleKey) {
  console.warn(
    '[supabase-admin] SUPABASE_SERVICE_ROLE_KEY 未配置，Webhook 同步与扣点逻辑将无法正常工作。'
  );
}

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

/**
 * 从请求头中解析 Supabase JWT 并获取用户
 * 约定：前端在请求时通过 `Authorization: Bearer <access_token>` 传递 token
 */
export async function getUserFromRequest(request: Request) {
  if (!supabaseAdmin) return null;

  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}


