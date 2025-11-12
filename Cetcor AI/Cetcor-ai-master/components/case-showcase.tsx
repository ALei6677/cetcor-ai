/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import type { ShowcaseCase } from '@/constants/cases';
import { SHOWCASE_CASES } from '@/constants/cases';

interface CaseShowcaseProps {
  cases?: ShowcaseCase[];
  onSelect?: (prompt: string) => void;
}

/**
 * 案例展示组件
 * - 响应式网格：桌面4列、平板2列、手机1列
 * - 卡片：自适应宽度，保持3:4宽高比
 * - 图片：完整展示（object-contain），避免裁剪
 * - 卡片：标题位于左上角；点击触发 onSelect
 */
export function CaseShowcase({ cases = SHOWCASE_CASES, onSelect }: CaseShowcaseProps) {
  return (
    <div className="w-full flex justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
          {cases.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect?.(item.prompt)}
              className="group relative w-full aspect-[3/4] overflow-hidden rounded-xl border bg-white shadow hover:shadow-lg transition-all duration-300 text-left"
              type="button"
            >
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 text-white text-xs sm:text-sm font-semibold tracking-wide z-10">
                {item.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


