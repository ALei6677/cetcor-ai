'use client';

import { AuthApiError } from '@supabase/supabase-js';
import { supabaseBrowserClient } from './supabase-browser';

const getClient = () => {
  if (!supabaseBrowserClient) {
    throw new Error('Supabase 客户端未初始化，请检查环境配置。');
  }
  return supabaseBrowserClient;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function signInWithPassword(email: string, password: string) {
  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  emailRedirectTo?: string
) {
  const client = getClient();
  const { data, error } = await client.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: emailRedirectTo
      ? {
          emailRedirectTo,
        }
      : undefined,
  });
  if (error) {
    throw error;
  }
  return data;
}

export const isInvalidCredentialsError = (error: unknown): boolean => {
  if (error instanceof AuthApiError) {
    return error.message?.toLowerCase().includes('invalid login credentials');
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: string }).message ?? '');
    return message.toLowerCase().includes('invalid login credentials');
  }
  return false;
};

export const getAuthErrorMessage = (
  error: unknown,
  fallback = '认证失败，请稍后重试。'
) => {
  if (error instanceof AuthApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};


