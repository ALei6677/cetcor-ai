/**
 * API端点常量
 */
export const API_ENDPOINT = process.env.SEEDREAM_API_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

/**
 * API模型名称
 */
export const API_MODEL = process.env.SEEDREAM_MODEL || 'doubao-seedream-4-0-250828';

/**
 * 图片尺寸选项
 */
export const SIZE_OPTIONS = [
  { value: '2k', label: '2K', description: '高清 2048px' },
  { value: '1k', label: '1K', description: '标清 1024px' },
  { value: '4k', label: '4K', description: '超高清 4096px' },
  { value: '1024x1024', label: '1:1', description: '方形 1024x1024' },
  { value: '1920x1080', label: '16:9', description: '横屏 1920x1080' },
  { value: '1080x1920', label: '9:16', description: '竖屏 1080x1920' },
  { value: '1600x1200', label: '4:3', description: '标准 1600x1200' },
  { value: '1200x1600', label: '3:4', description: '竖版 1200x1600' },
] as const;

/**
 * 最大生成图片数量选项
 */
export const MAX_IMAGES_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

/**
 * 默认生成参数
 */
export const DEFAULT_GENERATION_PARAMS = {
  size: '2k',
  maxImages: 3,
  watermark: true,
  sequential_image_generation: 'auto' as const,
  response_format: 'url' as const,
  stream: false,
};

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  HISTORY: 'cetcor_history',
  LANGUAGE: 'cetcor_language',
} as const;

