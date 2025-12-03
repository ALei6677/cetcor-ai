/**
 * 解析提示词中的图片数量，并根据预设上下限返回安全的生成张数
 * 支持中英文多种说法，例如：4张、4张图片、4幅图、4 photos、4 images 等
 */
const COUNT_REGEX = /(\d+)\s*(张|幅|图|图片|照片|images?|pictures?|photos?|pics?)/i;

export const MIN_GENERATION_IMAGES = 1;
export const MAX_GENERATION_IMAGES = 8;
export const DEFAULT_GENERATION_IMAGES = 1;

/**
 * 从提示词中提取用户期望生成的图片数量
 */
export function extractRequestedImageCount(prompt?: string | null): number | null {
  if (!prompt) return null;
  const match = prompt.match(COUNT_REGEX);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/**
 * 根据提示词推导最终的生成张数
 * - 若提示词包含数量描述，按描述生成
 * - 若未描述，则回退到默认值
 * - 同时保证最终值落在预设的安全区间内
 */
export function deriveImageCountFromPrompt(
  prompt?: string | null,
  fallback: number = DEFAULT_GENERATION_IMAGES
): number {
  const parsed = extractRequestedImageCount(prompt);
  const target = parsed ?? fallback;
  return Math.max(MIN_GENERATION_IMAGES, Math.min(MAX_GENERATION_IMAGES, target));
}


