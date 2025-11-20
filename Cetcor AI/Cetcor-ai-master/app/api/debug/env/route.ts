import { NextResponse } from 'next/server';

/**
 * @description 环境变量诊断端点，仅在非生产环境暴露摘要信息
 */
export async function GET() {
  // 生产环境直接拒绝，避免敏感信息意外暴露
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Diagnostics disabled in production' },
      { status: 403 }
    );
  }

  const safeString = (value?: string | null, prefixLength = 6) => {
    if (!value) return '未配置';
    return `${value.slice(0, prefixLength)}...`;
  };

  const envStatus = {
    paypal: {
      clientId: {
        configured: !!process.env.PAYPAL_CLIENT_ID,
        length: process.env.PAYPAL_CLIENT_ID?.length ?? 0,
        preview: safeString(process.env.PAYPAL_CLIENT_ID, 10),
      },
      clientSecret: {
        configured: !!process.env.PAYPAL_CLIENT_SECRET,
        length: process.env.PAYPAL_CLIENT_SECRET?.length ?? 0,
        preview: process.env.PAYPAL_CLIENT_SECRET ? '***' : '未配置',
      },
      env: process.env.PAYPAL_ENV ?? '未配置',
    },
    supabase: {
      serviceRole: {
        configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
      },
    },
    planMapping: {
      configured: !!process.env.PAYPAL_PLAN_MAPPING,
      validJson: false,
    },
  };

  // 检查 JSON 配置是否可解析
  try {
    if (process.env.PAYPAL_PLAN_MAPPING) {
      JSON.parse(process.env.PAYPAL_PLAN_MAPPING);
      envStatus.planMapping.validJson = true;
    }
  } catch {
    envStatus.planMapping.validJson = false;
  }

  return NextResponse.json({
    status: 'diagnostic',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    envStatus,
  });
}

