'use client';

import Link from 'next/link';
import { useLanguageStore } from '@/stores/language-store';

/**
 * 底部隐私政策 / 服务条款链接
 * 使用客户端组件以支持中英文切换
 */
export function FooterLinks() {
  const language = useLanguageStore((state) => state.language);

  const privacyLabel = language === 'zh' ? '隐私政策' : 'Privacy Policy';
  const termsLabel = language === 'zh' ? '服务条款' : 'Terms of Service';

  return (
    <>
      <Link
        href="/privacy"
        className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors"
      >
        {privacyLabel}
      </Link>
      <span className="h-3 w-px bg-slate-400/60" />
      <Link
        href="/terms"
        className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors"
      >
        {termsLabel}
      </Link>
    </>
  );
}


