'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { IGenerationFormData, ISeedreamResponse } from '@/types/seedream.types';
import { getStoredAuthToken, useAuthToken } from '@/components/providers/auth-provider';

interface GenerationFormProps {
  onGenerateSuccess: (result: ISeedreamResponse, prompt?: string) => void;
  onGenerateError: (error: string) => void;
  initialPrompt?: string;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  onGenerateSuccess,
  onGenerateError,
  initialPrompt = '',
}) => {
  const { token } = useAuthToken();
  const [formData, setFormData] = useState<IGenerationFormData>({
    prompt: initialPrompt,
    size: '2k',
    maxImages: 3,
    watermark: true,
  });
  const [loading, setLoading] = useState(false);

  type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  const handleChange =
    (field: keyof IGenerationFormData) =>
    (e: React.ChangeEvent<FormElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === 'maxImages'
            ? Number(e.target.value)
            : field === 'watermark'
            ? (e as React.ChangeEvent<HTMLInputElement>).target.checked
            : e.target.value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      onGenerateError('提示词不能为空');
      return;
    }

    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const resolvedToken = token ?? getStoredAuthToken();
      if (!resolvedToken) {
        onGenerateError('请先登录后再生成图片。');
        return;
      }

      headers.Authorization = `Bearer ${resolvedToken}`;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: formData.prompt,
          size: formData.size,
          maxImages: formData.maxImages,
          watermark: formData.watermark,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        onGenerateError(data.error || '生成失败，请稍后重试');
        return;
      }

      onGenerateSuccess(data.data as ISeedreamResponse, formData.prompt);
    } catch (error) {
      console.error('generate error:', error);
      onGenerateError('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900">提示词</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={3}
          value={formData.prompt}
          onChange={handleChange('prompt')}
          placeholder="请输入你想生成的图片描述..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="size-select">
            尺寸
          </label>
          <select
            id="size-select"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={formData.size}
            onChange={handleChange('size')}
          >
            <option value="1k">1K</option>
            <option value="2k">2K</option>
            <option value="4k">4K</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="max-images">
            张数
          </label>
          <input
            id="max-images"
            type="number"
            min={1}
            max={6}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={formData.maxImages}
            onChange={handleChange('maxImages')}
          />
        </div>

        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-900">
            <input
              type="checkbox"
              checked={formData.watermark}
              onChange={handleChange('watermark')}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
            />
            添加水印
          </label>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? '生成中...' : '生成图片'}
      </Button>
    </form>
  );
};


