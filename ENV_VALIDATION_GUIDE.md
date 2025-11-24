# 环境变量验证指南

## 快速验证步骤

### 1. 确认 `.env.local` 文件位置
文件应该在项目根目录：`d:\cursor project\.env.local`

### 2. 检查必需变量

`.env.local` 文件应包含以下内容：

```env
# 必需变量
SEEDREAM_API_KEY=your_api_key_here

# 可选变量（有默认值）
SEEDREAM_API_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/images/generations
SEEDREAM_MODEL=doubao-seedream-4-0-250828

# PayPal 订阅计划映射（JSON 字符串格式）
PAYPAL_PLAN_MAPPING={"monthly":{"basic":"P-xxx","pro":"P-xxx","max":"P-xxx"},"yearly":{"basic":"P-xxx","pro":"P-xxx","max":"P-xxx"}}
```

### 3. PAYPAL_PLAN_MAPPING 格式验证

`PAYPAL_PLAN_MAPPING` 必须：
- ✅ 是有效的 JSON 字符串
- ✅ 包含 `monthly` 和 `yearly` 两个键
- ✅ 每个键下包含 `basic`、`pro`、`max` 三个计划 ID
- ✅ 所有计划 ID 都是非空字符串

**正确示例：**
```env
PAYPAL_PLAN_MAPPING={"monthly":{"basic":"P-33W263280A994581YNEPNRYQ","pro":"P-60M89877BT707251GNEPNS4Q","max":"P-39K35255EV002711VNEPNTWQ"},"yearly":{"basic":"P-0FE744777L2833816NEPNSOA","pro":"P-2UA39161M82718617NEPNTIY","max":"P-1S822695CV3353749NEPNUCQ"}}
```

### 4. 手动验证方法

#### 方法 1：使用 Node.js 验证 JSON
在项目根目录运行：
```bash
node -e "const fs=require('fs');try{const content=fs.readFileSync('.env.local','utf8');const line=content.split('\n').find(l=>l.startsWith('PAYPAL_PLAN_MAPPING='));if(line){const value=line.split('=').slice(1).join('=');const parsed=JSON.parse(value);console.log('✅ PAYPAL_PLAN_MAPPING 格式正确');console.log('月付计划:',Object.keys(parsed.monthly||{}));console.log('年付计划:',Object.keys(parsed.yearly||{}));}else{console.log('❌ 未找到 PAYPAL_PLAN_MAPPING');}}catch(e){console.log('❌ 错误:',e.message);}"
```

#### 方法 2：启动开发服务器测试
```bash
npm run dev
```
然后访问 `http://localhost:3000`，检查：
- 页面是否正常加载
- 控制台是否有环境变量相关的警告
- PayPal 相关功能是否正常

#### 方法 3：使用 API 调试端点
如果应用正在运行，访问：
```
http://localhost:3000/api/debug/env
```
查看环境变量配置状态。

### 5. 常见问题

**问题：PAYPAL_PLAN_MAPPING 格式错误**
- 确保 JSON 字符串没有换行
- 确保所有引号都是双引号
- 确保没有多余的逗号

**问题：环境变量未生效**
- 重启开发服务器（`npm run dev`）
- 清除 Next.js 缓存：删除 `.next` 文件夹后重新启动

**问题：文件找不到**
- 确认文件在项目根目录
- 确认文件名是 `.env.local`（注意开头的点）

## 验证清单

- [ ] `.env.local` 文件存在于项目根目录
- [ ] `SEEDREAM_API_KEY` 已配置且不为空
- [ ] `PAYPAL_PLAN_MAPPING` 已配置（如需要 PayPal 功能）
- [ ] `PAYPAL_PLAN_MAPPING` 是有效的 JSON 字符串
- [ ] JSON 包含所有必需的键（monthly.basic, monthly.pro, monthly.max, yearly.basic, yearly.pro, yearly.max）
- [ ] 所有计划 ID 都是非空字符串

## 开始测试

如果以上检查都通过，可以开始本地测试：

```bash
npm run dev
```

访问 `http://localhost:3000` 开始测试！

