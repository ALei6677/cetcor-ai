'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SIZE_OPTIONS, MAX_IMAGES_OPTIONS } from '@/constants/api.constants';
import { useTranslation } from '@/stores/language-store';
import { useHistoryStore } from '@/stores/history-store';
import type { ISeedreamResponse } from '@/types/seedream.types';
import { Loader2 } from 'lucide-react';

/**
 * 表单验证Schema
 */
const formSchema = z.object({
  prompt: z.string().min(1, '请输入提示词').max(1000, '提示词不能超过1000个字符'),
  size: z.string(),
  maxImages: z.number().min(1).max(6),
  watermark: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

/**
 * GenerationForm组件Props
 */
interface IGenerationFormProps {
  /** 生成成功回调 */
  onGenerateSuccess?: (result: ISeedreamResponse) => void;
  /** 生成失败回调 */
  onGenerateError?: (error: string) => void;
}

/**
 * 图片生成表单组件
 * 提供提示词输入、参数选择和生成功能
 */
export function GenerationForm({ onGenerateSuccess, onGenerateError }: IGenerationFormProps) {
  const t = useTranslation();
  const addHistoryItem = useHistoryStore((state) => state.addItem);
  const [isGenerating, setIsGenerating] = useState(false);

  // 初始化表单
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      size: '2K',
      maxImages: 3,
      watermark: true,
    },
  });

  const size = watch('size');
  const maxImages = watch('maxImages');

  /**
   * 处理表单提交
   * @param data - 表单数据
   */
  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);

    try {
      // 调用API生成图片
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: data.prompt,
          size: data.size,
          maxImages: data.maxImages,
          watermark: data.watermark,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失败');
      }

      // 提取图片URL
      const images = result.data.data
        .map((img: any) => img.url)
        .filter((url: string) => url);

      // 添加到历史记录
      addHistoryItem({
        prompt: data.prompt,
        images,
        params: {
          size: data.size,
          max_images: data.maxImages,
          watermark: data.watermark,
        },
      });

      // 触发成功回调
      onGenerateSuccess?.(result.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成失败';
      onGenerateError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-3xl mx-auto space-y-6">
      {/* 提示词输入 */}
      <div className="space-y-2">
        <Label htmlFor="prompt">{t.form.promptLabel}</Label>
        <Textarea
          id="prompt"
          placeholder={t.form.promptPlaceholder}
          rows={4}
          {...register('prompt')}
          className="resize-none"
        />
        {errors.prompt && (
          <p className="text-sm text-red-500">{errors.prompt.message}</p>
        )}
      </div>

      {/* 参数选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 尺寸选择 */}
        <div className="space-y-2">
          <Label htmlFor="size">{t.form.sizeLabel}</Label>
          <Select
            value={size}
            onValueChange={(value) => setValue('size', value)}
          >
            <SelectTrigger id="size">
              <SelectValue placeholder="选择尺寸" />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 生成数量 */}
        <div className="space-y-2">
          <Label htmlFor="maxImages">
            {t.form.maxImages} ({t.form.maxImagesLabel})
          </Label>
          <Select
            value={maxImages.toString()}
            onValueChange={(value) => setValue('maxImages', parseInt(value))}
          >
            <SelectTrigger id="maxImages">
              <SelectValue placeholder="选择数量" />
            </SelectTrigger>
            <SelectContent>
              {MAX_IMAGES_OPTIONS.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {t.form.maxImagesUnit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 生成按钮 */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.form.generating}
          </>
        ) : (
          t.form.generateButton
        )}
      </Button>
    </form>
  );
}

