'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-purple-100">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center">
        <div className="rounded-full bg-rose-100/80 p-6 text-rose-600 shadow">
          <XCircle className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">支付已取消</h1>
        <p className="text-sm text-slate-600">
          你已从 PayPal 取消支付流程。若需要重新选择套餐或修改账单周期，可返回订阅页面再次发起支付。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push('/subscribe')} className="min-w-[200px]">
            重新选择套餐
          </Button>
          <Button variant="outline" onClick={() => router.push('/pricing')}>
            查看所有套餐
          </Button>
        </div>
      </div>
    </div>
  );
}


