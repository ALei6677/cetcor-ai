'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { ImagePreviewDialog } from './image-preview-dialog';
import { Upload, X, Eye } from 'lucide-react';
import { useTranslation } from '@/stores/language-store';

/**
 * 参考图数据接口
 */
export interface ReferenceImage {
  /** 图片的唯一标识 */
  id: string;
  /** 图片的 data URL（base64） */
  url: string;
  /** 原始文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
}

/**
 * 参考图上传组件Props
 */
interface ReferenceImageUploadProps {
  /** 已上传的参考图列表 */
  images: ReferenceImage[];
  /** 图片变化回调 */
  onChange: (images: ReferenceImage[]) => void;
  /** 最大上传数量（默认5） */
  maxImages?: number;
}

/**
 * 参考图上传组件
 * - 支持多文件上传（最多5张）
 * - 显示缩略图，依次往右排列
 * - 每个缩略图有预览和删除按钮
 */
export function ReferenceImageUpload({
  images,
  onChange,
  maxImages = 5,
}: ReferenceImageUploadProps) {
  const t = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

    // 转换为 ReferenceImage 格式
    const newImages: ReferenceImage[] = await Promise.all(
      validFiles.map(async (file) => {
        const url = await fileToDataURL(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          name: file.name,
          size: file.size,
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
   * 删除图片
   */
  const handleRemove = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  /**
   * 打开预览
   */
  const handlePreview = (url: string) => {
    setPreviewImage(url);
  };

  /**
   * 关闭预览
   */
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="space-y-3">
      <Label>{t.form.referenceImageLabel || '参考图（可选）'}</Label>
      
      {/* 上传按钮和缩略图容器 */}
      <div className="flex items-start gap-3 overflow-x-auto pb-1">
        {/* 上传按钮 */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1 flex-shrink-0"
          >
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500 text-center px-1">
              {t.form.referenceImageUpload || '上传'}
            </span>
          </button>
        )}

        {/* 已上传的缩略图 */}
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex-shrink-0"
          >
            <Image
              src={image.url}
              alt={image.name}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
            
            {/* 操作按钮遮罩 */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handlePreview(image.url)}
                className="p-1.5 bg-white/90 hover:bg-white rounded-full transition-colors"
                aria-label="预览图片"
              >
                <Eye className="w-4 h-4 text-gray-800" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                className="p-1.5 bg-red-500/90 hover:bg-red-600 rounded-full transition-colors"
                aria-label="删除图片"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
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
      <p className="text-xs text-muted-foreground">
        {t.form.referenceImageHint?.replace('{max}', maxImages.toString()) ||
          `最多可上传 ${maxImages} 张参考图，支持 JPG、PNG、WebP、GIF 格式，单张不超过 10MB`}
      </p>

      {/* 图片预览对话框 */}
      {previewImage && (
        <ImagePreviewDialog
          imageUrl={previewImage}
          open={!!previewImage}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}

