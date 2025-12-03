/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Upload, Trash2 } from 'lucide-react';
import { useTranslation } from '@/stores/language-store';
import type { IReferenceImageInput } from '@/types/seedream.types';
import { cn } from '@/lib/utils';

/**
 * 参考图上传组件Props
 */
type ReferenceImageUploadVariant = 'default' | 'embedded';

interface ReferenceImageUploadProps {
  /** 已上传的参考图列表 */
  images: IReferenceImageInput[];
  /** 图片变化回调 */
  onChange: (images: IReferenceImageInput[]) => void;
  /** 最大上传数量（默认5） */
  maxImages?: number;
  /** 自定义标签 */
  label?: string;
  /** 自定义提示 */
  hint?: string;
  /** 是否隐藏标签 */
  hideLabel?: boolean;
  /** 是否隐藏提示 */
  hideHint?: boolean;
  /** 紧凑模式，减少上下留白 */
  compact?: boolean;
  /** 自定义容器类名 */
  className?: string;
  /** 嵌入模式，用于提示词输入框内部展示 */
  variant?: ReferenceImageUploadVariant;
}

/**
 * 参考图上传组件
 * - 支持多文件上传（最多5张）
 * - 显示缩略图，依次往右排列
 */
export function ReferenceImageUpload({
  images,
  onChange,
  maxImages = 5,
  label,
  hint,
  hideLabel,
  hideHint,
  compact,
  className,
  variant = 'default',
}: ReferenceImageUploadProps) {
  const t = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 将文件转换为 base64 data URL
   */
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  /**
   * 验证文件类型
   */
  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert(t.form.referenceImageInvalidType || '只支持 JPG、PNG、WebP、GIF 格式的图片');
      return false;
    }
    
    // 限制文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t.form.referenceImageTooLarge || '图片大小不能超过 10MB');
      return false;
    }
    
    return true;
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (newFiles.length > remainingSlots) {
      alert(
        t.form.referenceImageMaxReached?.replace('{max}', maxImages.toString()) ||
        `最多只能上传 ${maxImages} 张参考图，当前已有 ${images.length} 张`
      );
      newFiles.splice(remainingSlots);
    }

    // 验证并转换文件
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    }

    // 转换为 IReferenceImageInput 格式
    const newImages: IReferenceImageInput[] = await Promise.all(
      validFiles.map(async (file) => {
        const url = await fileToDataURL(file);
        let width: number | undefined;
        let height: number | undefined;
        try {
          const dims = await getImageDimensions(url);
          width = dims.width;
          height = dims.height;
        } catch {
          width = undefined;
          height = undefined;
        }
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          name: file.name,
          size: file.size,
          width,
          height,
        };
      })
    );

    onChange([...images, ...newImages]);

    // 清空 input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 处理删除图片
   */
  const handleDelete = (imageId: string) => {
    onChange(images.filter((img) => img.id !== imageId));
  };

  const isEmbedded = variant === 'embedded';

  return (
    <div
      className={cn(
        'space-y-2 pt-1',
        compact && 'space-y-1 pt-0',
        isEmbedded && 'space-y-0 pt-0',
        className
      )}
    >
      {!hideLabel && (
        <Label className="text-sm font-semibold text-slate-900">
          {label || t.form.referenceImageLabel || '图片上传（可选）'}
        </Label>
      )}
      
      {/* 上传按钮和缩略图容器 */}
      <div
        className={cn(
          'flex items-start gap-3 overflow-x-auto pb-1',
          isEmbedded && 'flex-wrap overflow-visible pb-0'
        )}
      >
        {/* 上传按钮 */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex h-[120px] w-[120px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 transition-colors hover:border-primary hover:bg-primary/5 sm:h-36 sm:w-36',
              isEmbedded &&
                'h-20 w-20 rounded-lg border border-dashed border-slate-300 bg-white/80 text-slate-500 sm:h-20 sm:w-20'
            )}
          >
            <Upload className={cn('h-9 w-9 text-slate-400', isEmbedded && 'h-7 w-7 text-slate-400')} />
            <span className={cn('px-1 text-sm text-slate-500', isEmbedded && 'text-[11px]')}>
              {t.form.referenceImageUpload || '上传'}
            </span>
          </button>
        )}

        {/* 已上传的缩略图 */}
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              'group relative flex h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-slate-900/70 sm:h-36 sm:w-36',
              isEmbedded && 'h-20 w-20 rounded-lg sm:h-20 sm:w-20'
            )}
          >
            <img
              src={image.url}
              alt={image.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {/* 删除按钮 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(image.id);
              }}
              className={cn(
                'absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 text-white shadow-md opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100',
                isEmbedded && 'h-5 w-5 right-0.5 top-0.5'
              )}
              aria-label="删除图片"
              title="删除图片"
            >
              <Trash2 className={cn('h-3.5 w-3.5', isEmbedded && 'h-3 w-3')} />
            </button>
          </div>
        ))}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label={t.form.referenceImageLabel || '上传参考图'}
        title={t.form.referenceImageLabel || '上传参考图'}
      />

      {/* 提示文字 */}
      {!hideHint && !isEmbedded && (
        <p className="text-xs text-muted-foreground">
          {hint ||
            t.form.referenceImageHint?.replace('{max}', maxImages.toString()) ||
            `最多可上传 ${maxImages} 张参考图，支持 JPG、PNG、WebP、GIF 格式，单张不超过 10MB`}
        </p>
      )}
    </div>
  );
}

