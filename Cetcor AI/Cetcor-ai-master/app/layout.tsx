import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ServiceWorkerHandler } from "@/components/service-worker-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cetcor AI - AI图片生成平台",
  description: "体验图片生成，让创意摇摆 - 基于火山引擎的AI图片生成服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="service-worker-interceptor"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
                if (!('serviceWorker' in navigator)) return;
                
                // 保存原始的 register 方法
                const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
                
                // 重写 register 方法以捕获错误
                navigator.serviceWorker.register = function(...args) {
                  try {
                    // 检查文档状态
                    if (document.readyState === 'loading' || document.readyState === 'uninitialized') {
                      return Promise.reject(new DOMException('Document is not ready', 'InvalidStateError'));
                    }
                    
                    // 尝试注册，但捕获错误
                    return originalRegister(...args).catch(function(error) {
                      // 静默处理 Service Worker 注册错误
                      if (
                        error.name === 'InvalidStateError' ||
                        (error.message && (
                          error.message.includes('ServiceWorker') ||
                          error.message.includes('service worker') ||
                          error.message.includes('invalid state')
                        ))
                      ) {
                        // 返回一个已解决的 Promise，避免错误传播
                        return Promise.resolve({});
                      }
                      // 其他错误继续抛出
                      throw error;
                    });
                  } catch (error) {
                    // 捕获同步错误
                    if (
                      error && (
                        error.name === 'InvalidStateError' ||
                        (error.message && (
                          error.message.includes('ServiceWorker') ||
                          error.message.includes('service worker') ||
                          error.message.includes('invalid state')
                        ))
                      )
                    ) {
                      return Promise.resolve({});
                    }
                    throw error;
                  }
                };
                
                // 捕获全局错误
                window.addEventListener('error', function(event) {
                  if (
                    (event.message && (
                      event.message.includes('ServiceWorker') ||
                      event.message.includes('service worker') ||
                      event.message.includes('Could not register service worker')
                    )) ||
                    (event.error && (
                      event.error.name === 'InvalidStateError' ||
                      (event.error.message && event.error.message.includes('invalid state'))
                    ))
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);
                
                // 捕获未处理的 Promise 拒绝
                window.addEventListener('unhandledrejection', function(event) {
                  if (
                    event.reason && (
                      event.reason.name === 'InvalidStateError' ||
                      (event.reason.message && (
                        event.reason.message.includes('ServiceWorker') ||
                        event.reason.message.includes('service worker') ||
                        event.reason.message.includes('Could not register service worker') ||
                        event.reason.message.includes('invalid state') ||
                        event.reason.message.includes('Document is not ready')
                      ))
                    )
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                });
              })();
            `,
          }}
        />
        <ServiceWorkerHandler />
        {children}
      </body>
    </html>
  );
}
