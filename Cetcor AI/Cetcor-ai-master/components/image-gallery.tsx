'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { useTranslation } from '@/stores/language-store';

/**
 * ImageGallery组件Props
 */
interface IImageGalleryProps {
  /** 图片URL数组 */
  images: string[];
  /** 提示词 */
  prompt?: string;
}

/**
 * 图片画廊组件
 * 展示生成的图片，支持下载和复制提示词
 */
export function ImageGallery({ images, prompt }: IImageGalleryProps) {
  const t = useTranslation();
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * 下载图片
   * @param imageUrl - 图片URL
   * @param index - 图片索引
   */
  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      // 使用API代理下载，避免CORS问题
      const downloadUrl = `/api/download?url=${encodeURIComponent(imageUrl)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `cetcor-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
  };

  /**
   * 复制提示词到剪贴板
   */
  const handleCopyPrompt = async () => {
    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt);
        // 显示成功提示
        setCopySuccess(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      } catch (error) {
        console.error('复制失败:', error);
        alert('复制失败，请手动复制');
      }
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full py-12 text-center text-muted-foreground">
        {t.gallery.noResults}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t.gallery.title}</h3>
        {prompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
            className={copySuccess ? 'text-green-600 border-green-600' : ''}
          >
            {copySuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                {t.gallery.copyPrompt}
              </>
            )}
          </Button>
        )}
      </div>

      {/* 图片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((imageUrl, index) => (
          <div
            key={index}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted gpu-accelerated"
          >
            {/* 图片 */}
            <Image
              src={imageUrl}
              alt={`Generated image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              quality={75}
            />

            {/* 悬停操作按钮 */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(imageUrl, index)}
              >
                <Download className="mr-2 h-4 w-4" />
                {t.gallery.download}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

