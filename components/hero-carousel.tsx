'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 示例图片数据
 */
const SAMPLE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&h=600&fit=crop',
    title: '高级感摄影',
    tag: '商品摄影',
  },
  {
    url: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&h=600&fit=crop',
    title: '创意绘本',
    tag: '做同款',
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    title: '潮流设计',
    tag: '海报设计',
  },
  {
    url: 'https://images.unsplash.com/photo-1533073526757-2c8ca1df9f1c?w=800&h=600&fit=crop',
    title: '旅行摄影',
    tag: '旅拍开发',
  },
];

/**
 * HeroCarousel组件Props
 */
interface IHeroCarouselProps {
  /** 自定义图片列表（可选） */
  images?: Array<{ url: string; title?: string; tag?: string }>;
}

/**
 * 英雄区轮播组件
 * 展示示例图片的3D卡片轮播效果
 */
export function HeroCarousel({ images = SAMPLE_IMAGES }: IHeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  /**
   * 滚动到上一张
   */
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  /**
   * 滚动到下一张
   */
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  /**
   * 滚动到指定索引
   * @param index - 索引
   */
  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  /**
   * 监听选中变化
   */
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full max-w-5xl mx-auto py-12">
      {/* 轮播容器 */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative flex-[0_0_80%] md:flex-[0_0_60%] lg:flex-[0_0_50%]"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-4 border-white shadow-2xl transform transition-all duration-300 hover:scale-105">
                <Image
                  src={image.url}
                  alt={image.title || `Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 80vw, 50vw"
                  priority={index === 0}
                />
                
                {/* 标签 */}
                {image.tag && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    {image.tag}
                  </div>
                )}
                
                {/* 标题 */}
                {image.title && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
                    {image.title}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 左右切换按钮 */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm"
        onClick={scrollNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* 小圆点导航 */}
      <div className="flex justify-center gap-2 mt-6">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex
                ? 'bg-primary w-8'
                : 'bg-muted-foreground/30'
            }`}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

