'use client';

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * 图片预览对话框Props
 */
interface ImagePreviewDialogProps {
  /** 图片URL */
  imageUrl: string;
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 图片标题（可选） */
  title?: string;
}

/**
 * 图片预览对话框组件
 * 用于放大预览参考图
 */
export function ImagePreviewDialog({
  imageUrl,
  open,
  onClose,
  title,
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className={title ? undefined : 'sr-only'}>
            {title || '图片预览'}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 flex items-center justify-center bg-gray-50 rounded-b-lg">
          <div className="relative w-full max-w-4xl h-[70vh]">
            <Image
              src={imageUrl}
              alt={title || '预览图片'}
              fill
              sizes="(min-width: 1024px) 800px, 90vw"
              className="object-contain rounded-lg"
              unoptimized
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

