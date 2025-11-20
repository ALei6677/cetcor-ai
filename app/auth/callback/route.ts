import { NextRequest, NextResponse } from 'next/server';

/**
 * 认证回调路由
 * 
 * 重要：此路由不直接处理code交换，而是让客户端Supabase自动处理
 * 客户端配置了 detectSessionInUrl: true，会自动检测URL中的code并交换会话
 * 
 * 工作流程：
 * 1. Supabase重定向到 /auth/callback?code=xxx
 * 2. 此路由重定向到首页，保留code参数
 * 3. 客户端Supabase检测到URL中的code，自动交换会话
 * 4. 会话建立后，onAuthStateChange 会触发，更新认证状态
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // 如果Supabase返回了错误
  if (error) {
    console.error('[auth/callback] Supabase认证错误:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''}`, requestUrl.origin)
    );
  }

  // 如果有code参数，重定向到目标页面并保留code参数
  // 客户端Supabase会自动检测URL中的code并处理会话交换
  if (code) {
    const redirectUrl = new URL(next, requestUrl.origin);
    // 保留code参数，让客户端Supabase处理
    redirectUrl.searchParams.set('code', code);
    
    console.log('[auth/callback] 检测到认证code，重定向到目标页面（保留code参数）');
    
    // 直接重定向，客户端会处理code
    return NextResponse.redirect(redirectUrl);
  }

  // 如果没有code参数，重定向到首页
  console.warn('[auth/callback] 未检测到code参数');
  return NextResponse.redirect(new URL('/?error=no_code', requestUrl.origin));
}

