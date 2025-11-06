'use client';

import { useEffect } from 'react';

/**
 * Service Worker 错误处理组件
 * 用于捕获并静默处理 Service Worker 注册错误
 * 这在 Cursor 的 Web 视图等环境中很常见
 */
export function ServiceWorkerHandler() {
  useEffect(() => {
    // 捕获 Service Worker 注册错误
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes('ServiceWorker') ||
        event.message?.includes('service worker') ||
        event.error?.name === 'InvalidStateError'
      ) {
        // 静默处理 Service Worker 错误，不显示在控制台
        event.preventDefault();
        return false;
      }
    };

    // 监听全局错误
    window.addEventListener('error', handleError, true);

    // 监听未处理的 Promise 拒绝
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes('ServiceWorker') ||
        event.reason?.message?.includes('service worker') ||
        event.reason?.name === 'InvalidStateError'
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    // 清理函数
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}

