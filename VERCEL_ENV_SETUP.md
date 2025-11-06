# Vercel 环境变量配置指南

## 📋 需要配置的环境变量

### 必需变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SEEDREAM_API_KEY` | API 密钥（**必需**） | `AKLTYWJkZTExNjA1ZDUy...` |

### 可选变量（已有默认值）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SEEDREAM_API_ENDPOINT` | API 端点地址 | `https://ark.cn-beijing.volces.com/api/v3/images/generations` |
| `SEEDREAM_MODEL` | API 模型名称 | `doubao-seedream-4-0-250828` |

## 🔧 配置步骤

### 方法 1：通过 Vercel Dashboard 配置

1. **打开项目设置**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 选择 `cetcor-ai` 项目（或您的项目名称）
   - 点击顶部导航栏的 **Settings**

2. **进入环境变量页面**
   - 在左侧菜单中点击 **Environment Variables**

3. **添加环境变量**
   
   **添加 `SEEDREAM_API_KEY`（必需）：**
   - 在 "Key" 输入框中输入：`SEEDREAM_API_KEY`
   - 在 "Value" 输入框中输入：您的 API 密钥
   - 选择环境：**Production**、**Preview**、**Development**（建议全选）
   - 点击 **Add** 按钮

   **（可选）添加其他变量：**
   - 如果需要自定义 API 端点或模型，按照相同方式添加 `SEEDREAM_API_ENDPOINT` 和 `SEEDREAM_MODEL`

4. **重新部署**
   - 环境变量添加后，Vercel 会自动触发重新部署
   - 或者手动触发：
     - 进入 **Deployments** 页面
     - 找到最新部署，点击右侧 "..." 菜单
     - 选择 **Redeploy**

### 方法 2：通过 Vercel CLI 配置

```bash
# 安装 Vercel CLI（如果尚未安装）
npm i -g vercel

# 登录 Vercel
vercel login

# 添加环境变量
vercel env add SEEDREAM_API_KEY production
# 然后输入您的 API 密钥

# 如果还需要添加到其他环境
vercel env add SEEDREAM_API_KEY preview
vercel env add SEEDREAM_API_KEY development
```

## ✅ 验证配置

配置完成后，请验证：

1. **检查部署日志**
   - 在 Vercel Dashboard 的 **Deployments** 页面
   - 查看最新部署的 **Build Logs**
   - 确认构建成功且没有环境变量相关的错误

2. **测试网站功能**
   - 访问您的生产环境 URL（如 `https://cetcor-ai.vercel.app`）
   - 尝试生成一张图片
   - 如果成功生成，说明配置正确 ✅

3. **检查运行时日志**
   - 如果图片生成失败
   - 在 **Deployments** → **Runtime Logs** 中查看错误信息
   - 常见问题：
     - API 密钥错误 → 检查密钥是否正确
     - 环境变量未生效 → 确认已添加到 Production 环境并重新部署

## 🔒 安全注意事项

- ✅ **不要**在代码仓库中提交包含真实 API 密钥的 `.env.local` 文件
- ✅ **确保** `.env.local` 已在 `.gitignore` 中
- ✅ 环境变量应仅通过 Vercel Dashboard 或 CLI 配置
- ✅ 定期轮换 API 密钥以提高安全性

## 📝 故障排除

### 问题：环境变量已添加但应用仍无法正常工作

**解决方案：**
1. 确认环境变量已添加到 **Production** 环境（不仅是 Development）
2. 重新部署应用（环境变量修改后需要重新部署才能生效）
3. 检查 API 密钥是否正确且有效

### 问题：如何获取 API 密钥？

请联系火山引擎 API 服务提供商获取 API 密钥。

## 📚 相关文档

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 环境变量文档](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

