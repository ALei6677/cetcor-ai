import fs from 'fs';
import path from 'path';
import url from 'url';

/**
 * @description 检查 .env.local 是否存在及其关键变量配置
 */
function checkEnvFile() {
  const cwd = path.dirname(url.fileURLToPath(import.meta.url));
  const envPath = path.join(cwd, '..', '.env.local');

  console.log('=== 环境文件检查 ===');
  console.log('环境文件路径:', envPath);
  const exists = fs.existsSync(envPath);
  console.log('文件存在:', exists);

  if (!exists) {
    console.error('❌ .env.local 文件不存在');
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  console.log('环境变量数量:', lines.length);

  const parsed = lines.map((line) => {
    const [key, ...rest] = line.split('=');
    return { key, value: rest.join('=').trim() };
  });

  const paypalVars = parsed.filter(({ key }) => /PAYPAL|SUPABASE/.test(key));

  console.log('PayPal/Supabase 相关变量:');
  paypalVars.forEach(({ key, value }) => {
    console.log(`  ${key}: ${value ? '已设置' : '空值'}`);
  });

  const planMappingVar = parsed.find(({ key }) => key === 'PAYPAL_PLAN_MAPPING');
  if (planMappingVar) {
    try {
      JSON.parse(planMappingVar.value);
      console.log('PAYPAL_PLAN_MAPPING: ✅ 合法 JSON');
    } catch (error) {
      console.error('PAYPAL_PLAN_MAPPING: ❌ JSON 解析失败', error.message);
    }
  }
}

checkEnvFile();

