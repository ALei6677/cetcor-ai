'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Droplets, Link2 } from 'lucide-react';
import type {
  IGenerationFormData,
  IGenerationMetadata,
  IReferenceImageInput,
  ISeedreamResponse,
} from '@/types/seedream.types';
import { getStoredAuthToken, useAuthToken } from '@/components/providers/auth-provider';
import { ReferenceImageUpload } from '@/components/reference-image-upload';
import { CreativePlayground, type ICreativePlay } from '@/components/creative-playground';
import { useLanguageStore, useTranslation } from '@/stores/language-store';
import { deriveImageCountFromPrompt } from '@/lib/prompt-helpers';
import { emitCreditsRefresh } from '@/lib/credits-events';

type ResolutionPreset = '2k' | '4k';

const RESOLUTION_OPTIONS: Array<{ id: ResolutionPreset; label: string; value: number }> = [
  { id: '2k', label: '2K', value: 2048 },
  { id: '4k', label: '4K', value: 3840 },
];

/**
 * 随机生成用的提示词池（来自用户提供的 35 组英文/中文混合文案）
 * 点击“随机生成”时会随机抽取其中一条填入提示词输入框
 */
const RANDOM_PROMPTS: string[] = [
  // 1
  'Create a watercolor-wash Christmas greeting card: soft light-blue gradient background flecked with white snowflakes; center a cartoon polar bear sporting a red Santa hat and scarf, surrounded by adorable penguins also wearing tiny holiday hats and scarves. Behind them place a snow-laden Christmas tree hung with red-and-gold ornaments and twinkling lights, topped with a gold star. Letter “Merry Christmas” in white handwritten script across the top. Keep the palette gentle and fresh, emphasizing childlike charm and healing warmth, with rich, visible watercolor textures for a cozy fairy-tale Christmas scene.',
  // 2
  'Create a soft, kawaii watercolor birthday card with a warm orange watercolor background. Transform the user\'s personal or pet photo into a cute watercolor character (retain key features, use rounded lines, soft colors, and add kawaii details like blush). Feature a giant pink birthday cake decorated with candles and a large bow, surrounded by adorable pets (such as puppies and teddy bears), colorful ribbons, and sparkling stars. Write “Happy Birthday” at the top in fresh handwritten script. Use a pink and orange color palette with obvious watercolor blending to create a warm, healing, girly birthday atmosphere that naturally integrates the user\'s image with cute watercolor elements for a cohesive and playful style.',
  // 3
  'Generate a photorealistic 3D rendering sizing diagram for women\'s high-waisted yoga leggings with a gradient blue background featuring subtle light reflections. The title "Find Your Perfect Fit" should appear in modern geometric font with a slight glow effect at the top. Left side should display a detailed 3D model of a Latina female athlete (size M, height 168cm) wearing the leggings, with key measurement points highlighted by glowing blue lines: waist, hip, inseam, outseam, and rise. Right side should feature a sleek digital sizing chart with detailed size, waist, hip, inseam, outseam, rise, compression and fabric information. Below the chart, include explanatory text about true-to-size design and second-skin feel. Overall aesthetic: high-quality 3D rendering, realistic fabric texture, subtle light reflections, and modern digital interface elements.',
  // 4
  'Generate professional sushi-making guide for Salmon Roll: precise ingredient list, 10-step professional process with 3:4 vertical ratio images for key steps (e.g., "Step 5: Close-up of bamboo mat rolling technique showing pressure control"), temperature chart (optimal 40°C rice temperature), food safety points (raw fish handling protocols) and a 3:4 ratio professional plating photo. Require strict image-text synchronization with step images highlighting both hand technique and ingredient state, meeting professional Japanese culinary standards.',
  // 5
  'female model facing the camera, shot on Sony A7 III, photorealistic, close-up, flawless, ultra-detailed, hyperrealism --no freckles',
  // 6
  'an anime image of a girl who is wearing ripped jeans and a tank top, in the style of heavy impasto brushwork, vibrant comics, dark navy and light amber, edgy, cartelcore, d&d, close up',
  // 7
  'a woman with long hair in wind, in the style of pop inspo, hyper-realistic water, animated gifs, mario testino, close up, soft and dreamy, sky-blue and brown',
  // 8
  'Winter polar adventure, women\'s professional assault jackets and cold-proof pants, bright blue and black tones, professional outdoor style, assault jackets with wind-proof zippers and thermal linings, snowfield sunshine and clothing form a strong contrast, clothing design renderings',
  // 9
  'Summer mountain riding, women\'s breathable cycling clothes and quick-drying shorts, bright orange and dark blue colors, professional outdoor style, cycling clothing splicing and reflective strip details, clothing shining in the scorching sun, clothing design renderings',
  // 10
  'Summer open-air music festival, women\'s printed skirt with tassel vest, bright and colorful colors, bohemian style, delicate skirt printing, stage lighting and sunset intertwined, costume design renderings',
  // 11
  'scifi artwork by roblunda mccallum, in the style of blink-and-you-miss-it detail, full body, dark white and light orange, sci-fi realism, pulp comics, airbrush art, comic art',
  // 12
  'a piece of artwork that contains multiple birds, a woman and a lady, in the style of bertil nilsson, dark brown and azure, patricia piccinini, album covers, kerem beyit, powerful and emotive portraiture, 8k resolution',
  // 13
  'woman wearing a cyberpunk style shiny black helmet with robotic features, the reflection on her face is made of glowing golden wires with intricate details, hyper realistic photography in the style of editorial pose, photorealistic, 8k, high render',
  // 14
  'a realistic photo of a very pretty 26 year old woman, with long, wavy, dark hair, looks like Dakota Johnson and Felicity Jones, wearing thick nerd glasses, light makeup, looking innocent, cute, flushed, light skin',
  // 15
  'Anti-vibration sledgehammer, double-face head with shock-damping polymer layer, powder-coated dark gray; fiberglass handle with bright safety accents, enlarged lanyard hole; industrial setting, concrete floor, metal sparks bokeh, cinematic 35mm',
  // 16
  'a ring from a fantasy story, made in gold, adorned with a black stone and sun-shaped runes, background of a fantasy world',
  // 17
  'Please generate a cat selfie that feels totally random—no clear subject or composition, just a quick, careless snap with an intentional “plain and meh” vibe. The one holding the camera is the cat itself, wearing sunglasses, scarf and fuzzy earmuffs, looking happy, in broad daylight, with snowy ground and rolling white-capped mountains behind.',
  // 18
  'Create a close-up selfie of the same cat in a professional office environment. The cat is holding a coffee in one paw while taking a selfie with the other, wearing an ID badge around its neck that features a close-up photo of its own face. It has a distinct "I don\'t want to work today" expression. The background shows a detailed office setting, enhancing the realistic and relatable vibe. Rendered in original aspect ratio.',
  // 19
  'The subject dog takes selfies while travelling in Paris. It is wearing warm winter coat, sunglasses, standing against a background of the Eiffel Tower.',
  // 20
  'A photorealistic fashion magazine cover photography of a beautiful woman, wearing asymmetric metal fringe earrings and a diamond-studded black gown with exquisite makeup, gazing steadily and determinedly into the lens, set in a professional studio with pure black background, featuring the cover-standard "ECHOES OF ELEGANCE" masthead and maintaining the original magazine\'s typography layout hierarchy. Dramatic side-top directional lighting, luxurious, avant-garde and visually tense atmosphere. Strictly maintain the basic appearance, hairstyle and facial features of the subject, do not alter original dimensions, full-frame without black borders.',
  // 21
  'A woman in her mid-twenties with voluminous deep brown curls leans against a vintage blue pickup truck, her confident gaze meeting the camera with subtle defiance. Dressed in a black crop top beneath a brown leather jacket, she pairs this with khaki cargo pants and rugged boots while holding a steaming cocoa. Autumn maple trees in fiery shades, warm afternoon light, photorealistic scene without borders, text or watermarks.',
  // 22
  'Generate a 3D cyber mecha Q-version girl bust: pink-purple gradient long hair, silver-purple spliced mecha helmet with built-in headphones, silver-purple metal mecha armor, black mechanical neck joint, Q-version anime makeup with large purple pupils and cold expression. Deep space dark background with tiny starlight. Style: mecha trendy toy modeling + Gundam mecha texture + anime Q-version. Dominant silver and purple palette with cold blue highlights and black mechanical dark areas, close-up composition focusing on face and shoulder armor with rich metallic reflections and mechanical details.',
  // 23
  'Master typography, maximalism, halftone patterns, grain, screen print texture. Overlapping edge gradients, isochromatic color schemes, point-line-plane distribution. Steampunk poster scene with bright orange background. Giant ginger cat wearing sci-fi headphones. Multilingual text elements, oversized stylized letters, high-contrast colors with cyberpunk visual symbols. Dynamic 3D effect emphasizing sci-fi fusion impact.',
  // 24
  'Generate a girl\'s bust in Disney Pixar style: long black wavy hair with air bangs, black round-framed glasses, white short-sleeved collared dress with waist design and puff sleeves, gold buttons on the front placket. Gentle, slightly well-behaved expression, minimalist low-saturation gray-blue background. Disney Pixar 3D animation style with rounded lines, delicate skin texture and fluffy hair. Eye-level close-up from face to waist, with detailed fabric folds, curly hair texture, small gold earrings and metallic reflection on the buttons.',
  // 25
  'A long exposure photo of a beautiful woman feeding pigeons in a square. The person is the main subject and remains sharp and clear, while the pigeons show motion blur trails around them.',
  // 26
  'A photorealistic neon portrait of a beautiful woman, with distinctive purple-tipped short hair and a clean white shirt, serene expression, set in an environment filled with vintage signs and the neon signage of an Alaska casino. Intense, colorful neon lights create an avant-garde and artistic atmosphere. 50mm f/8.0 standard lens, centered close-up composition. Strictly maintain the basic appearance and distinctive hairstyle, full-frame without black borders.',
  // 27
  'Generate a French pastoral flower fairy-style portrait: keep the person\'s facial features unchanged, wearing a light-colored lace strapless dress, a floral crown made of various flowers, and holding a pink peony near the face. Outdoor rainy flower meadow with peonies and lilies of the valley in full bloom, moist hair and skin texture. Film texture + natural floral elements, fresh and soft colors of pink, green and light beige. Half-body composition with eyes closed interacting with the peony, exquisite lace and floral crown details.',
  // 28
  'Generate a single image with Halloween scenic background, composed in a 3x3 nine-grid layout, featuring a kitten in nine Autumn Halloween-themed outfits, each cell 1:1 authentic photography. Rich costume details including witch hat, pumpkin bodysuit, ghost cape, wizard coat, pumpkin collar, Jack-O\'-lantern interactions and cute facial expressions.',
  // 29
  'Transform a European male into a Fortune 500 CEO portrait with impeccable business attire, confident posture, and a modern office environment backdrop. Include subtle power accessories like a luxury watch, leather portfolio, and city skyline view through floor-to-ceiling windows. Lighting should convey authority and success.',
  // 30
  'create an ultra-real photography of the referenced monkey wearing Sony over-ear headphones, holding a vintage cassette player (Walkman-style) in its hands. Seaside scene with clear blue sea, rocky shore, bright blue sky. Close-up shot focusing on fur detail and electronic devices, monkey looking upward. Warm sunlight hues on the monkey combined with fresh blue sea and sky, hyperrealistic style. Text elements: “Listen to Your Dream” in large yellow font at the top left, “New Release in 2025” in small white font below.',
  // 31
  'Generate an image of a cat taking a selfie at Japan’s busiest pedestrian crossing, with the crowd behind blurred and distant. No phone or human hand should appear in the frame. The cat’s paws are positioned at the bottom of the image as if holding a phone that isn’t shown.',
  // 32
  'A realistic photographic portrait of a celebrity cat wearing an exquisite dress and fine jewelry, seated on a stage. The scene is illuminated by the dazzling light of camera flashes, creating a glamorous atmosphere.',
  // 33
  'A mobile phone photography style image of a person sitting at an Italian seaside restaurant. Lemon trees and a setting sun are visible in the background, with natural light blending softly throughout the scene. The hair appears radiant, illuminated by the sunset glow.',
  // 34
  'A photorealistic dramatic cinematic close-up of a European male, with disheveled, wet, natural-colored hair strands clinging to the face, eyes hazy with a mix of dangerous desire, one hand partially covering the mouth with fingers gently curved against the lips, dark melancholic background. Single intense blue-white hard light from above, alienated and tense atmosphere, 90mm f/2.8 macro extreme close-up, strong wet hair and water droplet texture, cinematic blue grain and overexposed edges. Preserve original appearance and dimensions, full-frame without black borders.',
  // 35
  'Generate "The Godfather" style portrait with original facial features preserved (only adjust expression): black suit with waistcoat and tie, hands folded or holding cigar or sitting pose, dark-toned high-contrast lighting, vintage dark background with leather sofa or black curtain. Strictly preserve original facial details, only adjust expression to a deep and authoritative mafia boss demeanor, realistic mafia texture, full of power and retro movie tension.',
];

const ASPECT_RATIO_OPTIONS: Array<{ id: string; label: string; ratio: [number, number] }> = [
  { id: '1:1', label: '1:1', ratio: [1, 1] },
  { id: '3:4', label: '3:4', ratio: [3, 4] },
  { id: '4:3', label: '4:3', ratio: [4, 3] },
  { id: '16:9', label: '16:9', ratio: [16, 9] },
  { id: '9:16', label: '9:16', ratio: [9, 16] },
  { id: '2:3', label: '2:3', ratio: [2, 3] },
  { id: '3:2', label: '3:2', ratio: [3, 2] },
  { id: '21:9', label: '21:9', ratio: [21, 9] },
];

/**
 * 以「2K」为基准的各图片比例尺寸
 * 这些数值来自对标站点，用来保证在不同分辨率预设下的宽高与对方算法一致
 */
const BASE_2K_ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 2048, height: 2048 },
  '3:4': { width: 1728, height: 2304 },
  '4:3': { width: 2304, height: 1728 },
  '16:9': { width: 2560, height: 1440 },
  '9:16': { width: 1440, height: 2560 },
  '2:3': { width: 1664, height: 2496 },
  '3:2': { width: 2496, height: 1664 },
  '21:9': { width: 3024, height: 1296 },
};

/**
 * 不同分辨率预设相对于 2K 的缩放系数
 * 例如：2K 16:9 为 2560×1440，则 1K 16:9 为 2560×0.75 ≈ 1920×1080
 */
const RESOLUTION_SCALE_FROM_2K: Record<ResolutionPreset, number> = {
  '2k': 1,
  '4k': 1.5,
};

const STYLE_OPTIONS: Array<{ id: string; label: string; prompt?: string }> = [
  // label 字段仅作兜底，真实展示文案从多语言配置中读取，保证中英文切换
  { id: 'none', label: 'None' },
  { id: 'digital_art', label: 'Digital art', prompt: '以数字艺术风格呈现，色彩鲜明' },
  { id: 'rainbow', label: 'Neon punk', prompt: '霓虹朋克风格，强烈对比与光影' },
  { id: 'line_art', label: 'Line art', prompt: '线条艺术风格，强调轮廓与结构' },
  { id: 'pixel', label: 'Pixel art', prompt: '像素艺术风格，颗粒感强' },
  { id: 'photo', label: 'Photographic', prompt: '呈现真实摄影质感与光影' },
  { id: 'film', label: 'Cinematic', prompt: '具有电影胶片质感与戏剧光影' },
  { id: 'paper', label: 'Film grain', prompt: '胶片颗粒与复古色调' },
  { id: 'fold', label: 'Origami', prompt: '折纸与纸艺质感' },
  { id: '3d', label: '3D model', prompt: '3D 渲染风格，具有体积光' },
  { id: 'anime', label: 'Anime', prompt: '动漫风格，线条流畅' },
  { id: 'fantasy', label: 'Fantasy art', prompt: '奇幻艺术风格，史诗感画面' },
  { id: 'low_poly', label: 'Low poly', prompt: '低多边形建模视觉' },
  { id: 'enhance', label: 'Enhance', prompt: '整体细节强化，锐化画面' },
  { id: 'comic', label: 'Comic book', prompt: '漫画风格，粗线条与网点' },
  { id: 'clay', label: 'Clay craft', prompt: '粘土手作质感' },
  { id: 'isometric', label: 'Isometric', prompt: '等距视角，结构清晰' },
];

const CONTROL_BUTTON_CLASS =
  'flex h-14 min-w-[160px] flex-1 flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-sm font-medium text-slate-900 shadow-sm transition hover:border-primary/40 focus-visible:outline focus-visible:outline-primary/30';

const RESOLUTION_MAP = RESOLUTION_OPTIONS.reduce<Record<ResolutionPreset, number>>(
  (acc, option) => {
    acc[option.id] = option.value;
    return acc;
  },
  { '2k': 2048, '4k': 3840 }
);

const ASPECT_RATIO_MAP = ASPECT_RATIO_OPTIONS.reduce<Record<string, [number, number]>>(
  (acc, option) => {
    acc[option.id] = option.ratio;
    return acc;
  },
  {}
);

function calculateDimensions(resolution: ResolutionPreset, aspectRatio: string) {
  /**
   * 优先使用与对标站点一致的「2K 基准尺寸 + 不同分辨率缩放系数」算法
   * 这样可以保证 720P / 1K / 2K / 4K 下各比例的宽高与目标站点尽量保持一致
   */
  const base = BASE_2K_ASPECT_DIMENSIONS[aspectRatio];
  const scale = RESOLUTION_SCALE_FROM_2K[resolution];

  if (base && scale) {
    const width = Math.round(base.width * scale);
    const height = Math.round(base.height * scale);
    return { width, height };
  }

  // 兜底策略：如果未来新增了未在表中的比例，则退回到原有的按比例推算逻辑
  const baseSize = RESOLUTION_MAP[resolution] ?? 2048;
  const ratio = ASPECT_RATIO_MAP[aspectRatio] || [1, 1];
  const [wRatio, hRatio] = ratio;
  if (wRatio >= hRatio) {
    const height = Math.round((baseSize * hRatio) / wRatio);
    return { width: baseSize, height };
  }
  const width = Math.round((baseSize * wRatio) / hRatio);
  return { width, height: baseSize };
}

/** 根据图片宽高计算最接近的预设比例ID */
function findClosestAspectRatioId(width?: number, height?: number): string | null {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const targetRatio = width / height;
  let closestId: string | null = null;
  let smallestDiff = Number.POSITIVE_INFINITY;

  for (const option of ASPECT_RATIO_OPTIONS) {
    const ratioValue = option.ratio[0] / option.ratio[1];
    const diff = Math.abs(ratioValue - targetRatio);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestId = option.id;
    }
  }

  return closestId;
}

interface GenerationFormProps {
  onGenerateSuccess: (result: ISeedreamResponse, metadata: IGenerationMetadata) => void;
  onGenerateError: (error: string) => void;
  initialPrompt?: string;
  /** 当用户点击生成按钮时回调，用于在外层展示“正在生成”占位 */
  onGenerateStart?: (expectedImages: number) => void;
  /** 当用户从生成记录中点击“重新编辑”时，传入本次生成的元数据用于回填表单 */
  editMetadata?: IGenerationMetadata | null;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  onGenerateSuccess,
  onGenerateError,
  initialPrompt = '',
  onGenerateStart,
  editMetadata,
}) => {
  const { token } = useAuthToken();
  const t = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const defaultResolution: ResolutionPreset = '2k';
  const defaultAspect = '1:1';
  const { width: defaultWidth, height: defaultHeight } =
    calculateDimensions(defaultResolution, defaultAspect);
  const [formData, setFormData] = useState<IGenerationFormData>({
    prompt: initialPrompt,
    size: `${defaultWidth}x${defaultHeight}`,
    // 默认不开启水印，用户如需添加可手动勾选
    watermark: false,
    referenceImages: [],
    resolution: defaultResolution,
    aspectRatio: defaultAspect,
    width: defaultWidth,
    height: defaultHeight,
    style: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [resolutionMenuOpen, setResolutionMenuOpen] = useState(false);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const resolutionMenuRef = useRef<HTMLDivElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  // 控制宽高是否联动：联动时修改一侧，另一侧按当前比例自动调整
  const [dimensionsLinked, setDimensionsLinked] = useState(true);

  /**
   * 当外层通过“灵感创意”等方式更新 initialPrompt 时，
   * 将新的提示词同步到表单中（不影响已经通过 editMetadata 回填的场景）
   */
  useEffect(() => {
    if (!initialPrompt) return;
    // 避免在“重新编辑”场景下覆盖用户从历史记录带回来的提示词
    if (editMetadata) return;
    if (initialPrompt === formData.prompt) return;

    setFormData((prev) => ({
      ...prev,
      prompt: initialPrompt,
    }));
  }, [initialPrompt, editMetadata, formData.prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (resolutionMenuRef.current && !resolutionMenuRef.current.contains(target)) {
        setResolutionMenuOpen(false);
      }
      if (styleMenuRef.current && !styleMenuRef.current.contains(target)) {
        setStyleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 当外层传入 editMetadata 时，回填提示词、尺寸、比例、风格以及参考图
  useEffect(() => {
    if (!editMetadata) return;

    // 根据分辨率标签反推预设 ID，找不到时保留当前设置
    const matchedResolution =
      RESOLUTION_OPTIONS.find((option) => option.label === editMetadata.resolutionLabel)?.id ||
      formData.resolution;

    const baseState: IGenerationFormData = {
      ...formData,
      prompt: editMetadata.prompt,
      resolution: matchedResolution as ResolutionPreset,
      aspectRatio: editMetadata.aspectRatio,
      width: editMetadata.width,
      height: editMetadata.height,
      size: `${editMetadata.width}x${editMetadata.height}`,
      style: editMetadata.style,
    };

    let nextState = baseState;

    if (editMetadata.referenceImageThumb) {
      const imageInput: IReferenceImageInput = {
        id: `re-edit-${Date.now()}`,
        url: editMetadata.referenceImageThumb,
        name: 'reference-from-history',
        size: 0,
        width: editMetadata.width,
        height: editMetadata.height,
      };
      nextState = applyReferenceImages(baseState, [imageInput]);
    } else {
      nextState = applyReferenceImages(baseState, []);
    }

    setFormData(nextState);
  }, [editMetadata, applyReferenceImages, formData]);

  type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  const applyReferenceImages = React.useCallback(
    (prev: IGenerationFormData, images: IReferenceImageInput[]): IGenerationFormData => {
      let nextState: IGenerationFormData = {
      ...prev,
      referenceImages: images,
      };

      if (images.length > 0) {
        const latestImage = [...images].reverse().find((img) => img.width && img.height);
        const closestAspect = findClosestAspectRatioId(latestImage?.width, latestImage?.height);
        if (closestAspect) {
          const { width, height } = calculateDimensions(prev.resolution, closestAspect);
          nextState = {
            ...nextState,
            aspectRatio: closestAspect,
            width,
            height,
            size: `${width}x${height}`,
          };
        }
      } else {
        nextState = {
          ...nextState,
          resolution: defaultResolution,
          aspectRatio: defaultAspect,
          width: defaultWidth,
          height: defaultHeight,
          size: `${defaultWidth}x${defaultHeight}`,
        };
      }

      return nextState;
    },
    [defaultAspect, defaultHeight, defaultResolution, defaultWidth]
  );

  const handleReferenceImagesChange = (images: IReferenceImageInput[]) => {
    setFormData((prev) => applyReferenceImages(prev, images));
  };

  const handleResolutionSelect = (resolution: ResolutionPreset) => {
    setFormData((prev) => {
      const { width, height } = calculateDimensions(resolution, prev.aspectRatio);
      return {
      ...prev,
      resolution,
      width,
      height,
      size: `${width}x${height}`,
      };
    });
    setResolutionMenuOpen(false);
  };

  const handleAspectRatioSelect = (ratioId: string) => {
    const { width, height } = calculateDimensions(formData.resolution, ratioId);
    setFormData((prev) => ({
      ...prev,
      aspectRatio: ratioId,
      width,
      height,
      size: `${width}x${height}`,
    }));
  };

  const handleDimensionChange =
    (dimension: 'width' | 'height') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const numeric = Number(e.target.value);
      const value = Number.isFinite(numeric) ? Math.round(numeric) : 0;

      setFormData((prev) => {
        let width = prev.width;
        let height = prev.height;

        // 当前宽高比，用于联动时保持比例
        const hasValidRatio = prev.width > 0 && prev.height > 0;

        if (dimension === 'width') {
          width = value;
          if (dimensionsLinked && hasValidRatio) {
            const ratio = prev.height / prev.width;
            height = Math.round(width * ratio);
          }
        } else {
          height = value;
          if (dimensionsLinked && hasValidRatio) {
            const ratio = prev.width / prev.height;
            width = Math.round(height * ratio);
          }
        }

        return {
          ...prev,
          width,
          height,
          aspectRatio: 'custom',
          size: `${width}x${height}`,
        };
      });
    };

  /** 切换宽高联动状态 */
  const toggleDimensionsLinked = () => {
    setDimensionsLinked((prev) => !prev);
    };

  const handleChange =
    (field: keyof IGenerationFormData) =>
    (e: React.ChangeEvent<FormElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]:
        field === 'watermark'
            ? (e as React.ChangeEvent<HTMLInputElement>).target.checked
            : e.target.value,
      }));
    };

  const toggleResolutionMenu = () => {
    setResolutionMenuOpen((prev) => !prev);
  };

  const toggleStyleMenu = () => {
    setStyleMenuOpen((prev) => !prev);
    setResolutionMenuOpen(false);
  };

  const handleStyleSelect = (styleId: string) => {
    setFormData((prev) => ({ ...prev, style: styleId }));
    setStyleMenuOpen(false);
  };

  const toggleWatermark = () => {
    setFormData((prev) => ({
      ...prev,
      watermark: !prev.watermark,
      }));
    };

  /**
   * 统一的生成执行函数
   * @param overridePrompt 可选：用于覆盖当前表单中的提示词（随机生成时使用）
   * @param forceImageCount 可选：强制指定本次“期望生成张数”，用于占位展示与扣点保持一致
   */
  const runGeneration = async (overridePrompt?: string, forceImageCount?: number) => {
    const promptToUse = (overridePrompt ?? formData.prompt).trim();
    if (!promptToUse) {
      onGenerateError('提示词不能为空');
      return;
    }

    // 若传入了强制张数，则优先使用；否则根据提示词解析图片数量（1-8 张）
    const finalImageCount =
      typeof forceImageCount === 'number'
        ? forceImageCount
        : deriveImageCountFromPrompt(promptToUse);

    // 当用户提示词中写了“生成多张图片”时，我们仍然按张数多次调用接口，
    // 所以需要在实际发送给模型的提示词中强调「每次只生成一张图，不要拼成九宫格或多图拼接」
    let modelPrompt = promptToUse;
    if (finalImageCount > 1) {
      modelPrompt =
        `${promptToUse}\n` +
        'Please generate exactly one independent photo per image (no collage, no grid, no multiple poses in a single canvas).';
    }
    onGenerateStart?.(finalImageCount);

    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const resolvedToken = token ?? getStoredAuthToken();
      if (!resolvedToken) {
        onGenerateError('请先登录后再生成图片。');
        return;
      }

      headers.Authorization = `Bearer ${resolvedToken}`;

      const stylePrompt = STYLE_OPTIONS.find((option) => option.id === formData.style)?.prompt;
      const composedPrompt = stylePrompt ? `${modelPrompt}\n风格：${stylePrompt}` : modelPrompt;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: composedPrompt,
          size: formData.size || `${formData.width}x${formData.height}`,
          watermark: formData.watermark,
          image: formData.referenceImages.map((img) => img.url),
          // 后端会优先使用该字段确定生成张数，从而保证扣点与前端展示一致
          forceImageCount: finalImageCount,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        onGenerateError(data.error || '生成失败，请稍后重试');
        return;
      }

      onGenerateSuccess(data.data as ISeedreamResponse, {
        prompt: promptToUse,
        timestamp: Date.now(),
        resolutionLabel:
          RESOLUTION_OPTIONS.find((option) => option.id === formData.resolution)?.label ??
          formData.resolution.toUpperCase(),
        aspectRatio: formData.aspectRatio,
        width: formData.width,
        height: formData.height,
        style: formData.style,
        styleLabel:
          STYLE_OPTIONS.find((option) => option.id === formData.style)?.label ?? '默认',
        hasReferenceImage: formData.referenceImages.length > 0,
        referenceImageThumb: formData.referenceImages[0]?.url ?? null,
      });
    } catch (error) {
      console.error('generate error:', error);
      onGenerateError('生成失败，请稍后重试');
    } finally {
      setLoading(false);
      emitCreditsRefresh();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runGeneration();
  };

  const handleRandomGenerate = () => {
    if (loading || RANDOM_PROMPTS.length === 0) {
      return;
    }
    const randomPrompt =
      RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setFormData((prev) => ({
      ...prev,
      prompt: randomPrompt,
    }));
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getDimensionsFromDataUrl = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  /**
   * 处理"做同款"功能
   */
  const handleApplyPlay = async (play: ICreativePlay) => {
    try {
      /**
       * 根据灵感玩法配置构造要加载的参考图 URL 列表
       * - 默认情况下：只使用卡片自身的原图
       * - 特殊需求：第二组玩法使用「卡片二上传图1」「卡片二上传图2」两张图作为参考图
       */
      const baseImageUrls: string[] =
        play.id === '2'
          ? [
              '/Inspiration gameplay card/卡片二上传图1.jpg',
              '/Inspiration gameplay card/卡片二上传图2.jpg',
            ]
          : [play.originalImage];

      const referenceInputs: IReferenceImageInput[] = [];

      for (const url of baseImageUrls) {
        // 依次拉取每一张原图并转成 dataURL，存入参考图列表
        // 这样在前端完全由本地静态资源驱动，无需用户手动上传
        const response = await fetch(url);
      const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);

        let width: number | undefined;
        let height: number | undefined;
        try {
          const dims = await getDimensionsFromDataUrl(dataUrl);
          width = dims.width;
          height = dims.height;
        } catch (error) {
          console.warn('Failed to read image dimensions', error);
        }

        referenceInputs.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: dataUrl,
          name: `creative-play-${play.id}.jpg`,
          size: blob.size,
          width,
          height,
        });
      }

      // 更新表单数据：将参考图列表整体写入，并同步应用提示词
      // 需求：每次点击“做同款”都重置上一次的提示词与参考图，因此不再保留之前的 referenceImages
      setFormData((prev) => {
        const updatedReferences = referenceInputs;
        // 先基于当前表单状态与新的参考图重新计算尺寸 / 比例
        const stateWithReferences = applyReferenceImages(
          {
          ...prev,
            // 强制覆盖旧的参考图，而不是追加
            referenceImages: updatedReferences,
          },
          updatedReferences
        );
        return {
          ...stateWithReferences,
          prompt: play.prompt,
        };
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      // 即使图片加载失败，也应用提示词
      setFormData((prev) => ({
        ...prev,
        prompt: play.prompt,
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-4">
      <form onSubmit={handleSubmit} className="relative z-10 flex w-full flex-col gap-8 lg:flex-[3]">
        <div className="w-full">
          {/* 进一步简化圆角与阴影，优先保证滚动流畅度 */}
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl border border-slate-100 bg-white px-8 pb-4 pt-4 shadow-sm">
            <div className="space-y-3">
              {/* 标题使用多语言文案 */}
              <p className="px-1 text-2xl font-semibold text-slate-900">
                {t.form.modeDescription || t.form.promptLabel}
              </p>
              {/* 提示词与上传区域的组合卡片：上传在上方一行，textarea 在下方滚动，避免内容与上传模块重叠 */}
              <div className="rounded-[32px] border border-slate-100 bg-slate-50/80">
                {/* 顶部上传区域：控制与文本输入框的间距，保持紧凑但不拥挤 */}
                <div className="px-8 pt-3 pb-1">
                <ReferenceImageUpload
                  images={formData.referenceImages}
                  onChange={handleReferenceImagesChange}
                  maxImages={5}
                  hideLabel
                  hideHint
                  compact
                  variant="embedded"
                    className="w-auto"
                />
                </div>

                {/* 底部提示词输入区域：减小高度，多余文本通过滚动查看 */}
                <textarea
                  className="min-h-[130px] max-h-[220px] w-full resize-none border-none bg-transparent px-8 pb-8 pt-1 text-base leading-relaxed text-slate-900 focus:outline-none focus:ring-0 overflow-y-auto"
                  value={formData.prompt}
                  onChange={handleChange('prompt')}
                  placeholder={t.form.promptPlaceholder}
                />
              </div>
            </div>
            {/* 生成选项与操作按钮，与提示词共享同一白色卡片，保持操作上下文连贯 */}
            <div className="-mt-3 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative w-full" ref={resolutionMenuRef}>
                <button
                  type="button"
                  onClick={toggleResolutionMenu}
                  className={`${CONTROL_BUTTON_CLASS} w-full`}
                  aria-label="选择图片尺寸"
                >
                  <span className="text-sm text-slate-500">{t.form.sizeLabel}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {RESOLUTION_OPTIONS.find((option) => option.id === formData.resolution)?.label ||
                      formData.resolution.toUpperCase()}{' '}
                    {formData.width}×{formData.height}px
                  </span>
                </button>

                {resolutionMenuOpen && (
                  <div className="absolute left-0 top-auto bottom-[calc(100%+12px)] z-40 w-[320px] rounded-2xl border border-slate-100 bg-white p-4 text-slate-900 shadow-[0_-20px_45px_rgba(15,23,42,0.12)] sm:w-[420px]">
                    {/* 提升尺寸菜单层级，避免被灵感玩法覆盖 */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{t.form.resolutionLabel}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {RESOLUTION_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleResolutionSelect(option.id)}
                              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                                formData.resolution === option.id
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-transparent bg-slate-100 text-slate-600 hover:border-primary/30 hover:text-primary'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{t.form.aspectRatioLabel}</p>
                        <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
                          {ASPECT_RATIO_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleAspectRatioSelect(option.id)}
                              className={`flex h-10 w-full items-center justify-center rounded-xl border text-sm font-medium transition ${
                                formData.aspectRatio === option.id
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{t.form.dimensionLabel}</p>
                        <div className="flex items-center gap-3">
                          {/* 宽度输入：占据左侧半行 */}
                          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
                            <span className="text-xs text-slate-500">W</span>
                            <input
                              type="text"
                              min={512}
                              max={4096}
                              value={formData.width}
                              onChange={handleDimensionChange('width')}
                              aria-label="图片宽度"
                              className="w-full border-none bg-transparent text-right text-sm text-slate-900 focus:outline-none"
                            />
                          </div>

                          {/* 宽高联动按钮：替代原来的“×”符号 */}
                          <button
                            type="button"
                            onClick={toggleDimensionsLinked}
                            aria-label={dimensionsLinked ? '解锁宽高比例' : '锁定宽高比例'}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-slate-600 transition ${
                              dimensionsLinked
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-slate-200 bg-slate-50 hover:border-primary/40 hover:text-primary'
                            }`}
                          >
                            <Link2 className="h-4 w-4" />
                          </button>

                          {/* 高度输入：占据右侧半行 */}
                          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
                            <span className="text-xs text-slate-500">H</span>
                            <input
                              type="text"
                              min={512}
                              max={4096}
                              value={formData.height}
                              onChange={handleDimensionChange('height')}
                              aria-label="图片高度"
                              className="w-full border-none bg-transparent text-right text-sm text-slate-900 focus:outline-none"
                            />
                          </div>

                          <span className="text-xs text-slate-400 whitespace-nowrap">px</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative w-full" ref={styleMenuRef}>
                <button
                  type="button"
                  onClick={toggleStyleMenu}
                  className={`${CONTROL_BUTTON_CLASS} w-full`}
                  aria-label="选择图片风格"
                >
                  <span className="text-sm text-slate-500">{t.form.styleLabel}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {t.form.styles?.[formData.style] ||
                      STYLE_OPTIONS.find((option) => option.id === formData.style)?.label ||
                      t.form.styleNone}
                  </span>
                </button>

                {styleMenuOpen && (
                  <div className="absolute left-0 top-auto bottom-[calc(100%+12px)] z-40 w-[260px] rounded-2xl border border-slate-100 bg-white p-4 text-slate-900 shadow-[0_-20px_45px_rgba(15,23,42,0.12)] sm:w-[320px]">
                    {/* 提升风格菜单层级，确保交互可见 */}
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      {STYLE_OPTIONS.map((style) => {
                        const label = t.form.styles?.[style.id] ?? style.label;
                        return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => handleStyleSelect(style.id)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${
                            formData.style === style.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-primary/30'
                          }`}
                        >
                          <span>{label}</span>
                          {formData.style === style.id && <span className="text-xs">✓</span>}
                        </button>
                      )})}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full">
                <button
                  type="button"
                  onClick={handleRandomGenerate}
                  disabled={loading}
                  className={`${CONTROL_BUTTON_CLASS} w-full disabled:cursor-not-allowed disabled:opacity-70`}
                  aria-label="随机生成提示词并自动生成图片"
                >
                  <span className="text-sm text-slate-500">
                    {language === 'zh' ? '随机提示词' : 'Random Prompt'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {language === 'zh' ? '一键填入灵感' : 'Fill in inspiration'}
                  </span>
                        </button>
              </div>
            </div>

            <div className="-mt-3 grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-2">
              <Button
                type="button"
                onClick={toggleWatermark}
                aria-pressed={formData.watermark}
                className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold shadow-md focus-visible:outline-none ${
                  formData.watermark
                    ? 'bg-primary text-white hover:bg-primary focus:bg-primary'
                    : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-50 focus:bg-slate-50'
                }`}
              >
                <Droplets
                  className={`h-4 w-4 ${
                    formData.watermark ? 'text-white' : 'text-primary'
                  }`}
                />
                {formData.watermark
                  ? language === 'zh'
                    ? '水印已开启'
                    : 'Watermark On'
                  : language === 'zh'
                  ? '添加水印'
                  : 'Add Watermark'}
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl px-6 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-70"
              >
                {loading ? t.form.generating : t.form.generateButton}
              </Button>
            </div>
          </div>
        </div>
      </form>
      <aside className="w-full lg:flex-[2.5]">
        <div className="h-full rounded-[32px] border border-slate-100 bg-white/80 p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
          <CreativePlayground onApplyPlay={handleApplyPlay} />
        </div>
      </aside>
    </div>
  );
};

