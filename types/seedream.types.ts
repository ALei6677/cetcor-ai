/**
 * Seedream API请求参数接口
 */
export interface ISeedreamRequest {
  /** 生成图片的提示词 */
  prompt: string;
  /** 参考图片URL数组（可选） */
  image?: string[];
  /** 是否启用序列化图片生成 */
  sequential_image_generation?: 'auto' | 'on' | 'off';
  /** 序列化生成选项 */
  sequential_image_generation_options?: {
    /** 最大生成图片数量 */
    max_images?: number;
  };
  /** 响应格式：url或b64_json */
  response_format?: 'url' | 'b64_json';
  /** 图片尺寸 */
  size?: '2K' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  /** 是否使用流式响应 */
  stream?: boolean;
  /** 是否添加水印 */
  watermark?: boolean;
}

/**
 * Seedream API响应接口
 */
export interface ISeedreamResponse {
  /** 生成的图片数据 */
  data: ISeedreamImage[];
  /** 请求ID */
  id: string;
  /** 创建时间戳 */
  created: number;
}

/**
 * 生成的图片数据接口
 */
export interface ISeedreamImage {
  /** 图片URL或base64数据 */
  url?: string;
  b64_json?: string;
  /** 修订提示词 */
  revised_prompt?: string;
}

/**
 * 标准化API响应接口
 */
export interface IApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data: T | null;
  /** 错误信息 */
  error: string | null;
}

/**
 * 历史记录项接口
 */
export interface IHistoryItem {
  /** 唯一标识符 */
  id: string;
  /** 提示词 */
  prompt: string;
  /** 生成的图片URL数组 */
  images: string[];
  /** 创建时间戳 */
  timestamp: number;
  /** 生成参数 */
  params: {
    size?: string;
    max_images?: number;
    watermark?: boolean;
  };
}

/**
 * 生成表单数据接口
 */
export interface IGenerationFormData {
  /** 提示词 */
  prompt: string;
  /** 图片尺寸 */
  size: string;
  /** 最大生成数量 */
  maxImages: number;
  /** 是否添加水印 */
  watermark: boolean;
}

