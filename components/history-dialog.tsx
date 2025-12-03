/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/stores/language-store';
import type { IGenerationHistoryItem } from '@/types/seedream.types';
import { Download, Eye } from 'lucide-react';

/**
 * HistoryDialog组件Props
 */
interface IHistoryDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 历史记录数据 */
  history: IGenerationHistoryItem[];
}

/**
 * 历史记录弹窗组件
 * 显示用户的图片生成历史
 */
export function HistoryDialog({ open, onClose, history }: IHistoryDialogProps) {
  const t = useTranslation();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(imageUrl)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `history-image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('download failed', error);
      alert('下载失败，请稍后重试');
    }
  };

  /**
   * 格式化时间戳
   * @param timestamp - 时间戳
   * @returns 格式化的时间字符串
   */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.history.title}</DialogTitle>
        </DialogHeader>

        {/* 历史记录列表 */}
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t.history.empty}
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                  <span>{formatTime(item.metadata.timestamp)}</span>
                  {item.metadata.referenceImageThumb ? (
                    <span className="relative flex h-20 items-center overflow-hidden rounded-md border border-primary/40 bg-white shadow-sm">
                      <img
                        src={item.metadata.referenceImageThumb}
                        alt="参考图"
                        className="h-full w-auto"
                      />
                      {/* 参考图预览按钮：悬停时显示，点击可放大预览参考图 */}
                      <button
                        type="button"
                        className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 hover:opacity-100"
                        onClick={() => setPreviewImage(item.metadata.referenceImageThumb || null)}
                        aria-label="预览参考图"
                      >
                        <Eye className="h-4 w-4 text-white" />
                      </button>
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                      参考图 无
                    </span>
                  )}
                  <span className="rounded-full bg-slate-50 px-3 py-1">{`比例 ${item.metadata.aspectRatio}`}</span>
                  <span className="rounded-full bg-slate-50 px-3 py-1">{`分辨率 ${item.metadata.resolutionLabel}`}</span>
                  <span className="rounded-full bg-slate-50 px-3 py-1">{`尺寸 ${item.metadata.width}×${item.metadata.height}px`}</span>
                  <span className="rounded-full bg-slate-50 px-3 py-1">{`风格 ${item.metadata.styleLabel}`}</span>
                </div>

                <p className="text-sm text-slate-800">{item.metadata.prompt}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {item.images.map((imageUrl, index) => (
                    <div key={index} className="group relative overflow-hidden rounded-xl border bg-slate-50">
                      <div className="flex max-h-[280px] w-full items-center justify-center">
                        <img src={imageUrl} alt={`History image ${index + 1}`} className="max-h-[280px] w-auto" />
                      </div>
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
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </DialogContent>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>预览生成图片</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2 w-full">
            {previewImage && (
              <div className="relative mx-auto flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-black/5">
                <img src={previewImage} alt="预览生成图片" className="max-h-[70vh] w-auto" />
              </div>
            )}
          </div>
      </DialogContent>
      </Dialog>
    </Dialog>
  );
}

