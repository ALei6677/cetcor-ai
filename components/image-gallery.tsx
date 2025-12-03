/* eslint-disable @next/next/no-img-element */
'use client';

import React, { startTransition, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, History } from 'lucide-react';
import { useTranslation } from '@/stores/language-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { IGenerationMetadata } from '@/types/seedream.types';
import Link from 'next/link';

/**
 * ImageGallery组件Props
 */
interface IImageGalleryProps {
  images: string[];
  compact?: boolean;
  onShowHistory?: () => void;
  metadata?: IGenerationMetadata;
  /** 是否为免费用户，用于展示升级提示 */
  isFreeUser?: boolean;
  /** 用户点击“重新编辑”时回调，传出本次生成的元数据 */
  onEdit?: (metadata: IGenerationMetadata) => void;
  /** 是否展示顶部标题和“生成记录”按钮，默认展示 */
  showHeader?: boolean;
}

/**
 * 图片画廊组件
 * 展示生成的图片，支持下载和复制提示词
 */
export function ImageGallery({
  images,
  compact,
  onShowHistory,
  metadata,
  isFreeUser,
  onEdit,
  showHeader = true,
}: IImageGalleryProps) {
  const t = useTranslation();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(
    compact && images.length > 0 ? 1 : images.length
  );

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

  useEffect(() => {
    if (!images || images.length === 0) {
      startTransition(() => {
        setVisibleCount(0);
      });
      return;
    }

    if (!compact) {
      startTransition(() => {
        setVisibleCount(images.length);
      });
      return;
    }

    // 先展示第一张，然后逐步展示后续图片
    startTransition(() => {
      setVisibleCount(1);
    });

    if (images.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      startTransition(() => {
        setVisibleCount((current) => {
          if (current >= images.length) {
            clearInterval(timer);
            return current;
          }
          return Math.min(current + 1, images.length);
        });
      });
    }, 500);

    return () => clearInterval(timer);
  }, [compact, images]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full py-12 text-center text-muted-foreground">
        {t.gallery.noResults}
      </div>
    );
  }

  const displayedImages = compact ? images.slice(0, visibleCount) : images;

  return (
    <div className="w-full space-y-4">
      {isFreeUser && showHeader && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 p-4 text-xs sm:text-sm text-slate-700">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p>
              您正在使用免费套餐，升级到高级版可获得 <span className="font-semibold">5 倍更快的速度</span>、
              <span className="font-semibold">更高画质</span> 和 <span className="font-semibold">无广告体验</span>。
            </p>
            <div className="flex w-full justify-between gap-2 sm:w-auto sm:justify-end">
              <Button
                asChild
                size="sm"
                className="flex-1 rounded-full bg-primary text-white sm:flex-none"
              >
                <Link href="/pricing">升级到专业版</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden rounded-full border-primary text-primary sm:inline-flex"
              >
                <Link href="/pricing">升级到专业版</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 标题和操作按钮：仅在需要时展示，避免多次重复 */}
      {showHeader && (
      <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">{t.gallery.title}</h3>
          {onShowHistory && (
          <Button
            variant="outline"
            size="sm"
              onClick={onShowHistory}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              生成记录
          </Button>
        )}
      </div>
      )}

      {metadata && (
        <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="text-slate-500">
              {new Date(metadata.timestamp).toLocaleString()}
            </span>
            {metadata.referenceImageThumb ? (
              <span className="relative flex h-13 items-center overflow-hidden rounded-md border border-primary/40 bg-white shadow-sm">
                <img
                  src={metadata.referenceImageThumb}
                  alt="参考图"
                  className="h-full w-auto"
                />
                {/* 参考图预览按钮：悬停时显示，点击可放大预览参考图 */}
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 hover:opacity-100"
                  onClick={() => setPreviewImage(metadata.referenceImageThumb || null)}
                  aria-label="预览原图"
                >
                  <Eye className="h-4 w-4 text-white" />
                </button>
              </span>
            ) : (
              <span className="rounded-full bg-white px-3 py-1 shadow-sm text-[11px] font-semibold text-slate-500">
                参考图 无
              </span>
            )}
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              比例 {metadata.aspectRatio}
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              分辨率 {metadata.resolutionLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              尺寸 {metadata.width}×{metadata.height}px
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              风格 {metadata.styleLabel}
            </span>
            {onEdit && (
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/70 px-2 py-1 text-[11px] font-semibold text-primary"
                  onClick={() => onEdit(metadata)}
                >
                  重新编辑
                </Button>
              </div>
            )}
          </div>
          <p className="text-base font-medium leading-relaxed text-slate-900">{metadata.prompt}</p>
        </div>
      )}

      {/* 图片区域：紧凑模式下在桌面端固定 4 列，保证 4 张图一行展示 */}
      <div
        className={
          compact
            ? 'grid grid-cols-2 gap-4 md:grid-cols-4'
            : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
        }
      >
        {displayedImages.map((imageUrl, index) => (
          <div key={index} className="group relative">
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-50 shadow-sm">
              <img
              src={imageUrl}
              alt={`Generated image ${index + 1}`}
                className="block w-full h-auto"
              loading="lazy"
            />

            {/* 悬停操作按钮 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewImage(imageUrl)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(imageUrl, index)}
                    className="flex items-center justify-center gap-2"
              >
                    <Download className="h-4 w-4" />
              </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图片放大预览弹窗 */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>预览生成图片</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2 w-full">
            {previewImage && (
              <div className="relative mx-auto flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-black/5">
                <img
                  src={previewImage}
                  alt="预览生成图片"
                  className="max-h-[70vh] w-auto"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

