export const CREDITS_REFRESH_EVENT = 'cetcor:credits-refresh';

/**
 * 主动通知全局“积分已变化”，各个订阅信息组件会监听该事件刷新积分
 */
export function emitCreditsRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CREDITS_REFRESH_EVENT));
}

/**
 * 订阅积分刷新事件，返回一个用于注销监听的函数
 */
export function subscribeCreditsRefresh(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(CREDITS_REFRESH_EVENT, handler);
  return () => window.removeEventListener(CREDITS_REFRESH_EVENT, handler);
}


