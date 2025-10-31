# Seedream AI 图片生成平台

基于 Seedream 4.0 API 的 AI 图片生成网站 MVP。

## ✨ 功能特性

- 🎨 **AI 图片生成** - 通过文本提示词生成高质量图片
- 🖼️ **轮播展示** - 精美的 3D 卡片轮播效果展示示例图片
- 📜 **历史记录** - 本地存储生成历史（无需数据库）
- 🌐 **多语言支持** - 中文/英文切换
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **快速部署** - 基于 Next.js 16，支持 Vercel 一键部署

## 🛠️ 技术栈

- **前端框架**: Next.js 16 (App Router)
- **开发语言**: TypeScript (严格模式)
- **样式方案**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod
- **轮播组件**: Embla Carousel
- **部署平台**: Vercel

## 📦 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 2. 配置环境变量

创建 `.env.local` 文件并填入您的 Seedream API 密钥：

```env
SEEDREAM_API_KEY=your_api_key_here
SEEDREAM_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/images/generations
SEEDREAM_MODEL=doubao-seedream-4-0-250828
```

### 3. 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
seedream-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── generate/      # 图片生成 API
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # 组件目录
│   ├── ui/               # 基础 UI 组件（shadcn/ui）
│   ├── generation-form.tsx    # 生成表单
│   ├── image-gallery.tsx      # 图片画廊
│   ├── hero-carousel.tsx      # 轮播组件
│   ├── history-dialog.tsx     # 历史记录弹窗
│   └── language-switcher.tsx  # 语言切换器
├── lib/                   # 工具库
│   ├── seedream-client.ts # API 客户端封装
│   └── utils.ts           # 工具函数
├── stores/                # 状态管理
│   ├── history-store.ts   # 历史记录 Store
│   └── language-store.ts  # 多语言 Store
├── types/                 # TypeScript 类型定义
│   └── seedream.types.ts  # Seedream API 类型
└── constants/             # 常量配置
    └── api.constants.ts   # API 相关常量
```

## 🚀 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 点击部署

### 其他平台

项目支持部署到任何支持 Next.js 的平台，如：
- Netlify
- Railway
- AWS Amplify

## 📝 使用说明

1. **生成图片**
   - 在提示词输入框中描述你想要生成的图片
   - 选择图片尺寸和生成数量
   - 点击"生成"按钮

2. **查看历史**
   - 点击顶部导航栏的"历史记录"按钮
   - 查看之前生成的所有图片
   - 支持删除单条或清空所有历史

3. **切换语言**
   - 点击右上角的语言切换器
   - 在中文和英文之间切换

## 🔧 开发

### 代码规范

- 文件命名：kebab-case
- 组件命名：PascalCase
- 函数/变量：camelCase
- 所有公共 API 必须添加 JSDoc 注释

### 添加新功能

1. 在对应目录创建文件
2. 遵循现有代码结构
3. 添加必要的注释
4. 更新类型定义（如需要）

## 🐛 故障排除

### API 调用失败

- 检查 `.env.local` 中的 API 密钥是否正确
- 确认网络连接正常
- 查看浏览器控制台的错误信息

### 图片显示问题

- 检查 `next.config.ts` 中的图片域名配置
- 确保图片 URL 可访问

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请提交 GitHub Issue。
