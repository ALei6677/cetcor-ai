# 🚀 网站发布指南

本文档详细说明了如何将 Cetcor AI 图片生成平台发布到生产环境。

## 📋 发布前准备清单

### 1. 代码准备

确保所有代码已经完成并测试：

- [x] 功能完整（图片生成、下载、历史记录等）
- [x] 无编译错误
- [x] 无 linter 错误
- [x] 代码已提交到 Git 仓库

### 2. 环境变量配置

在发布前，确保准备好以下环境变量：

```env
SEEDREAM_API_KEY=your_api_key_here
SEEDREAM_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/images/generations
SEEDREAM_MODEL=doubao-seedream-4-0-250828
```

**重要提示：**
- `.env.local` 文件**不会**被提交到 Git（已在 `.gitignore` 中）
- 需要在部署平台单独配置这些环境变量

---

## 🌐 方式一：Vercel 部署（推荐）

### 步骤 1：准备 Git 仓库

如果还没有 Git 仓库，需要先创建：

```bash
cd seedream-ai
git init
git add .
git commit -m "Initial commit: Seedream AI platform"
```

### 步骤 2：推送到 GitHub

1. **在 GitHub 创建新仓库**
   - 登录 GitHub
   - 点击右上角 "+" → "New repository"
   - 输入仓库名称（如 `seedream-ai`）
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize with README"（如果代码已有 README）
   - 点击 "Create repository"

2. **推送代码到 GitHub**
   ```bash
   # 添加远程仓库（替换 YOUR_USERNAME 和 REPO_NAME）
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   
   # 重命名分支为 main（如果需要）
   git branch -M main
   
   # 推送代码
   git push -u origin main
   ```

### 步骤 3：在 Vercel 部署

1. **登录 Vercel**
   - 访问 [https://vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录（推荐）

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 在 "Import Git Repository" 中找到刚创建的仓库
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Next.js（应该自动检测）
   - **Root Directory**: `./`（默认，无需修改）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `.next`（默认）
   - **Install Command**: `npm install`（默认）

4. **配置环境变量**
   - 展开 "Environment Variables" 部分
   - 添加以下三个环境变量：
     
     | Name | Value |
     |------|-------|
     | `SEEDREAM_API_KEY` | 您的 API 密钥 |
     | `SEEDREAM_API_ENDPOINT` | `https://ark.cn-beijing.volces.com/api/v3/images/generations` |
     | `SEEDREAM_MODEL` | `doubao-seedream-4-0-250828` |

   - 确保所有三个环境都已选中（Production, Preview, Development）
   - 点击 "Add" 添加每个变量

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常 2-5 分钟）
   - 部署成功后，Vercel 会提供一个 URL（如 `https://seedream-ai.vercel.app`）

### 步骤 4：验证部署

1. **访问部署的网站**
   - 在浏览器中打开 Vercel 提供的 URL
   - 检查页面是否正常加载

2. **功能测试**
   - [ ] 测试图片生成功能
   - [ ] 测试图片下载功能
   - [ ] 测试历史记录功能
   - [ ] 测试多语言切换
   - [ ] 测试响应式设计（移动端）

3. **检查控制台**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 是否有错误
   - 查看 Network 检查 API 请求是否正常

### 步骤 5：自定义域名（可选）

如果需要使用自定义域名：

1. 在 Vercel 项目设置中，进入 "Domains"
2. 输入您的域名（如 `seedream.example.com`）
3. 按照 Vercel 的指示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

---

## 🖥️ 方式二：其他平台部署

### Netlify 部署

1. **准备代码**
   ```bash
   npm run build
   npm run export  # 如果需要静态导出
   ```

2. **部署方式**
   - 方式 A：通过 Git 集成（类似 Vercel）
   - 方式 B：拖拽 `.next` 目录到 Netlify
   - 方式 C：使用 Netlify CLI：
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod
     ```

3. **配置环境变量**
   - 在 Netlify 项目设置 → Environment variables 中配置

### Railway 部署

1. **安装 Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **登录并初始化**
   ```bash
   railway login
   railway init
   ```

3. **设置环境变量**
   ```bash
   railway variables set SEEDREAM_API_KEY=your_key
   railway variables set SEEDREAM_API_ENDPOINT=https://...
   railway variables set SEEDREAM_MODEL=doubao-seedream-4-0-250828
   ```

4. **部署**
   ```bash
   railway up
   ```

### 自托管（VPS/服务器）

1. **服务器要求**
   - Node.js 18+ 
   - npm 或 yarn
   - 至少 1GB RAM
   - 端口 3000（或自定义端口）

2. **部署步骤**
   ```bash
   # 1. 连接到服务器
   ssh user@your-server.com
   
   # 2. 克隆仓库
   git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
   cd REPO_NAME
   
   # 3. 安装依赖
   npm install
   
   # 4. 创建环境变量文件
   nano .env.local
   # 添加环境变量
   
   # 5. 构建项目
   npm run build
   
   # 6. 使用 PM2 运行（推荐）
   npm install -g pm2
   pm2 start npm --name "seedream-ai" -- start
   pm2 save
   pm2 startup
   ```

3. **配置 Nginx 反向代理**（可选）
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 🔧 本地生产构建测试

在正式部署前，建议先在本地测试生产构建：

```bash
# 1. 安装依赖（如果还没有）
npm install

# 2. 构建生产版本
npm run build

# 3. 启动生产服务器
npm start

# 4. 在浏览器访问 http://localhost:3000
# 5. 测试所有功能

# 6. 检查构建输出是否有警告或错误
```

**常见问题：**
- 如果构建失败，检查错误信息并修复
- 确保所有环境变量在 `.env.local` 中配置
- 检查 `next.config.ts` 是否有配置错误

---

## 📝 发布后检查清单

部署完成后，请确认以下内容：

### 功能测试
- [ ] 首页正常加载
- [ ] 图片生成功能正常
- [ ] 图片可以正常显示
- [ ] 图片下载功能正常
- [ ] 历史记录功能正常
- [ ] 多语言切换正常
- [ ] 响应式设计正常（桌面端和移动端）

### 性能检查
- [ ] 页面加载速度正常
- [ ] 图片懒加载工作正常
- [ ] 滚动流畅（无卡顿）
- [ ] API 响应时间合理

### 错误检查
- [ ] 浏览器控制台无错误
- [ ] 网络请求无失败
- [ ] 错误处理正常工作
- [ ] 错误提示用户友好

### 安全检查
- [ ] API 密钥未暴露在前端代码中
- [ ] HTTPS 已启用（Vercel 自动提供）
- [ ] 环境变量已正确配置

---

## 🔄 更新部署

代码更新后重新部署：

### Vercel（自动部署）
- 推送到 GitHub 主分支后，Vercel 会自动重新部署
- 在 Vercel Dashboard 可以查看部署历史

### 手动重新部署
```bash
# 1. 提交代码更改
git add .
git commit -m "Update: description of changes"
git push

# 2. Vercel 会自动触发部署
# 或手动触发：
vercel --prod
```

---

## 🐛 故障排除

### 问题 1：构建失败

**原因：** 代码错误或配置问题

**解决：**
```bash
# 在本地运行构建检查
npm run build

# 查看详细错误信息
# 修复错误后重新提交
```

### 问题 2：环境变量未生效

**原因：** 环境变量未正确配置

**解决：**
- 在部署平台检查环境变量是否已添加
- 确保变量名称拼写正确
- 重新部署项目

### 问题 3：API 调用失败

**原因：** API 密钥错误或网络问题

**解决：**
- 检查 API 密钥是否正确
- 确认 API 端点可访问
- 查看服务器日志（Vercel → Functions → Logs）

### 问题 4：图片无法显示

**原因：** 图片域名未在 `next.config.ts` 中配置

**解决：**
- 检查 `next.config.ts` 中的 `remotePatterns`
- 添加缺失的图片域名
- 重新部署

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**
   - Vercel: Dashboard → Project → Functions → Logs
   - 本地: 运行 `npm run dev` 查看终端输出

2. **检查文档**
   - Next.js 文档: https://nextjs.org/docs
   - Vercel 文档: https://vercel.com/docs

3. **提交 Issue**
   - 在 GitHub 仓库提交问题报告

---

## ✅ 发布成功确认

当以下所有项都完成时，表示发布成功：

- ✅ 代码已推送到 GitHub
- ✅ Vercel 构建成功
- ✅ 环境变量已配置
- ✅ 网站可以正常访问
- ✅ 所有功能测试通过
- ✅ 无控制台错误
- ✅ 性能表现良好

**恭喜！您的网站已成功发布！🎉**

