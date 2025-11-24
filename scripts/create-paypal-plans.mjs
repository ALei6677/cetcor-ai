import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 通过 PayPal REST API 在 Sandbox 环境下创建订阅计划和产品
 * 
 * 使用方法：
 * 1. 确保 .env.local 中配置了 PayPal Sandbox 凭证
 * 2. 运行: node scripts/create-paypal-plans.mjs
 */

// 加载环境变量
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ 错误: .env.local 文件不存在');
    console.error('请先创建 .env.local 文件并配置 PayPal 凭证');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim();
      }
    }
  });

  return env;
}

const env = loadEnv();

const PAYPAL_ENV = env.PAYPAL_ENV || 'sandbox';
const PAYPAL_BASE = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ 错误: 请在 .env.local 中配置 PAYPAL_CLIENT_ID 和 PAYPAL_CLIENT_SECRET');
  process.exit(1);
}

// 计划配置
const PLANS_CONFIG = [
  { planId: 'basic', name: 'Basic Plan', monthly: 15, yearly: 144 },
  { planId: 'pro', name: 'Pro Plan', monthly: 25, yearly: 240 },
  { planId: 'max', name: 'Max Plan', monthly: 55, yearly: 540 },
];

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  console.log('🔐 正在获取 PayPal Access Token...');
  
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ 获取 Access Token 失败');
    console.error(`状态码: ${res.status}`);
    console.error(`响应: ${text}`);
    throw new Error(`获取 Access Token 失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log('✅ Access Token 获取成功\n');
  return data.access_token;
}

async function createProduct(name, description, token) {
  console.log(`📦 正在创建产品: ${name}...`);
  
  const res = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ 创建产品失败: ${name}`);
    console.error(`状态码: ${res.status}`);
    console.error(`响应: ${text}`);
    throw new Error(`创建产品失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log(`✅ 产品创建成功: ${name}`);
  console.log(`   ID: ${data.id}\n`);
  return data.id;
}

async function createPlan(
  productId,
  name,
  price,
  billingCycle,
  token
) {
  const isMonthly = billingCycle === 'monthly';
  const intervalUnit = isMonthly ? 'MONTH' : 'YEAR';
  const intervalCount = isMonthly ? 1 : 1; // 年付也是 1 年一个周期
  
  console.log(`📋 正在创建计划: ${name} ($${price}/${billingCycle})...`);
  
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description: `${name} - ${isMonthly ? 'Monthly' : 'Yearly'} subscription for Cetcor AI`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: intervalCount,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // 0 = 无限期订阅
          pricing_scheme: {
            fixed_price: {
              value: price.toFixed(2),
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0.00',
          currency_code: 'USD',
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
      taxes: {
        percentage: '0.00',
        inclusive: false,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ 创建计划失败: ${name}`);
    console.error(`状态码: ${res.status}`);
    console.error(`响应: ${text}`);
    throw new Error(`创建计划失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  console.log(`✅ 计划创建成功: ${name}`);
  console.log(`   ID: ${data.id}\n`);
  return data.id;
}

async function main() {
  console.log('🚀 开始创建 PayPal Sandbox 订阅计划...\n');
  console.log(`环境: ${PAYPAL_ENV}`);
  console.log(`API 端点: ${PAYPAL_BASE}\n`);

  try {
    const token = await getAccessToken();

    const results = {};

    for (const config of PLANS_CONFIG) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`处理 ${config.name}...`);
      console.log('='.repeat(50));
      
      // 创建产品
      const productId = await createProduct(
        config.name,
        `${config.name} subscription for Cetcor AI`,
        token
      );

      // 创建月付计划
      const monthlyPlanId = await createPlan(
        productId,
        `${config.name} Monthly`,
        config.monthly,
        'monthly',
        token
      );

      // 创建年付计划
      const yearlyPlanId = await createPlan(
        productId,
        `${config.name} Yearly`,
        config.yearly,
        'yearly',
        token
      );

      results[config.planId] = {
        monthly: monthlyPlanId,
        yearly: yearlyPlanId,
      };
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有计划创建完成！');
    console.log('='.repeat(50) + '\n');
    
    const planMapping = {
      monthly: {
        basic: results.basic.monthly,
        pro: results.pro.monthly,
        max: results.max.monthly,
      },
      yearly: {
        basic: results.basic.yearly,
        pro: results.pro.yearly,
        max: results.max.yearly,
      },
    };

    console.log('请将以下内容添加到你的 .env.local 文件中：\n');
    console.log('PAYPAL_PLAN_MAPPING=' + JSON.stringify(planMapping));
    console.log('\n或者手动添加：\n');
    console.log('PAYPAL_PLAN_MAPPING={"monthly":{"basic":"' + results.basic.monthly + '","pro":"' + results.pro.monthly + '","max":"' + results.max.monthly + '"},"yearly":{"basic":"' + results.basic.yearly + '","pro":"' + results.pro.yearly + '","max":"' + results.max.yearly + '"}}');
    console.log('\n📝 详细计划 ID：\n');
    console.log(JSON.stringify(planMapping, null, 2));
    console.log('\n✅ 完成！');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    if (error.stack) {
      console.error('\n堆栈跟踪:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

