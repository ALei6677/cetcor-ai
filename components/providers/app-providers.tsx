'use client';

import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { AuthProvider } from '@/components/providers/auth-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const clientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID ?? '';

  React.useEffect(() => {
    if (!clientId && process.env.NODE_ENV !== 'production') {
      console.warn(
        '[PayPal] NEXT_PUBLIC_PAYPAL_CLIENT_ID 未配置，PayPal 嵌入式支付将无法正常渲染。'
      );
    } else if (clientId) {
      console.log('[PayPal] SDK 配置完成', {
        hasClientId: !!clientId,
        clientIdLength: clientId.length,
        environment: process.env.NODE_ENV,
      });
    }
  }, [clientId]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    let attempts = 0;
    let scriptLogged = false;
    let sdkLogged = false;
    const maxAttempts = 10;

    const logScriptState = (label: string) => {
      const paypalScript = document.querySelector('script[src*="paypal"]');
      const sdkReady = typeof window !== 'undefined' && !!window.paypal;
      console.log('[PayPal][ScriptProvider]', label, {
        hasScriptTag: !!paypalScript,
        scriptSrc: paypalScript?.getAttribute('src'),
        sdkReady,
        attempts,
        timestamp: new Date().toISOString(),
      });
    };

    const interval = window.setInterval(() => {
      attempts += 1;
      const paypalScript = document.querySelector('script[src*="paypal"]');
      if (paypalScript && !scriptLogged) {
        logScriptState('Script tag detected');
        scriptLogged = true;

        paypalScript.addEventListener('load', () => {
          logScriptState('PayPal script loaded event fired');
        });

        paypalScript.addEventListener('error', () => {
          console.error('[PayPal][ScriptProvider] ❌ Script load error', {
            src: paypalScript.getAttribute('src'),
            timestamp: new Date().toISOString(),
          });
        });
      }

      if (window.paypal && !sdkLogged) {
        sdkLogged = true;
        console.log('[PayPal][ScriptProvider] window.paypal detected', {
          version: window.paypal?.version,
          components: window.paypal?.Buttons ? 'buttons' : 'unknown',
          timestamp: new Date().toISOString(),
        });
      }

      if ((scriptLogged && sdkLogged) || attempts >= maxAttempts) {
        if (!scriptLogged || !sdkLogged) {
          logScriptState('Polling finished without detecting full readiness');
        }
        window.clearInterval(interval);
      }
    }, 1500);

    logScriptState('Polling started');

    return () => {
      window.clearInterval(interval);
    };
  }, [clientId]);

  return (
    <PayPalScriptProvider
      options={{
        clientId: clientId || 'test',
        intent: 'capture',
        currency: 'USD',
        components: 'buttons',
        // 移除 enableFunding，让 PayPal 根据用户地区自动显示所有可用的支付方式
        // 这样中国用户可以看到 PayPal 账户余额、银行卡等选项
        dataSdkIntegrationSource: 'button-factory',
        vault: true,
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </PayPalScriptProvider>
  );
}

