'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
// import { HeroCarousel } from '@/components/hero-carousel';
import { GenerationForm } from '../components/generation-form';
import { ImageGallery } from '@/components/image-gallery';
import { InspirationGallery } from '@/components/inspiration-gallery';
import { HistoryDialog } from '@/components/history-dialog';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/stores/language-store';
import { AuthButton } from '@/components/auth-button';
import { useSubscriptionSummary } from '@/hooks/use-subscription-summary';
import type {
  IGenerationHistoryItem,
  IGenerationMetadata,
  ISeedreamResponse,
} from '@/types/seedream.types';
import { History, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

/**
 * 首页组件
 * Cetcor AI 图片生成平台的主页面
 */
export default function HomePage() {
  const [generationHistory, setGenerationHistory] = useState<IGenerationHistoryItem[]>([]);
  const [prefillPrompt, setPrefillPrompt] = useState<string>('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expectedImages, setExpectedImages] = useState<number | null>(null);
  // 生成过程的预估剩余时间（秒），用于在占位卡片中展示简单倒计时提示
  const [generationEta, setGenerationEta] = useState<number | null>(null);
  const [editMetadataForForm, setEditMetadataForForm] = useState<IGenerationMetadata | null>(null);
  const formRef = useRef<HTMLElement>(null);
  const t = useTranslation();
  const { summary, isAuthenticated } = useSubscriptionSummary();
  const isFreeUser = isAuthenticated && !summary;
  
  // 处理认证回调：主动触发会话交换并清理URL参数
  useEffect(() => {
    if (typeof window === 'undefined' || !supabaseBrowserClient) return;
    
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      // 如果有错误参数，显示错误信息
      if (error) {
        console.error('[page] 认证错误:', error, errorDescription);
        setErrorMessage(errorDescription || error || '认证失败，请重试');
        // 清理URL参数
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        newUrl.searchParams.delete('error_description');
        window.history.replaceState({}, '', newUrl.toString());
        return;
      }
      
      // 如果有code参数，触发 Supabase 的自动检测
      // detectSessionInUrl: true 应该会自动处理，但我们主动调用 getSession() 来触发
      if (code) {
        console.log('[page] 检测到认证code，等待 Supabase 自动处理...');
        
        // Supabase 的 detectSessionInUrl 会在客户端初始化时自动检测 URL 中的 code
        // 我们等待一小段时间让 Supabase 处理，然后检查会话状态
        // 如果 AuthProvider 的 onAuthStateChange 监听到 SIGNED_IN 事件，状态会自动更新
        
        // 延迟清理 URL，给 Supabase 足够的时间处理
        const cleanupTimer = setTimeout(() => {
          const newUrl = new URL(window.location.href);
          if (newUrl.searchParams.has('code')) {
            console.log('[page] 清理URL中的code参数');
            newUrl.searchParams.delete('code');
            newUrl.searchParams.delete('auth_callback');
            window.history.replaceState({}, '', newUrl.toString());
          }
        }, 3000); // 给 Supabase 3 秒时间处理
        
        return () => clearTimeout(cleanupTimer);
      }
    };
    
    handleAuthCallback();
  }, []);
  
  // 当 prefillPrompt 改变时，滚动到表单区域
  useEffect(() => {
    if (prefillPrompt && formRef.current && typeof window !== 'undefined') {
      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [prefillPrompt]);
  
  /**
   * 当用户点击生成按钮时触发，用于在结果区域展示占位内容
   */
  const handleGenerateStart = (count: number) => {
    setIsGenerating(true);
    setExpectedImages(count);
    setErrorMessage(null);
    setEditMetadataForForm(null);
    // 每次开始生成时重置一个大致的倒计时（例如 30 秒）
    setGenerationEta(30);
  };
  
  /**
   * 处理生成成功
   * @param result - API响应结果，包含生成的图片数据
   * @param metadata - 本次生成的配置信息
   */
  const handleGenerateSuccess = (result: ISeedreamResponse, metadata: IGenerationMetadata) => {
    const images = result.data.map((img) => img.url).filter((url): url is string => !!url);
    const historyItem: IGenerationHistoryItem = {
      id: `${metadata.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      images,
      metadata,
    };
    setGenerationHistory((prev) => [historyItem, ...prev]);
    setErrorMessage(null);
    setIsGenerating(false);
    setExpectedImages(null);
    setGenerationEta(null);
  };

  /**
   * 处理生成失败
   * @param error - 错误信息
   */
  const handleGenerateError = (error: string) => {
    setErrorMessage(error);
    setIsGenerating(false);
    setGenerationEta(null);
    // 5秒后自动清除错误信息，或用户可以手动关闭
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // 简单的前端倒计时效果：仅用于给用户“还有多久”的感知，并不代表真实服务端耗时
  useEffect(() => {
    if (!isGenerating || generationEta == null) return;

    const timer = window.setInterval(() => {
      setGenerationEta((prev) => {
        if (prev == null || prev <= 1) {
          window.clearInterval(timer);
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isGenerating, generationEta]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 顶部导航栏 */}
      <header className="border-b bg-white/95 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* Logo + Primary nav */}
          <div className="flex flex-1 min-w-[240px] items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cetcor AI
            </span>
          </div>

            <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/pricing">{t.nav.pricing}</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              {/* 使用多语言文案：英文默认 History，切换中文后显示 生成记录 */}
              {t.history.title}
            </Button>
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <AuthButton />
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

        {/* 生成表单 + 生成结果：生成结果紧跟在提示词输入模块下方 */}
        <section ref={formRef} id="generation-form-anchor" className="-mt-6 space-y-8">
          <GenerationForm
            onGenerateSuccess={handleGenerateSuccess}
            onGenerateError={handleGenerateError}
            initialPrompt={prefillPrompt}
            onGenerateStart={handleGenerateStart}
            editMetadata={editMetadataForForm}
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

          {/* 生成结果展示：按时间顺序堆叠显示，每次新生成结果追加在最上方 */}
          {(isGenerating || generationHistory.length > 0) && (
            <section className="bg-white/95 rounded-2xl shadow-lg p-4 contain-layout space-y-6">
              {/* 当前这一轮生成的占位状态：固定展示在最上方，紧贴提示词模块 */}
              {isGenerating && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        正在生成图片中…
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        AI 正在绘制你的作品，请稍候片刻（预计还需约 {generationEta ?? 20} 秒）
                      </p>
                    </div>
                  </div>
                  {/* 占位卡片区域：桌面端使用 4 列布局，与真实图片展示保持一致 */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {Array.from({ length: expectedImages ?? 1 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 via-sky-50/40 to-purple-50/70 text-sm text-slate-600"
                      >
                        <span className="text-sm font-medium">
                          正在生成第 {index + 1} 张图片…
                        </span>
                        {/* 彩色进度条 + 微动画，用于提升等待体验 */}
                        <div className="flex w-4/5 flex-col gap-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full w-full origin-left animate-[progress-bar_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500" />
                          </div>
                          <span className="text-[11px] text-slate-400">
                            提示：生成时间会因图片数量和网络情况略有变化
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 历史生成结果：最新在上方，旧记录依次向下堆叠。标题和“生成记录”按钮只在第一组上方展示一次 */}
              {generationHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0"
                >
                  <ImageGallery
                    images={item.images}
                    metadata={item.metadata}
                    compact
                    isFreeUser={isFreeUser}
                    showHeader={index === 0 && !isGenerating}
                    onEdit={(metadata) => {
                      setEditMetadataForForm(metadata);
                      setIsGenerating(false);
                      setExpectedImages(null);
                      // 滚动回表单区域，方便用户重新编辑
                      if (formRef.current) {
                        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    onShowHistory={() => setHistoryOpen(true)}
                  />
                </div>
              ))}
          </section>
        )}
        </section>

        {/* 灵感创意模块：位于提示词与生成结果之后，提供一键填入灵感图片 */}
        <InspirationGallery
          className="mt-6"
          onSelectPrompt={(p) => {
            setPrefillPrompt(p);
          }}
        />

        {/* 底部说明 */}
        <footer className="text-center text-xs text-muted-foreground max-w-3xl mx-auto">
          {t.footer.disclaimer}
        </footer>
      </main>

      {/* 历史记录弹窗 */}
      <HistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={generationHistory}
      />
    </div>
  );
}
