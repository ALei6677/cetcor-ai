/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { useLanguageStore } from '@/stores/language-store';

/**
 * 灵感创意卡片的数据结构
 */
export interface InspirationItem {
  /** 唯一标识，用于 React key */
  id: string;
  /** 展示用图片路径（相对于 public） */
  image: string;
  /** 悬停或无障碍说明文字 */
  alt: string;
  /** 点击时自动填入提示词输入框的内容 */
  prompt: string;
  /** 可选：瀑布流布局占用的网格 class，例如 'md:col-span-2 md:row-span-2' */
  gridClass?: string;
}

export interface InspirationGalleryProps {
  /**
   * 用户选择某个灵感卡片时触发，向外层传递对应的提示词
   */
  onSelectPrompt: (prompt: string) => void;
  /**
   * 外层可选地传入自定义灵感卡片数据；不传时使用组件内置的默认示例
   */
  items?: InspirationItem[];
  /** 可选：为整体板块追加额外类名（用于外层控制上下间距等） */
  className?: string;
}

/**
 * 默认灵感示例数据：使用 /public/Get inspiration 目录下的 12 张图片
 * 图片与提示词按编号一一对应：1.png → prompt1, 2.png → prompt2, ...
 */
const DEFAULT_ITEMS: InspirationItem[] = [
  {
    id: '1',
    image: '/Get inspiration/1.png',
    alt: '公路电影风格人像',
    prompt:
      'A photorealistic road movie-style portrait of the subject in the picture, wearing a dark casual jacket, arm resting on the car window, with wind-tousled hair strands across the face, eyes filled with intense and melancholic emotion gazing directly at the camera, set in the interior of a moving car, with a background of blurred desolate road and overcast sky, featuring a faintly visible rearview mirror. The scene is illuminated by soft, natural diffused light from an overcast or dusk sky filtering through the car window, creating a melancholic, poetic, and narratively tense atmosphere. Shot with a full-frame camera, 85mm f/1.8 prime lens, medium close-up, and a framing composition utilizing the car window frame, emphasizing the texture of wind-blown disheveled hair, the fabric grain of the dark jacket, the intense emotion in the moistened eyes, and the overall fine film grain with a matte color tone in the image. Ensure the basic appearance of the subject remains unchanged, maintain the same dimensions as the reference image, and the final output must be full-frame without black borders.',
    // 高度适中：由 3 行缩减为 2 行
    gridClass: 'row-span-2 md:row-span-2',
  },
  // 图片 12 移动到原先图片 2 的位置
  {
    id: '12',
    image: '/Get inspiration/12.png',
    alt: '时尚杂志封面风格人像',
    prompt:
      'A photorealistic [fashion magazine cover photography] of a us woman, [wearing asymmetric metal fringe earrings and a diamond-studded black gown with exquisite makeup, gazing steadily and determinedly into the lens], set in [a professional studio with pure black background, featuring the cover-standard "ECHOES OF ELEGANCE" masthead and maintaining the original magazine\'s typography layout hierarchy]. The scene is illuminated by [dramatic side-top directional lighting], creating a [luxurious, avant-garde and visually tense] atmosphere. Shot with [an 85mm f/1.8 large-aperture portrait lens, close-up composition, centered framing], emphasizing [the metallic luster and fluidity of the earrings, the crystalline refraction of the gown\'s diamonds, the voluminous texture of the dark curly hair, and the subtle details of the facial makeup]. Critical requirements: Strictly maintain the basic appearance, hairstyle and facial features of the subject in the picture, do not alter the dimensions of the original reference image, and ensure the image fills the frame completely without black borders.',
    gridClass: 'row-span-2 md:row-span-2',
  },
  {
    id: '3',
    image: '/Get inspiration/3.png',
    alt: '解构美食海报',
    prompt:
      'Create a visually dynamic deconstructed food poster focused on analyze any target dish: Position the finished, ready-to-serve item in the reference image as the focal point at the poster\'s bottom. Above this final dish, arrange all its components in logical, layered floating sections (ordered top-to-bottom) — starting with seasonings/garnishes, then key main ingredients, followed by supporting components, and concluding with the dish\'s core base, just above the finished food. Add clear, bold English text labels for each component, paired with small directional arrows linking each labeled section to its corresponding part in the finished dish, to clarify ingredient-to-final-dish connections. Use a high-contrast background to make the vibrant colors of ingredients and the finished dish stand out; incorporate subtle textural details and minimal accent effects to highlight the finished dish as the culminating product, while keeping typography clean and legible for easy label reading.',
    gridClass: 'row-span-1 md:row-span-1',
  },
  // 图片 2 移动到原先图片 4 的位置
  {
    id: '2',
    image: '/Get inspiration/2.png',
    alt: '西班牙海鲜饭美食配方',
    prompt:
      'Generate Spanish Culinary Institute-certified Paella recipe: 1) Authentic ingredient list (0.3g saffron, 220g Spanish short-grain rice, etc.) 2) 8-step precise process with 3:4 vertical ratio professional images for critical steps (e.g., "Step 3: Close-up of \'socarrat\' crust formation showing golden color"), images must maintain strict 3:4 aspect ratio while highlighting critical states 3) Professional techniques ("Saffron soaked in warm water 30 minutes prior") 4) Safety warnings (hot paella pan handling) 5) 3:4 ratio finished "socarrat" close-up. Require all images as professional food photography with strict textual-visual alignment to Valencia traditional cooking standards.',
    gridClass: 'row-span-2 md:row-span-2',
  },
  {
    id: '5',
    image: '/Get inspiration/5.png',
    alt: 'Y2K 摄影人像',
    prompt:
      'a Y2K photography portrait, VHS glitch effect, visible pixelation and noise, harsh direct flash, y2k hairstyle, y2k accessories, metallic makeup, reflective synthetic clothing, early 2000s digital retro aesthetic, low-resolution digital photo, causal candid snapshot composition, keep facial features unchanged',
  },
  {
    id: '6',
    image: '/Get inspiration/6.png',
    alt: '意大利庄园绅士人像',
    prompt:
      'A gentleman in his mid-thirties stands elegantly on an Italian estate\'s stone path, his slicked-back brown hair and tender gaze complementing the romantic autumnal setting. He wears a crisp white silk shirt beneath a charcoal double-breasted blazer, paired with tailored black trousers and polished shoes, accessorized with a silver necklace and platinum ring while holding a blush rose. Golden sunflower fields stretch behind him toward a white villa and fountain, framed by crimson maples under the warm pre-sunset glow. This photorealistic scene captures the sophisticated atmosphere from the reference image without borders, text, or watermarks.',
    gridClass: 'row-span-2 md:row-span-2',
  },
  {
    id: '7',
    image: '/Get inspiration/7.png',
    alt: '赛博中国风人像',
    prompt:
      'A cyber-Chinese portrait against vibrant red backdrop with falling data streams. Wearing black circuit-patterned qipao with leather vest and gear necklace. Mechanical headpiece, holding translucent circuit-board fan with purple-blue glow. Minimal makeup with mechanical left eye component. Traditional pose enhanced with futuristic elements.',
    gridClass: 'row-span-2 md:row-span-3',
  },
  {
    id: '8',
    image: '/Get inspiration/8.png',
    alt: '万圣节狗狗南瓜城堡',
    prompt:
      'a portrait of dog, wearing an orange pumpkin-patterned witch hat and a matching cape, sitting on the steps of a spooky Halloween castle at night. Surrounded by glowing jack-o\'-lanterns, lit candles, cobwebs, and flying bats, with the castle illuminated by warm lights in the background. Photorealistic, atmospheric lighting, detailed textures (fabric cape, pumpkin carvings, castle architecture), vertical composition',
    gridClass: 'row-span-1 md:row-span-2',
  },
  {
    id: '9',
    image: '/Get inspiration/9.png',
    alt: '时尚猫头鹰杂志封面',
    prompt:
      'The main subject of the image is an owl, with the text "BAZAAR" displayed at the top. The background is dark blue. The owl is wearing a light blue striped shirt, a dark blue tie with white stripes, and orange-white headphones. It sits on the ground with its mouth open and tongue out, showing a cute expression. The fur is clear and detailed, and the overall image has a fashionable feel, resembling a Harper\'s Bazaar fashion spread. The image is sharp and clear. Maintain the original aspect ratio. Ensure the owl\'s expression, body structure, and posture are natural, and preserve all feather details.',
  },
  {
    id: '11',
    image: '/Get inspiration/11.png',
    alt: '赛博未来 Q 版女孩',
    prompt:
      'Generate a cyber-futuristic Q-version girl: the character has black-and-white gradient short hair, pink-purple eyes, wearing a pink knit hat + pink-blue color-blocked goggles + pink-purple over-ear headphones, a white cropped printed T-shirt + blue-purple gradient multi-pocket cargo pants + dark blue chunky functional boots, paired with black-red color-blocked gloves, a choker, and a neon blue armband; she stands with one hand on her hip and the other holding a phone to take a selfie. The scene is a futuristic urban rooftop, with a cyber city of tall buildings (with neon light-up screens) in the background, colorful sci-fi aircraft floating in the air, and a clear blue sky with a few white clouds. Use C4D cartoon rendering style, blending trendy toy Q-version modeling with cyberpunk futurism; the color palette is dominated by blue, purple, and pink (blue-purple gradient cargo pants, pink-blue contrasting accessories), paired with bright sky blue and city neon colors. Compose from an eye-level slightly low angle, focusing on the character\'s full body, highlighting the character\'s functional trendy outfit and the technological atmosphere of the future city; details include the phone\'s metallic texture, the cargo pants\' pocket stitching, and the aircraft\'s luminous components.',
    gridClass: 'row-span-2 md:row-span-3',
  },
  {
    id: '10',
    image: '/Get inspiration/10.png',
    alt: '办公室狗狗自拍',
    prompt:
      'A casual, everyday snapshot with a candid feel. No deliberate composition, slight motion blur present. A dog is centered in the frame, posed for a selfie. The dog\'s face, expression, angle, facial structure, and feature proportions must remain completely identical to the reference image. It wears a lanyard with an ID badge featuring a large portrait photo of itself. The dog\'s left paw holds a takeaway coffee cup. The background is an office setting, with a computer screen showing programming code visible nearby. The atmosphere is mundane yet unique. Maintain original aspect ratio.',
  },
  // 图片 4 移动到原先图片 12 的位置（数组末尾）
  {
    id: '4',
    image: '/Get inspiration/4.png',
    alt: '巴黎旅行自拍狗狗',
    prompt:
      'The subject dog takes selfies while travelling in paris. It is wearing warm winter coat, sunglasses, standing against a background of the eiffel tower.',
    // 高度适中：由 3 行缩减为 2 行
    gridClass: 'row-span-2 md:row-span-2',
  },
];

/**
 * 灵感创意瀑布流模块
 * 展示多张灵感图片，点击后会将预设提示词回填到提示词输入框，并由外层控制滚动到表单区域
 */
export function InspirationGallery({ onSelectPrompt, items, className }: InspirationGalleryProps) {
  const data = items && items.length > 0 ? items : DEFAULT_ITEMS;
  const language = useLanguageStore((state) => state.language);

  return (
    <section className={`w-full py-10 text-white ${className ?? ''}`}>
      <div className="px-4 text-center">
        <h2 className="text-2xl font-semibold text-slate-800 sm:text-3xl">
          {language === 'zh' ? '获取灵感' : 'Get Inspired'}
        </h2>
        <p className="mt-2 text-xs text-slate-500 sm:text-sm">
          {language === 'zh'
            ? '点击任意图片，即可自动填入对应提示词并回到输入框'
            : 'Click any image to auto-fill its prompt and scroll back to the input box.'}
        </p>
      </div>

      {/* 4 列瀑布流：通过统一的行高 + 不同 row-span 制造“错落有致”的效果 */}
      <div className="mt-6 grid grid-cols-2 auto-rows-[150px] gap-3 px-4 sm:grid-cols-3 sm:auto-rows-[180px] sm:gap-4 md:grid-cols-4 md:auto-rows-[210px] md:gap-5">
        {data.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className={`group relative flex overflow-hidden rounded-[28px] transition duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              item.gridClass || ''
            }`}
          >
            <img
              src={item.image}
              alt={item.alt}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-3 text-left text-[11px] leading-snug text-slate-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:p-4 sm:text-xs">
              <span className="line-clamp-3">
                {language === 'zh' ? '灵感：' : 'Prompt: '}
                {item.prompt}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}


