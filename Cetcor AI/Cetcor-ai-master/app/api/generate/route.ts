import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SeedreamClient, getErrorMessage } from '@/lib/seedream-client';
import type { IApiResponse } from '@/types/seedream.types';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabase-admin';
import type { PostgrestError } from '@supabase/supabase-js';
import { CREDIT_COST_PER_IMAGE } from '@/constants/billing';

/**
 * 请求参数验证Schema
 */
const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, '提示词不能为空').max(1000, '提示词不能超过1000个字符'),
  size: z.enum(['1k', '2k', '4k', '1024x1024', '1920x1080', '1080x1920', '1600x1200', '1200x1600']).optional(),
  maxImages: z.number().min(1).max(6).optional(),
  watermark: z.boolean().optional(),
  // 支持普通URL和base64 data URL
  image: z.array(
    z.string().refine(
      (val) => {
        // 检查是否为有效的URL或base64 data URL
        try {
          if (val.startsWith('data:image/')) {
            return true; // base64 data URL
          }
          new URL(val); // 普通URL
          return true;
        } catch {
          return false;
        }
      },
      { message: '图片URL格式无效，必须是有效的URL或base64 data URL' }
    )
  ).optional(),
});

/**
 * POST /api/generate
 * 生成图片的API端点
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: 'Supabase 未正确配置，生成服务暂不可用',
        },
        { status: 500 }
      );
    }

    // 0. 校验用户登录状态并获取当前订阅与剩余点数
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: '请先登录后再生成图片',
        },
        { status: 401 }
      );
    }

    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证输入参数
    const validated = GenerateRequestSchema.parse(body);

    // Debug: 仅在开发环境打印参数
    if (process.env.NODE_ENV === 'development') {
      console.log('收到的请求参数:', JSON.stringify(body, null, 2));
      console.log('验证后的size参数:', validated.size);
    }

    // 3. 计算本次调用消耗的点数（按生成张数计费）
    const imagesToGenerate = validated.maxImages || 3;
    const creditsToConsume = imagesToGenerate * CREDIT_COST_PER_IMAGE;

    // 3.1 查询用户当前有效订阅
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, credits_total, credits_used, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('查询订阅信息失败:', subError);
      }
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: '查询订阅信息失败，请稍后重试',
        },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: '当前没有可用订阅或点数，请先购买套餐',
        },
        { status: 402 } // Payment Required
      );
    }

    const remainingCredits =
      (subscription.credits_total as number) - (subscription.credits_used as number);

    if (remainingCredits < creditsToConsume) {
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: '点数不足，请升级或续费套餐',
        },
        { status: 402 }
      );
    }

    // 3.2 使用乐观锁扣减点数：要求 credits_used 仍然等于我们读取到的旧值
    const newUsed = (subscription.credits_used as number) + creditsToConsume;
    const nowIso = new Date().toISOString();

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        credits_used: newUsed,
        updated_at: nowIso,
      })
      .eq('id', subscription.id)
      .eq('credits_used', subscription.credits_used as number)
      .select('id');

    if (updateError) {
      const pgError = updateError as PostgrestError | undefined;
      const isUniqueConflict = pgError?.code === '23505';

      if (process.env.NODE_ENV === 'development') {
        console.error('扣减点数失败:', updateError);
      }

      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: isUniqueConflict ? '订单已存在，请勿重复提交' : '系统繁忙，请稍后重试',
        },
        { status: isUniqueConflict ? 409 : 500 }
      );
    }

    // 如果没有任何行被更新，说明在我们读取和更新之间有其他请求修改了 credits_used
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: '点数状态已变更，请刷新后重试',
        },
        { status: 409 } // Conflict
      );
    }

    // 4. 检查API密钥
    const apiKey = process.env.SEEDREAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json<IApiResponse>({
        success: false,
        data: null,
        error: 'API密钥未配置',
      }, { status: 500 });
    }

    // 5. 创建API客户端
    const client = new SeedreamClient(apiKey);

    // 6. 调用API生成图片
    const result = await client.generateImageWithRetry({
      prompt: validated.prompt,
      size: validated.size || '2k',
      sequential_image_generation: 'auto',  // 自动序列化生成（API只接受 'auto' 或 'disabled'）
      sequential_image_generation_options: {
        max_images: imagesToGenerate,
      },
      response_format: 'url',
      stream: false,
      watermark: validated.watermark ?? true,
      image: validated.image,
    });

    // 7. 返回成功响应
    return NextResponse.json<IApiResponse>({
      success: true,
      data: result,
      error: null,
    });

  } catch (error) {
    // 处理Zod验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json<IApiResponse>({
        success: false,
        data: null,
        error: error.errors[0]?.message || '输入参数验证失败',
      }, { status: 400 });
    }

    // 处理其他错误
    if (process.env.NODE_ENV === 'development') {
      console.error('图片生成错误:', error);
    }
    return NextResponse.json<IApiResponse>({
      success: false,
      data: null,
      error: getErrorMessage(error),
    }, { status: 500 });
  }
}

/**
 * GET /api/generate
 * 健康检查端点
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Cetcor AI API endpoint is ready',
  });
}

