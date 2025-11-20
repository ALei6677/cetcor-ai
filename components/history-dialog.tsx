'use client';

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useHistoryStore } from '@/stores/history-store';
import { useTranslation } from '@/stores/language-store';
import { Trash2 } from 'lucide-react';

/**
 * HistoryDialog组件Props
 */
interface IHistoryDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 历史记录弹窗组件
 * 显示用户的图片生成历史
 */
export function HistoryDialog({ open, onClose }: IHistoryDialogProps) {
  const t = useTranslation();
  const { items, removeItem, clearAll } = useHistoryStore();

  /**
   * 格式化时间戳
   * @param timestamp - 时间戳
   * @returns 格式化的时间字符串
   */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  /**
   * 处理清空历史
   */
  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      clearAll();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.history.title}</DialogTitle>
        </DialogHeader>

        {/* 历史记录列表 */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t.history.empty}
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* 提示词和时间 */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{item.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.history.generatedAt} {formatTime(item.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 生成的图片 */}
                <div className="grid grid-cols-3 gap-2">
                  {item.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded overflow-hidden border bg-muted"
                    >
                      <Image
                        src={imageUrl}
                        alt={`History image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>

                {/* 参数信息 */}
                <div className="text-xs text-muted-foreground">
                  {item.params.size && `尺寸: ${item.params.size}`}
                  {item.params.max_images && ` | 数量: ${item.params.max_images}`}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部操作 */}
        <DialogFooter>
          {items.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleClearAll}
            >
              {t.history.clear}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {t.history.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

