'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-purple-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 text-slate-800">
        <header className="space-y-2 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold">服务条款</h1>
          <p className="text-xs text-slate-500">最后更新：2025年12月2日</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1. 引言</h2>
          <p>
            欢迎来到 Cetcor ai，通过访问或使用我们在 Cetcor ai 的 AI 图像生成服务（“下称服务”），您同意受本服务条款（“条款”）的约束。在使用服务前，请务必仔细阅读这些条款。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">2. 服务描述</h2>
          <p>
            Cetcor ai 是一个免费的 AI 图像生成服务。我们为用户提供无需注册或付费即可根据文本描述生成图片的能力（如有收费方案，以定价页面为准）。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">3. 用户义务</h2>
          <p>使用我们的服务，即表示您同意：</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>使用服务时请遵守所有适用法律法规</li>
            <li>不试图规避任何限制或安全措施</li>
            <li>不得将服务用于任何非法或未经授权的目的</li>
            <li>不干扰或破坏服务或服务器</li>
            <li>不生成侵犯知识产权或含有有害内容的内容</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">4. 知识产权</h2>
          <p>
            通过我们服务生成的图片在默认情况下采用知识共享零许可协议（CC0）提供。您可以将生成的图片用于任何目的，包括商业用途，无需注明署名。不过，你也承认某些提示或输出可能受第三方权利约束。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">5. 隐私与数据保护</h2>
          <p>
            我们如何处理数据在《隐私政策》中有详细说明。我们不存储用户提示或生成图片，也不要求用户注册或收集个人敏感信息，除非为提供特定功能所必需。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">6. 服务可用性</h2>
          <p>
            虽然我们努力保持服务的持续可用性，但不保证服务的持续访问。我们保留随时修改、暂停或终止服务任何方面的权利，恕不另行通知。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">7. 内容指南</h2>
          <p>你同意不生成：</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>违反任何适用法律或法规的内容</li>
            <li>仇恨、歧视或冒犯性内容</li>
            <li>侵犯知识产权的内容</li>
            <li>性露骨或色情内容</li>
            <li>旨在骚扰、虐待或伤害他人的内容</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">8. 责任限制</h2>
          <p>
            本服务以“现状”提供，不提供任何明示或默示的保证。我们不对因使用或无法使用本服务而产生的任何损害负责，包括但不限于直接、间接、附带、惩罚性及后果性损害。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">9. 条款变更</h2>
          <p>
            我们保留随时修改本条款的权利。在任何变更后继续使用该服务即表示接受新条款。我们将通过在本页发布更新后的条款通知用户重大变更。
          </p>
        </section>

        <div className="pt-4 text-xs text-slate-500">
          <Link href="/" className="hover:underline">
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}


