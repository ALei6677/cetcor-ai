'use client';

import { useEffect } from 'react';

/**
 * Service Worker 错误处理组件
 * 用于捕获并静默处理 Service Worker 注册错误
 * 这在 Cursor 的 Web 视图等环境中很常见
 */
export function ServiceWorkerHandler() {
  useEffect(() => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // 如果 Service Worker 不可用，直接返回
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // 保存原始的 register 方法
    const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);

    // 重写 register 方法以捕获错误
    navigator.serviceWorker.register = function(...args: Parameters<typeof originalRegister>) {
      try {
        // 检查文档状态
        if (document.readyState === 'loading' || document.readyState === 'uninitialized') {
          // 文档还未准备好，返回一个被拒绝的 Promise
          return Promise.reject(new DOMException('Document is not ready', 'InvalidStateError'));
        }

        // 尝试注册，但捕获错误
        return originalRegister(...args).catch((error: Error) => {
          // 静默处理 Service Worker 注册错误
          if (
            error.name === 'InvalidStateError' ||
            error.message?.includes('ServiceWorker') ||
            error.message?.includes('service worker') ||
            error.message?.includes('invalid state')
          ) {
            // 返回一个已解决的 Promise，避免错误传播
            return Promise.resolve({} as ServiceWorkerRegistration);
          }
          // 其他错误继续抛出
          throw error;
        });
      } catch (error: any) {
        // 捕获同步错误
        if (
          error?.name === 'InvalidStateError' ||
          error?.message?.includes('ServiceWorker') ||
          error?.message?.includes('service worker') ||
          error?.message?.includes('invalid state')
        ) {
          return Promise.resolve({} as ServiceWorkerRegistration);
        }
        throw error;
      }
    };

    // 捕获 Service Worker 注册错误
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes('ServiceWorker') ||
        event.message?.includes('service worker') ||
        event.message?.includes('Could not register service worker') ||
        event.error?.name === 'InvalidStateError' ||
        event.error?.message?.includes('invalid state')
      ) {
        // 静默处理 Service Worker 错误，不显示在控制台
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // 监听全局错误（使用捕获阶段）
    window.addEventListener('error', handleError, true);

    // 监听未处理的 Promise 拒绝
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes('ServiceWorker') ||
        event.reason?.message?.includes('service worker') ||
        event.reason?.message?.includes('Could not register service worker') ||
        event.reason?.name === 'InvalidStateError' ||
        event.reason?.message?.includes('invalid state') ||
        event.reason?.message?.includes('Document is not ready')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    // 清理函数
    return () => {
      // 恢复原始的 register 方法
      if (navigator.serviceWorker && originalRegister) {
        navigator.serviceWorker.register = originalRegister;
      }
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}


