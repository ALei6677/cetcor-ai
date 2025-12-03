/**
 * API请求参数接口
 */
export interface ISeedreamRequest {
  /** 生成图片的提示词 */
  prompt: string;
  /** 参考图片URL数组（可选） */
  image?: string[];
  /** 生成图片数量（传给底层模型用的 n 参数） */
  n?: number;
  /** 是否启用序列化图片生成（API只接受 'auto' 或 'disabled'） */
  sequential_image_generation?: 'auto' | 'disabled';
  /** 序列化生成选项 */
  sequential_image_generation_options?: {
    /** 最大生成图片数量 */
    max_images?: number;
  };
  /** 响应格式：url或b64_json */
  response_format?: 'url' | 'b64_json';
  /** 图片尺寸（支持格式：'2k', '4k' 或像素格式 '1024x1024' 等） */
  size?: string;
  /** 是否使用流式响应 */
  stream?: boolean;
  /** 是否添加水印 */
  watermark?: boolean;
}

/**
 * API响应接口
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
export interface IApiResponse<T = unknown> {
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
  /** 是否添加水印 */
  watermark: boolean;
  /** 参考图片 */
  referenceImages: IReferenceImageInput[];
  /** 分辨率预设 */
  resolution: '2k' | '4k';
  /** 纵横比 */
  aspectRatio: string;
  /** 自定义宽度 */
  width: number;
  /** 自定义高度 */
  height: number;
  /** 生成风格 */
  style: string;
}

/**
 * 单次生成的总体信息
 */
export interface IGenerationMetadata {
  prompt: string;
  timestamp: number;
  resolutionLabel: string;
  aspectRatio: string;
  width: number;
  height: number;
  style: string;
  styleLabel: string;
  hasReferenceImage: boolean;
  referenceImageThumb?: string | null;
}

/**
 * 生成历史记录项
 */
export interface IGenerationHistoryItem {
  id: string;
  images: string[];
  metadata: IGenerationMetadata;
}

/**
 * 前端使用的参考图结构
 */
export interface IReferenceImageInput {
  /** 图片的唯一标识 */
  id: string;
  /** 图片的 data URL（base64） */
  url: string;
  /** 原始文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 图片宽度（像素，可选） */
  width?: number;
  /** 图片高度（像素，可选） */
  height?: number;
}

