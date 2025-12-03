import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

console.log('=== 环境文件检查 ===');
console.log('项目根目录:', projectRoot);
console.log('环境文件路径:', envPath);
console.log('');

const exists = fs.existsSync(envPath);
console.log('文件存在:', exists ? '✅ 是' : '❌ 否');

if (!exists) {
  console.error('\n❌ .env.local 文件不存在');
  console.log('请创建 .env.local 文件并配置必要的环境变量。');
  process.exit(1);
}

console.log('\n正在读取文件内容...');
const content = fs.readFileSync(envPath, 'utf8');
const lines = content
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

console.log('环境变量数量:', lines.length);
console.log('');

const parsed = lines.map((line) => {
  const [key, ...rest] = line.split('=');
  return { key, value: rest.join('=').trim() };
});

// 检查必需变量
console.log('=== 必需变量检查 ===');
const requiredVars = ['SEEDREAM_API_KEY'];
requiredVars.forEach((varName) => {
  const found = parsed.find(({ key }) => key === varName);
  if (found && found.value) {
    console.log(`${varName}: ✅ 已设置`);
  } else {
    console.log(`${varName}: ❌ 未设置或为空`);
  }
});

// 检查 PayPal/Supabase 相关变量
console.log('\n=== PayPal/Supabase 相关变量 ===');
const paypalVars = parsed.filter(({ key }) => /PAYPAL|SUPABASE/.test(key));
if (paypalVars.length === 0) {
  console.log('未找到 PayPal/Supabase 相关变量');
} else {
  paypalVars.forEach(({ key, value }) => {
    console.log(`${key}: ${value ? '✅ 已设置' : '❌ 空值'}`);
    if (value && value.length > 50) {
      console.log(`  值长度: ${value.length} 字符`);
    }
  });
}

// 验证 PAYPAL_PLAN_MAPPING
console.log('\n=== PAYPAL_PLAN_MAPPING 验证 ===');
const planMappingVar = parsed.find(({ key }) => key === 'PAYPAL_PLAN_MAPPING');
if (planMappingVar) {
  try {
    const mapping = JSON.parse(planMappingVar.value);
    
    // 验证结构
    const isValid = 
      mapping.monthly && 
      mapping.yearly &&
      typeof mapping.monthly.basic === 'string' &&
      typeof mapping.monthly.pro === 'string' &&
      typeof mapping.monthly.max === 'string' &&
      typeof mapping.yearly.basic === 'string' &&
      typeof mapping.yearly.pro === 'string' &&
      typeof mapping.yearly.max === 'string';
    
    if (isValid) {
      console.log('✅ 合法 JSON 且结构正确');
      console.log('  月付计划:');
      console.log(`    basic: ${mapping.monthly.basic}`);
      console.log(`    pro: ${mapping.monthly.pro}`);
      console.log(`    max: ${mapping.monthly.max}`);
      console.log('  年付计划:');
      console.log(`    basic: ${mapping.yearly.basic}`);
      console.log(`    pro: ${mapping.yearly.pro}`);
      console.log(`    max: ${mapping.yearly.max}`);
    } else {
      console.log('❌ JSON 结构不完整');
      console.log('  需要包含: monthly.basic, monthly.pro, monthly.max, yearly.basic, yearly.pro, yearly.max');
    }
  } catch (error) {
    console.error('❌ JSON 解析失败:', error.message);
  }
} else {
  console.log('⚠️  未配置 PAYPAL_PLAN_MAPPING（将使用默认值）');
}

console.log('\n=== 检查完成 ===');

