 'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IHistoryItem } from '@/types/seedream.types';
import { STORAGE_KEYS } from '@/constants/api.constants';

/**
 * 历史记录Store状态接口
 */
interface IHistoryState {
  /** 历史记录列表 */
  items: IHistoryItem[];
  
  /** 添加历史记录 */
  addItem: (item: Omit<IHistoryItem, 'id' | 'timestamp'>) => void;
  
  /** 删除指定历史记录 */
  removeItem: (id: string) => void;
  
  /** 清空所有历史记录 */
  clearAll: () => void;
  
  /** 获取最近的历史记录 */
  getRecent: (limit?: number) => IHistoryItem[];
}

/**
 * 历史记录Store
 * 使用Zustand管理状态，并持久化到localStorage
 */
export const useHistoryStore = create<IHistoryState>()(
  persist(
    (set, get) => ({
      // 初始状态
      items: [],

      /**
       * 添加新的历史记录
       * @param item - 历史记录项（不包含id和timestamp）
       */
      addItem: (item) => {
        const newItem: IHistoryItem = {
          ...item,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          items: [newItem, ...state.items], // 新记录添加到开头
        }));
      },

      /**
       * 删除指定的历史记录
       * @param id - 历史记录ID
       */
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      /**
       * 清空所有历史记录
       */
      clearAll: () => {
        set({ items: [] });
      },

      /**
       * 获取最近的N条历史记录
       * @param limit - 数量限制（默认10条）
       * @returns 历史记录数组
       */
      getRecent: (limit = 10) => {
        const { items } = get();
        return items
          .sort((a, b) => b.timestamp - a.timestamp) // 按时间降序排序
          .slice(0, limit);
      },
    }),
    {
      name: STORAGE_KEYS.HISTORY, // localStorage键名
    }
  )
);

