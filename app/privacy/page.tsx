'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-purple-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 text-slate-800">
        <header className="space-y-2 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold">隐私策略</h1>
          <p className="text-xs text-slate-500">更新时间：2025年12月2日</p>
          <p className="text-sm text-slate-500">
            欢迎来到 Cetcor ai，一个由人工智能驱动的创意平台和图像生成服务。本隐私政策描述了我们如何收集、使用和保护您在
            cetcorai.com 使用服务时的信息。
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">1、介绍</h2>
          <p>
            欢迎来到 Cetcor ai，一个由人工智能驱动的创意平台和图像生成服务。本隐私政策描述了我们如何收集、使用和保护您在
            Cetcor ai 使用服务时的信息。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">2、数据采集</h2>
          <p>我们收集有限数据以提供和改进服务：</p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">3、使用数据</h2>
          <p>我们收集的内容：关于您与我们服务互动的信息，包括所使用的功能、会话时长和一般使用模式。</p>
          <p>我们收集这些数据的原因：了解我们的服务如何被使用，并提升用户体验。</p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">4、设备信息</h2>
          <p>我们收集的内容：基本设备和浏览器信息，如设备类型、操作系统和浏览器版本。</p>
          <p>我们收集数据的原因：确保我们的服务能在不同设备和浏览器上正常运行。</p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">5、Cookies</h2>
          <p>我们收集的内容：小型数据文件，帮助记住你的偏好并提升你的体验。</p>
          <p>我们收集它的原因：为了提升功能性，提供个性化体验。</p>
          <p className="font-medium">
            重要提示：除非您明确提供支持用途，否则我们不会收集个人身份信息（PII），如姓名、电子邮件地址或联系方式。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">6、数据的使用</h2>
          <p>我们仅将收集到的数据用于：</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>分析并提升我们的服务绩效</li>
            <li>了解用户行为模式以增强功能</li>
            <li>确保各设备间的技术兼容性</li>
            <li>在需要时提供客户支持</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">7、数据共享</h2>
          <p>我们不出售您的数据。我们不会与第三方分享您的个人信息，除非：</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>法律或法律程序要求时</li>
            <li>为了保护我们的权利或用户的安全</li>
            <li>与帮助我们运营服务的服务提供商（在严格保密协议下）</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">8、人工智能处理通知</h2>
          <p>
            使用我们的图像生成服务时，您的提示和上传的图片可能会由第三方 AI 模型提供商处理。这种处理对于实现我们的核心服务功能是必要的。我们确保此处理符合隐私标准和与 AI
            服务提供商的合同协议。
          </p>
          <p>关于人工智能处理的重要考虑因素：</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>您的提示和图片会被发送到第三方 AI 模型 API 进行处理</li>
            <li>我们与信誉良好的 AI 服务提供商合作，这些服务商维护自己的隐私和安全标准</li>
            <li>AI 处理涉及对内容的自动分析以生成结果</li>
            <li>我们不会将您的原始提示或图片存储超过服务交付所需的时间</li>
            <li>第三方 AI 提供商可能有自己的数据处理方式，而这些我们无法控制</li>
          </ul>
          <p>
            使用我们的人工智能驱动功能即表示您同意此处理，并承认其涉及独立于我们直接控制的第三方服务。
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">9、AI 模型归因与授权</h2>
          <p>AI 模型使用：我们的服务采用多种 AI 模型和 API，均在适当的许可条款下使用。我们遵守所有适用的 AI 模型使用许可要求。</p>
          <p>内容使用限制：生成内容的使用权因订阅计划而异。基础套餐用户仅限于个人和教育用途，而高级用户则包含商业使用权。</p>
          <p>模型来源透明度：我们使用第三方 AI 模型 API 和服务。底层的人工智能模型由独立第三方开发，我们作为服务接口提供商运营。</p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">10、你的权利</h2>
          <p>你有权：</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>访问：请求我们收集的关于您数据的信息</li>
            <li>更正：请求纠正任何不准确的数据</li>
            <li>删除：请求删除您的数据</li>
            <li>退出：通过浏览器设置禁用 Cookie</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">11、Cookies 管理</h2>
          <p>您可以通过浏览器设置控制 Cookie。禁用 Cookie 可能会影响服务功能，但核心 AI 图像编辑功能将保留。</p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">12、本隐私政策的变更</h2>
          <p>
            我们可能会不时更新本隐私政策。我们会在本页面发布任何变更并更新生效日期。在更改后继续使用我们的服务即表示接受更新后的政策。
          </p>
          <p>使用 Cetcor ai 即表示您同意根据本隐私政策收集和使用信息。</p>
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


