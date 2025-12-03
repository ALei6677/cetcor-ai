/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/stores/language-store';

export interface ICreativePlay {
  id: string;
  name: string;
  prompt: string;
  title?: string;
  originalImage: string;
  aiGeneratedImage: string;
}

interface CreativePlaygroundProps {
  plays?: ICreativePlay[];
  onApplyPlay?: (play: ICreativePlay) => void;
}

/**
 * 灵感玩法标题多语言文案
 * 仅控制冒号后的描述部分，冒号前缀在渲染时根据 language 动态切换
 */
const PLAY_TITLE_SUFFIX: Record<
  string,
  {
    en: string;
    zh: string;
  }
> = {
  '1': {
    en: 'Popular 3D character model',
    zh: '热门 3D 人物模型',
  },
  '2': {
    en: 'Change character outfit',
    zh: '变更人物服装',
  },
  '3': {
    en: 'Multiple real-life poses',
    zh: '生成多种真人动作姿势',
  },
  '4': {
    en: 'Change character appearance',
    zh: '改变人物形象',
  },
  '5': {
    en: 'Multi-angle camera shots',
    zh: '生成多角度拍摄镜头',
  },
  '6': {
    en: 'Character rig with multiple poses',
    zh: '人物建模生成多种动作姿势',
  },
  '7': {
    en: 'Poster text & layout edit',
    zh: '海报图文内容修改',
  },
};

const DEFAULT_PLAYS: ICreativePlay[] = [
  {
    id: '1',
    name: 'Poster text edit',
    // 提示词一：3D 商业手办 + 桌面环境
    prompt:
      'create a 1/7 scale commercialized figure of the character in the illustration, in a realistic style and environment. Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the ZBrush modeling process of the figure. Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork.',
    title: 'Creative Play: Popular 3D character model',
    originalImage: '/Inspiration gameplay card/卡片一.jpg',
    aiGeneratedImage: '/Inspiration gameplay card/卡片一AI.jpg',
  },
  {
    id: '2',
    name: 'Outfit style transfer',
    // 提示词二：人物换装 + iPhone 街拍效果
    prompt:
      'Make the character in Figure 1 wear the outfit shown in Figure 2, with an iPhone street photography effect',
    title: 'Creative Play: Change character outfit',
    originalImage: '/Inspiration gameplay card/卡片二.jpg',
    aiGeneratedImage: '/Inspiration gameplay card/卡片二AI.jpg',
  },
  {
    id: '3',
    name: 'Pose variations',
    // 提示词三：参考人物做高难度瑜伽动作
    prompt:
      'Ask the characters in the reference image to perform different high difficulty yoga movements',
    title: 'Creative Play: Multiple real-life poses',
    originalImage: '/Inspiration gameplay card/卡片三.jpg',
    aiGeneratedImage: '/Inspiration gameplay card/卡片三AI.jpg',
  },
  {
    id: '4',
    name: 'Appearance change',
    // 提示词四：为男性生成不同真实发型照片
    prompt:
      'Generate different real hairstyle photos for men based on the reference image',
    title: 'Creative Play: Change character appearance',
    originalImage: '/Inspiration gameplay card/卡片四.jpg',
    aiGeneratedImage: '/Inspiration gameplay card/卡片四AI.png',
  },
  {
    id: '5',
    name: 'Multi-angle shots',
    // 提示词五：改变机位，生成多角度照片
    prompt:
      'Please change the camera position in the reference image to generate photos from different shooting angles',
    title: 'Creative Play: Multi-angle shots',
    originalImage: '/Inspiration gameplay card/卡片五.jpg',
    aiGeneratedImage: '/Inspiration gameplay card/卡片五AI.jpg',
  },
  {
    id: '6',
    name: 'Character rig & animation',
    // 提示词六：让人物做出不同动作和姿势
    prompt:
      'Make the characters in the reference image make different movements and postures',
    title: 'Creative Play: Character rig with multiple poses',
    originalImage: '/Inspiration gameplay card/卡片六.jpg',
    aiGeneratedImage: '/Inspiration gameplay card/卡片六AI.jpg',
  },
  {
    id: '7',
    name: 'Creative poster remix',
    // 提示词七：修改文案并添加 Designed by Cetcor AI
    prompt:
      "Change the text 'ALL METAL DESIGN' in the reference image to 'Diamond Version Hardness', and add a line 'Designed by Cetcor AI' at the bottom",
    title: 'Creative Play: Poster text & layout edit',
    originalImage: '/Inspiration gameplay card/卡片七AI.jpg',
    aiGeneratedImage: '/Inspiration gameplay card/卡片七.png',
  },
];

interface CreativePlayPanelProps {
  image: string;
  tag: string;
  highlight?: boolean;
  tagAlignment?: 'left' | 'right';
}

function CreativePlayPanel({ image, tag, highlight, tagAlignment = 'left' }: CreativePlayPanelProps) {
  return (
    <div className={`relative h-[320px] w-[240px] rounded-[32px] ${highlight ? 'ring-2 ring-primary/40' : ''}`}>
      <img
        src={image}
        alt={tag}
        className="h-full w-full rounded-[32px] object-cover"
        draggable={false}
      />
      <span
        className={`absolute top-4 rounded-full bg-black/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white ${
          tagAlignment === 'right' ? 'right-4' : 'left-4'
        }`}
      >
        {tag}
      </span>
    </div>
  );
}

export function CreativePlayground({ plays = DEFAULT_PLAYS, onApplyPlay }: CreativePlaygroundProps) {
  const resolvedPlays = (plays.length ? plays : DEFAULT_PLAYS).slice(0, 7);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = resolvedPlays.length;
  const language = useLanguageStore((state) => state.language);
  // 统一管理按钮内边距，便于英文态下缩窄宽度
  const actionButtonPadding = useMemo(() => (language === 'zh' ? 'px-7' : 'px-5'), [language]);
  // 用于存储自动轮播定时器的引用
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 轮播间隔时间（毫秒），默认8秒
  const AUTO_PLAY_INTERVAL = 8000;

  const activePlay = useMemo(() => resolvedPlays[activeIndex] ?? resolvedPlays[0], [activeIndex, resolvedPlays]);

  /**
   * 启动自动轮播定时器
   * 每间隔指定时间自动切换到下一组图片
   */
  const startAutoPlay = useCallback(() => {
    // 清除之前的定时器（如果存在）
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
    // 设置新的定时器，自动切换到下一组
    autoPlayTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, AUTO_PLAY_INTERVAL);
  }, [total]);

  /**
   * 停止自动轮播
   */
  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  /**
   * 切换到上一组图片
   * 手动切换时重置自动轮播定时器
   */
  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
    // 重置自动轮播，确保手动操作后重新开始计时
    startAutoPlay();
  };

  /**
   * 切换到下一组图片
   * 手动切换时重置自动轮播定时器
   */
  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
    // 重置自动轮播，确保手动操作后重新开始计时
    startAutoPlay();
  };

  /**
   * 直接切换到指定索引
   * 点击指示器时调用，同样需要重置自动轮播
   */
  const goToIndex = (index: number) => {
    setActiveIndex(index);
    // 重置自动轮播
    startAutoPlay();
  };

  /**
   * 组件挂载时启动自动轮播
   * 组件卸载时清理定时器，防止内存泄漏
   */
  useEffect(() => {
    // 启动自动轮播
    startAutoPlay();
    // 清理函数：组件卸载时清除定时器
    return () => {
      stopAutoPlay();
    };
  }, [startAutoPlay, stopAutoPlay]); // 依赖函数，当图片组数变化时重新设置

  return (
    <section className="relative z-0 mx-auto w-full max-w-[750px]">
      <div className="mb-2 flex flex-col items-start text-left">
        <p className="pl-3 text-2xl font-semibold text-slate-900">
          {/* 
            将灵感玩法标题按冒号拆分：
            - 冒号前：保持较大字号，突出“Creative Play”
            - 冒号后：使用较小字号，避免长标题折行影响整体布局 
          */}
          {(() => {
            const fullTitle = activePlay.title ?? activePlay.name;
            const [rawPrefix, ...rest] = fullTitle.split(':');
            const fallbackSuffix = rest.join(':').trim();

            // 冒号前缀支持中英文切换：英文为 Creative Play，中文为 灵感玩法
            const prefix =
              language === 'zh'
                ? '灵感玩法'
                : rawPrefix && rawPrefix.trim().length > 0
                ? rawPrefix.trim()
                : 'Creative Play';

            // 冒号后缀根据 language 与玩法 id 做中英文切换，找不到配置时回退到原始标题
            const suffixConfig = PLAY_TITLE_SUFFIX[activePlay.id];
            const suffix =
              (suffixConfig && (language === 'zh' ? suffixConfig.zh : suffixConfig.en)) ||
              fallbackSuffix;

            return (
              <>
                <span>{prefix}</span>
                {suffix && (
                  <span className="text-base font-medium text-slate-800">
                    {/* 根据语言使用英文冒号或中文全角冒号，并在前方预留一个空格让冒号整体右移一位 */}
                    {language === 'zh' ? ' ： ' : ' : '}
                    {suffix}
                  </span>
                )}
              </>
            );
          })()}
        </p>
      </div>

      <div
        className="relative mt-3"
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
      >
        <div className="grid items-center gap-y-6 gap-x-2 lg:grid-cols-[240px_240px] lg:justify-center lg:gap-x-3">
          <CreativePlayPanel image={activePlay.originalImage} tag={language === 'zh' ? '原图' : 'REF'} />
          <CreativePlayPanel image={activePlay.aiGeneratedImage} tag="AI" tagAlignment="right" />
        </div>
      </div>

      <div className="mt-6 flex w-full items-center justify-center gap-19">
        <div className="shrink-0 basis-4 lg:basis-20" />
        <div className="flex items-center justify-center pl-4">
          <button
            type="button"
            aria-label="上一项"
            onClick={goPrev}
            className="p-1.5 text-slate-700 transition hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {resolvedPlays.map((play, index) => (
              <button
                key={play.id}
                type="button"
                aria-label={language === 'zh' ? `切换到 ${play.name}` : `Switch to ${play.name}`}
                onClick={() => goToIndex(index)}
                className={`h-2 w-2 rounded-full transition ${
                  index === activeIndex ? 'bg-primary' : 'bg-slate-300/70'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="下一项"
            onClick={goNext}
            className="p-1.5 text-slate-700 transition hover:text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-none items-center justify-end pl-0 lg:-ml-6">
          <Button
            type="button"
            onClick={() => onApplyPlay?.(activePlay)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full bg-primary ${actionButtonPadding} text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90`}
          >
            <Sparkles className="h-4 w-4" />
            {language === 'zh' ? '做同款' : 'Make Similar'}
          </Button>
        </div>
      </div>

    </section>
  );
}

