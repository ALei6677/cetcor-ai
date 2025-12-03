import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并Tailwind CSS类名的工具函数
 * @param inputs - 类名数组
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ResetLabels {
  default: string;
  invalid: string;
  soon: string;
  day: string;
  hour: string;
  minute: string;
}

/**
 * 根据传入的 ISO 时间生成距离当前的友好描述
 */
export const formatTimeUntilReset = (iso: string | null, labels: ResetLabels): string => {
  if (!iso) return labels.default;
  const targetMs = new Date(iso).getTime();
  if (Number.isNaN(targetMs)) return labels.invalid;

  const diffMs = targetMs - Date.now();
  if (diffMs <= 0) return labels.soon;

  const minutes = Math.floor(diffMs / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}${labels.day}`);
  if (hours) parts.push(`${hours}${labels.hour}`);
  parts.push(`${mins}${labels.minute}`);

  return parts.join(' ');
};


