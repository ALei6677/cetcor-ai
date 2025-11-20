 'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants/api.constants';

/**
 * 支持的语言类型
 */
export type Language = 'zh' | 'en';

/**
 * 语言Store状态接口
 */
interface ILanguageState {
  /** 当前语言 */
  language: Language;

  /** Store 是否已完成 hydration */
  hasHydrated: boolean;

  /** 设置语言 */
  setLanguage: (lang: Language) => void;

  /** 设置 hydration 状态 */
  setHasHydrated: (value: boolean) => void;

  /** 切换语言 */
  toggleLanguage: () => void;
}

/**
 * 多语言Store
 * 管理界面语言设置并持久化到localStorage
 */
export const useLanguageStore = create<ILanguageState>()(
  persist(
    (set, get) => ({
      // 默认英文
      language: 'en',
      hasHydrated: false,

      /**
       * 设置语言
       * @param lang - 语言代码
       */
      setLanguage: (lang) => {
        set({ language: lang });
      },

      /**
       * 设置 hydration 状态
       * @param value - 是否已完成 hydration
       */
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },

      /**
       * 切换语言（中英文切换）
       */
      toggleLanguage: () => {
        const { language } = get();
        set({ language: language === 'zh' ? 'en' : 'zh' });
      },
    }),
    {
      name: STORAGE_KEYS.LANGUAGE,
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          state?.setHasHydrated?.(true);
          return;
        }
        state?.setHasHydrated?.(true);
      },
    }
  )
);

/**
 * 多语言文案配置
 */
export const translations = {
  zh: {
    // 导航栏
    nav: {
      pricing: '定价',
      history: '历史记录',
    },
    // 定价页
    pricing: {
      back: '返回生成器',
      cancelAnytime: '随时取消',
      title: '定价方案',
      subtitle: '选择最适合你的方案，随时切换或取消订阅。',
      billingOptions: {
        monthly: { label: '月付' },
        yearly: { label: '年付', helper: '节省50%' },
        oneTime: { label: '一次性' },
      },
      plans: [
        {
          id: 'basic',
          name: '基础版',
          description: '适合入门级个人用户',
          highlight: {
            monthly: '每月 240 点数',
            yearly: '每月 240 点数',
            oneTime: '总计 600 点数',
          },
          pricing: {
            monthly: {
              headline: '$15.00',
              suffix: '/月',
              total: '$15.00',
              secondary: '每月扣费',
            },
            yearly: {
              headline: '$12.00',
              suffix: '/月',
              total: '$144.00',
              original: '原价 $180.00/年',
              secondary: '现价 $144.00/年，一次性支付',
            },
            oneTime: {
              headline: '$89',
              suffix: '一次性',
              total: '$89',
              secondary: '一次性获得 600 点数',
            },
          },
          features: [
            '每月 240 点数',
            '每月可生成 120 张高清图片',
            '标准速度',
            '基础支持',
            '无水印',
          ],
        },
        {
          id: 'pro',
          name: '专业版',
          description: '专为创作者与专业人士设计',
          badge: '最受欢迎',
          highlight: {
            monthly: '每月 1200 点数',
            yearly: '每月 1200 点数',
            oneTime: '总计 500 点数',
          },
          pricing: {
            monthly: {
              headline: '$25.00',
              suffix: '/月',
              total: '$25.00',
              secondary: '每月扣费',
            },
            yearly: {
              headline: '$20.00',
              suffix: '/月',
              total: '$240.00',
              original: '原价 $300.00/年',
              secondary: '现价 $240.00/年，一次性支付',
              badge: '节省20%',
            },
            oneTime: {
              headline: '$20.00',
              suffix: '一次性',
              total: '$20.00',
              secondary: '一次性获得 500 点数',
            },
          },
          features: [
            '每月 1200 点数',
            '每月可生成 600 张高清图片',
            '高速生成',
            '优先支持',
            '无水印',
            '商用授权',
          ],
        },
        {
          id: 'max',
          name: '旗舰版',
          description: '满足高强度商业级需求',
          highlight: {
            monthly: '每月 3600 点数',
            yearly: '每月 3600 点数',
            oneTime: '总计 1000 点数',
          },
          pricing: {
            monthly: {
              headline: '$55.00',
              suffix: '/月',
              total: '$55.00',
              secondary: '每月扣费',
            },
            yearly: {
              headline: '$45.00',
              suffix: '/月',
              total: '$540.00',
              original: '原价 $660.00/年',
              secondary: '现价 $540.00/年，一次性支付',
              badge: '节省18%',
            },
            oneTime: {
              headline: '$40.00',
              suffix: '一次性',
              total: '$40.00',
              secondary: '一次性获得 1000 点数',
            },
          },
          features: [
            '每月 3600 点数',
            '每月可生成 1800 张高清图片',
            '快速生成',
            '专属支持',
            '无水印',
            '商用授权',
          ],
        },
      ],
      subscribe: '订阅',
    },
    // 结账页
    checkout: {
      back: '返回定价',
      heading: '订阅 {plan}',
      summaryTitle: '订单摘要',
      planLabel: '{plan} 套餐',
      billedFrequency: {
        monthly: '按月计费',
        yearly: '按年计费',
        oneTime: '一次性支付',
      },
      pricePeriod: {
        monthly: '每月',
        yearly: '每年',
        oneTime: '一次性',
      },
      subtotal: '小计',
      addPromotionCode: '添加优惠码',
      totalDueToday: '今日应付',
      emailLabel: '邮箱',
      emailPlaceholder: 'name@example.com',
      paymentMethod: '支付方式',
      orDivider: '或',
      paymentMethods: {
        card: '银行卡',
        cashApp: 'Cash App Pay',
        bank: '银行转账',
      },
      cardInformation: '卡片信息',
      cardNumberPlaceholder: '1234 1234 1234 1234',
      expiryPlaceholder: 'MM / YY',
      cvcPlaceholder: 'CVC',
      cardholderName: '持卡人姓名',
      cardholderPlaceholder: '与卡片一致的姓名',
      countryOrRegion: '国家或地区',
      subscribeButton: '确认订阅',
      secureNote: '支付信息将通过加密渠道安全传输。',
      cashAppBonus: '返现 $5',
      countryOptions: [
        { value: 'china', label: '中国' },
        { value: 'united-states', label: '美国' },
        { value: 'singapore', label: '新加坡' },
        { value: 'united-kingdom', label: '英国' },
      ],
    },
    // 首页标题
    hero: {
      title: 'Cetcor AI',
      version: '',
      subtitle: '体验图片生成，让创意摇摆',
    },
    // 表单
    form: {
      promptPlaceholder: '描述你想要生成的图片...',
      promptLabel: '提示词',
      modeLabel: '自动组图模式',
      modeDescription: '描述想生成的图片',
      sizeLabel: '生成组图',
      maxImagesLabel: '上限15张',
      maxImages: '最多生成',
      maxImagesUnit: '张',
      generateButton: '生成',
      generating: '生成中...',
      referenceImageLabel: '参考图（可选）',
      referenceImageUpload: '上传',
      referenceImageHint: '最多可上传 {max} 张参考图，支持 JPG、PNG、WebP、GIF 格式，单张不超过 10MB',
      referenceImageInvalidType: '只支持 JPG、PNG、WebP、GIF 格式的图片',
      referenceImageTooLarge: '图片大小不能超过 10MB',
      referenceImageMaxReached: '最多只能上传 {max} 张参考图',
    },
    // 图片画廊
    gallery: {
      title: '生成结果',
      download: '下载',
      copyPrompt: '复制提示词',
      noResults: '暂无生成结果',
    },
    // 历史记录
    history: {
      title: '历史记录',
      empty: '暂无历史记录',
      clear: '清空',
      close: '关闭',
      generatedAt: '生成于',
    },
    // 错误提示
    error: {
      networkError: '网络错误，请稍后重试',
      apiError: 'API调用失败',
      validationError: '输入验证失败',
    },
    // 底部说明
    footer: {
      disclaimer: '试用体验内容均由人工智能模型生成，不代表平台立场观点明示或暗示试验阶段政策',
    },
  },
  en: {
    // Navigation
    nav: {
      pricing: 'Pricing',
      history: 'History',
    },
    // Pricing Page
    pricing: {
      back: 'Back to generator',
      cancelAnytime: 'Cancel anytime',
      title: 'Pricing',
      subtitle: 'Choose the plan that works best for you. Switch plans or cancel at any time.',
      billingOptions: {
        monthly: { label: 'Monthly' },
        yearly: { label: 'Yearly', helper: 'SAVE 50%' },
        oneTime: { label: 'One-Time' },
      },
      plans: [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Perfect for individuals getting started',
          highlight: {
            monthly: '240 credits/month',
            yearly: '240 credits/month',
            oneTime: '600 credits total',
          },
          pricing: {
            monthly: {
              headline: '$15.00',
              suffix: '/month',
              total: '$15.00',
              secondary: 'Billed monthly',
            },
            yearly: {
              headline: '$12.00',
              suffix: '/month',
              total: '$144.00',
              original: '$180.00/year',
              secondary: 'Now $144.00/year billed upfront',
            },
            oneTime: {
              headline: '$89',
              suffix: 'one-time',
              total: '$89',
              secondary: 'Includes 600 credits upfront',
            },
          },
          features: [
            '240 credits per month',
            '120 high-quality images per month',
            'Standard speed',
            'Basic support',
            'No watermark',
          ],
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'Best for creators and professionals',
          badge: 'Most Popular',
          highlight: {
            monthly: '1200 credits/month',
            yearly: '1200 credits/month',
            oneTime: '500 credits total',
          },
          pricing: {
            monthly: {
              headline: '$25.00',
              suffix: '/month',
              total: '$25.00',
              secondary: 'Billed monthly',
            },
            yearly: {
              headline: '$20.00',
              suffix: '/month',
              total: '$240.00',
              original: '$300.00/year',
              secondary: 'Now $240.00/year billed upfront',
              badge: 'SAVE 20%',
            },
            oneTime: {
              headline: '$20.00',
              suffix: 'one-time',
              total: '$20.00',
              secondary: 'Includes 500 credits upfront',
            },
          },
          features: [
            '1,200 credits per month',
            '600 high-quality images per month',
            'High speed',
            'Priority support',
            'No watermark',
            'Commercial use',
          ],
        },
        {
          id: 'max',
          name: 'Max',
          description: 'Enterprise-grade for power users',
          highlight: {
            monthly: '3600 credits/month',
            yearly: '3600 credits/month',
            oneTime: '1000 credits total',
          },
          pricing: {
            monthly: {
              headline: '$55.00',
              suffix: '/month',
              total: '$55.00',
              secondary: 'Billed monthly',
            },
            yearly: {
              headline: '$45.00',
              suffix: '/month',
              total: '$540.00',
              original: '$660.00/year',
              secondary: 'Now $540.00/year billed upfront',
              badge: 'SAVE 18%',
            },
            oneTime: {
              headline: '$40.00',
              suffix: 'one-time',
              total: '$40.00',
              secondary: 'Includes 1000 credits upfront',
            },
          },
          features: [
            '3,600 credits per month',
            '1,800 high-quality images per month',
            'High speed',
            'Priority support',
            'No watermark',
            'Commercial use',
          ],
        },
      ],
      subscribe: 'Subscribe',
    },
    // Checkout Page
    checkout: {
      back: 'Back to pricing',
      heading: 'Subscribe to {plan}',
      summaryTitle: 'Order summary',
      planLabel: '{plan} Plan',
      billedFrequency: {
        monthly: 'Billed monthly',
        yearly: 'Billed annually',
        oneTime: 'One-time payment',
      },
      pricePeriod: {
        monthly: 'per month',
        yearly: 'per year',
        oneTime: 'one-time',
      },
      subtotal: 'Subtotal',
      addPromotionCode: 'Add promotion code',
      totalDueToday: 'Total due today',
      emailLabel: 'Email',
      emailPlaceholder: 'name@example.com',
      paymentMethod: 'Payment method',
      orDivider: 'OR',
      paymentMethods: {
        card: 'Card',
        cashApp: 'Cash App Pay',
        bank: 'Bank',
      },
      cardInformation: 'Card information',
      cardNumberPlaceholder: '1234 1234 1234 1234',
      expiryPlaceholder: 'MM / YY',
      cvcPlaceholder: 'CVC',
      cardholderName: 'Cardholder name',
      cardholderPlaceholder: 'Full name on card',
      countryOrRegion: 'Country or region',
      subscribeButton: 'Subscribe',
      secureNote: 'Your payment is secured with bank-level encryption.',
      cashAppBonus: '$5 back',
      countryOptions: [
        { value: 'china', label: 'China' },
        { value: 'united-states', label: 'United States' },
        { value: 'singapore', label: 'Singapore' },
        { value: 'united-kingdom', label: 'United Kingdom' },
      ],
    },
    // Hero
    hero: {
      title: 'Cetcor AI',
      version: '',
      subtitle: 'Experience Image Generation, Let Creativity Swing',
    },
    // Form
    form: {
      promptPlaceholder: 'Describe the image you want to generate...',
      promptLabel: 'Prompt',
      modeLabel: 'Auto Group Mode',
      modeDescription: 'Describe images to generate',
      sizeLabel: 'Generate Group',
      maxImagesLabel: 'Max 15',
      maxImages: 'Max Images',
      maxImagesUnit: '',
      generateButton: 'Generate',
      generating: 'Generating...',
      referenceImageLabel: 'Reference Images (Optional)',
      referenceImageUpload: 'Upload',
      referenceImageHint: 'Upload up to {max} reference images. Supported formats: JPG, PNG, WebP, GIF. Max 10MB per image',
      referenceImageInvalidType: 'Only JPG, PNG, WebP, GIF formats are supported',
      referenceImageTooLarge: 'Image size cannot exceed 10MB',
      referenceImageMaxReached: 'Maximum {max} reference images allowed',
    },
    // Gallery
    gallery: {
      title: 'Results',
      download: 'Download',
      copyPrompt: 'Copy Prompt',
      noResults: 'No results yet',
    },
    // History
    history: {
      title: 'History',
      empty: 'No history yet',
      clear: 'Clear',
      close: 'Close',
      generatedAt: 'Generated at',
    },
    // Error
    error: {
      networkError: 'Network error, please try again later',
      apiError: 'API call failed',
      validationError: 'Validation failed',
    },
    // Footer
    footer: {
      disclaimer: 'Trial content is generated by AI models and does not represent the platform\'s stance or views. Trial phase policy applies.',
    },
  },
};

/**
 * 获取翻译文案的Hook
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const hasHydrated = useLanguageStore((state) => state.hasHydrated);

  const effectiveLanguage = hasHydrated ? language : 'en';

  return translations[effectiveLanguage];
}

