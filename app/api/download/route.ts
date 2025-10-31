import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/download
 * 代理下载图片的API端点，解决CORS问题
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 获取图片URL参数
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少图片URL参数' },
        { status: 400 }
      );
    }

    // 2. 验证URL格式
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: '无效的图片URL' },
        { status: 400 }
      );
    }

    // 3. 验证URL安全性（只允许来自volces.com的图片）
    const urlObj = new URL(imageUrl);
    if (!urlObj.hostname.includes('volces.com') && !urlObj.hostname.includes('bytepluses.com')) {
      return NextResponse.json(
        { error: '不支持的图片源' },
        { status: 400 }
      );
    }

    // 4. 从远程服务器获取图片（添加超时处理）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: '无法下载图片' },
          { status: response.status }
        );
      }

      // 5. 获取图片数据
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      // 6. 返回图片数据
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="seedream-${Date.now()}.${contentType.split('/')[1] || 'jpg'}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: '下载超时，请稍后重试' },
          { status: 408 }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    // 仅在开发环境记录详细错误
    if (process.env.NODE_ENV === 'development') {
      console.error('图片下载错误:', error);
    }
    return NextResponse.json(
      { error: '下载失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}

