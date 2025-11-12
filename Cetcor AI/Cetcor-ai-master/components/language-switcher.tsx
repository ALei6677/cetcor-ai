'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/stores/language-store';

/**
 * 语言切换器组件
 * 在中文和英文之间切换
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="flex items-center gap-2 bg-muted rounded-md p-1">
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="text-xs"
      >
        US
      </Button>
      <Button
        variant={language === 'zh' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('zh')}
        className="text-xs"
      >
        CN
      </Button>
    </div>
  );
}

