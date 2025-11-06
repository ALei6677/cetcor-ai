'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HeroCarousel } from '@/components/hero-carousel';
import { GenerationForm } from '@/components/generation-form';
import { ImageGallery } from '@/components/image-gallery';
import { HistoryDialog } from '@/components/history-dialog';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/stores/language-store';
import type { ISeedreamResponse } from '@/types/seedream.types';
import { History, Sparkles } from 'lucide-react';

/**
 * 首页组件
 * Cetcor AI 图片生成平台的主页面
 */
export default function HomePage() {
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslation();
  
  /**
   * 处理生成成功
   * @param result - API响应结果，包含生成的图片数据和提示词信息
   * @param prompt - 生成图片时使用的提示词
   */
  const handleGenerateSuccess = (result: ISeedreamResponse, prompt?: string) => {
    const images = result.data
      .map((img) => img.url)
      .filter((url): url is string => !!url);
    
    setGeneratedImages(images);
    // 更新当前提示词（如果提供了的话）
    if (prompt) {
      setCurrentPrompt(prompt);
    }
    setErrorMessage(null);
  };

  /**
   * 处理生成失败
   * @param error - 错误信息
   */
  const handleGenerateError = (error: string) => {
    setErrorMessage(error);
    // 5秒后自动清除错误信息，或用户可以手动关闭
    setTimeout(() => setErrorMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white/95 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cetcor AI
            </span>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="mr-2 h-4 w-4" />
              {t.nav.history}
            </Button>
            <Button variant="outline" size="sm">
              {t.nav.apiAccess}
            </Button>
            <Button size="sm">
              {t.nav.console}
            </Button>
            <Button variant="default" size="sm">
              {t.nav.goToHomepage}
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* 标题区 */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cetcor AI
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.hero.subtitle}
          </p>
        </div>

        {/* 轮播展示区 */}
        <section>
          <HeroCarousel />
        </section>

        {/* 自动组图模式说明 */}
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/95 border rounded-full px-4 py-2">
            <span className="text-sm font-medium">{t.form.modeLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.form.modeDescription}
          </p>
        </div>

        {/* 生成表单 */}
        <section className="bg-white/95 rounded-2xl shadow-lg p-8">
          <GenerationForm
            onGenerateSuccess={(result, prompt) => handleGenerateSuccess(result, prompt)}
            onGenerateError={handleGenerateError}
          />
          
          {/* 错误提示 */}
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm relative">
              <button
                onClick={() => setErrorMessage(null)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors"
                aria-label="关闭错误提示"
              >
                ✕
              </button>
              <p>{errorMessage}</p>
              <p className="text-xs text-red-400 mt-2">提示：错误信息将在 5 秒后自动消失</p>
            </div>
          )}
        </section>

        {/* 生成结果展示 */}
        {generatedImages.length > 0 && (
          <section className="bg-white/95 rounded-2xl shadow-lg p-8" style={{ contain: 'layout style paint' }}>
            <ImageGallery images={generatedImages} prompt={currentPrompt} />
          </section>
        )}

        {/* 底部说明 */}
        <footer className="text-center text-xs text-muted-foreground max-w-3xl mx-auto">
          {t.footer.disclaimer}
        </footer>
      </main>

      {/* 历史记录弹窗 */}
      <HistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
