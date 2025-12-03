import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SeedreamClient, getErrorMessage } from '@/lib/seedream-client';
import type { IApiResponse, ISeedreamResponse } from '@/types/seedream.types';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabase-admin';
import type { PostgrestError } from '@supabase/supabase-js';
import { CREDIT_COST_PER_IMAGE, FREE_PLAN_DAILY_CREDITS } from '@/constants/billing';
import { deriveImageCountFromPrompt } from '@/lib/prompt-helpers';

/**
 * 请求参数验证Schema
 */
const SizeSchema = z
  .string()
  .refine(
    (val) => {
      if (['2k', '4k'].includes(val)) {
        return true;
      }
      return /^\d{3,4}x\d{3,4}$/i.test(val);
    },
    { message: '尺寸格式无效，仅支持 1k/2k/4k 或 512-4096 范围内的自定义像素值（如 2048x1024）' }
  );

const GenerateRequestSchema = z.object({
  // 提示词上限从 1000 提升到 4000 字符，以兼容更长的英文描述
  prompt: z.string().min(1, '提示词不能为空').max(4000, '提示词不能超过4000个字符'),
  size: SizeSchema.optional(),
  watermark: z.boolean().optional(),
  // 支持普通URL和base64 data URL
  image: z
    .array(
      z
        .string()
        .refine(
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
    )
    .optional(),
  /**
   * 可选：强制指定本次生成的图片数量（用于“随机生成”场景）
   * 若提供，则后端会优先使用该值进行扣点与顺序生成
   */
  forceImageCount: z.number().int().min(1).max(8).optional(),
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
    const imagesToGenerate =
      typeof validated.forceImageCount === 'number'
        ? validated.forceImageCount
        : deriveImageCountFromPrompt(validated.prompt);
    const creditsToConsume = imagesToGenerate * CREDIT_COST_PER_IMAGE;

    // 3.1 计算今天剩余的每日赠送点数
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

    const { data: dailyRows, error: dailyError } = await supabaseAdmin
      .from('credit_transactions')
      .select('direction, credits, reason')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .in('reason', ['daily_bonus', 'daily_usage']);

    if (dailyError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('查询每日赠送点数失败:', dailyError);
      }
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: '查询点数信息失败，请稍后重试',
        },
        { status: 500 }
      );
    }

    const totalDailyBonus =
      dailyRows
        ?.filter((r) => r.direction === 'credit' && r.reason === 'daily_bonus')
        .reduce((sum, r) => sum + (r.credits as number), 0) ?? 0;
    const totalDailyUsed =
      dailyRows
        ?.filter((r) => r.direction === 'debit' && r.reason === 'daily_usage')
        .reduce((sum, r) => sum + (r.credits as number), 0) ?? 0;

    const maxDaily = FREE_PLAN_DAILY_CREDITS;
    const remainingDaily = Math.max(0, Math.min(maxDaily, totalDailyBonus - totalDailyUsed + Math.max(0, maxDaily - totalDailyBonus)));

    const useDaily = Math.min(remainingDaily, creditsToConsume);
    const stillNeedFromPlan = creditsToConsume - useDaily;

    // 3.2 如果每日赠送足够覆盖本次调用，则仅记录 daily_usage 流水而不扣订阅点数
    const creditTransactionsToInsert: {
      user_id: string;
      direction: 'credit' | 'debit';
      credits: number;
      reason: string;
      metadata?: Record<string, unknown> | null;
    }[] = [];

    if (useDaily > 0) {
      creditTransactionsToInsert.push({
        user_id: user.id,
        direction: 'debit',
        credits: useDaily,
        reason: 'daily_usage',
        metadata: {
          images: imagesToGenerate,
          creditsPerImage: CREDIT_COST_PER_IMAGE,
        },
      });
    }

    if (stillNeedFromPlan > 0) {
      // 3.3 查询用户当前有效订阅
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

      if (remainingCredits < stillNeedFromPlan) {
      return NextResponse.json<IApiResponse>(
        {
          success: false,
          data: null,
          error: '点数不足，请升级或续费套餐',
        },
        { status: 402 }
      );
    }

      // 使用乐观锁扣减订阅点数
      const newUsed = (subscription.credits_used as number) + stillNeedFromPlan;
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

      creditTransactionsToInsert.push({
        user_id: user.id,
        direction: 'debit',
        credits: stillNeedFromPlan,
        reason: 'plan_usage',
        metadata: {
          images: imagesToGenerate,
          creditsPerImage: CREDIT_COST_PER_IMAGE,
        },
      });
    }

    if (creditTransactionsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('credit_transactions')
        .insert(creditTransactionsToInsert);

      if (insertError && process.env.NODE_ENV === 'development') {
        console.error('记录点数流水失败:', insertError);
      }
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
    /**
     * 4. 调用底层 API 生成图片
     * 目前线上模型在部分配置下对 n / sequential_image_generation 的支持不稳定，
     * 为保证“请求几张就一定返回几张”，这里采用「多次调用，每次 1 张」的方式聚合结果。
     */
    const baseRequest = {
      prompt: validated.prompt,
      size: validated.size || '2k',
      n: 1,
      sequential_image_generation: 'disabled' as const,
      response_format: 'url' as const,
      stream: false,
      watermark: validated.watermark ?? true,
      image: validated.image,
    };

    // 并行触发多次生成请求，而不是串行等待，显著缩短整体等待时间
    const tasks: Promise<ISeedreamResponse>[] = Array.from({ length: imagesToGenerate }).map(() =>
      client.generateImageWithRetry(baseRequest)
    );
    const responses = await Promise.all(tasks);

    const mergedResult: ISeedreamResponse = {
      id: responses[0]?.id ?? '',
      created: responses[0]?.created ?? Date.now() / 1000,
      data: responses.flatMap((r) => r.data ?? []),
    };

    // 7. 返回成功响应
    return NextResponse.json<IApiResponse>({
      success: true,
      data: mergedResult,
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

