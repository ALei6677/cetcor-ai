import { API_ENDPOINT, API_MODEL } from '@/constants/api.constants';
import type { ISeedreamRequest, ISeedreamResponse } from '@/types/seedream.types';

/**
 * Seedream API客户端类
 * 封装与Seedream 4.0 API的交互逻辑
 */
export class SeedreamClient {
  private apiKey: string;
  private endpoint: string;
  private model: string;

  /**
   * 构造函数
   * @param apiKey - API密钥
   * @param endpoint - API端点URL（可选）
   * @param model - 模型名称（可选）
   */
  constructor(apiKey: string, endpoint?: string, model?: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint || API_ENDPOINT;
    this.model = model || API_MODEL;
  }

  /**
   * 生成图片
   * @param request - 生成请求参数
   * @returns 生成的图片响应
   * @throws 当API调用失败时抛出错误
   */
  async generateImage(request: Omit<ISeedreamRequest, 'model'>): Promise<ISeedreamResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          ...request,
        }),
      });

      // 检查HTTP响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API请求失败: ${response.status} ${response.statusText}`
        );
      }

      // 解析响应数据
      const data: ISeedreamResponse = await response.json();
      
      // 验证响应数据结构
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('API返回数据格式错误');
      }

      return data;
    } catch (error) {
      // 统一错误处理
      if (error instanceof Error) {
        throw new Error(`图片生成失败: ${error.message}`);
      }
      throw new Error('图片生成失败: 未知错误');
    }
  }

  /**
   * 带重试机制的图片生成
   * @param request - 生成请求参数
   * @param maxRetries - 最大重试次数（默认3次）
   * @param retryDelay - 重试延迟毫秒数（默认1000ms）
   * @returns 生成的图片响应
   */
  async generateImageWithRetry(
    request: Omit<ISeedreamRequest, 'model'>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<ISeedreamResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateImage(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        
        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
    }

    // 所有重试都失败
    throw lastError || new Error('图片生成失败');
  }
}

/**
 * 获取错误信息的辅助函数
 * @param error - 错误对象
 * @returns 错误信息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '发生未知错误';
}

