import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SeedreamClient, getErrorMessage } from '@/lib/seedream-client';
import type { IApiResponse } from '@/types/seedream.types';

/**
 * 请求参数验证Schema
 */
const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, '提示词不能为空').max(1000, '提示词不能超过1000个字符'),
  size: z.enum(['1k', '2k', '4k', '1024x1024', '1920x1080', '1080x1920', '1600x1200', '1200x1600']).optional(),
  maxImages: z.number().min(1).max(6).optional(),
  watermark: z.boolean().optional(),
  image: z.array(z.string().url()).optional(),
});

/**
 * POST /api/generate
 * 生成图片的API端点
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();

    // 2. 验证输入参数
    const validated = GenerateRequestSchema.parse(body);
    
    // Debug: 仅在开发环境打印参数
    if (process.env.NODE_ENV === 'development') {
      console.log('收到的请求参数:', JSON.stringify(body, null, 2));
      console.log('验证后的size参数:', validated.size);
    }

    // 3. 检查API密钥
    const apiKey = process.env.SEEDREAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json<IApiResponse>({
        success: false,
        data: null,
        error: 'API密钥未配置',
      }, { status: 500 });
    }

    // 4. 创建API客户端
    const client = new SeedreamClient(apiKey);

    // 5. 调用API生成图片
    const result = await client.generateImageWithRetry({
      prompt: validated.prompt,
      size: validated.size || '2k',
      sequential_image_generation: 'auto',  // 自动序列化生成（API只接受 'auto' 或 'disabled'）
      sequential_image_generation_options: {
        max_images: validated.maxImages || 3,
      },
      response_format: 'url',
      stream: false,
      watermark: validated.watermark ?? true,
      image: validated.image,
    });

    // 6. 返回成功响应
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
    message: 'Cetcor.AI API endpoint is ready',
  });
}

