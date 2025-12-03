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
      // 提升版本号以清除旧的本地语言设置，确保默认语言回到英文
      version: 2,
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
    // 认证登录相关
    auth: {
      emailLogin: '邮箱登录',
    },
    // 用户账号菜单
    accountMenu: {
      triggerLabel: '账号状态',
      currentCredits: '当前积分',
      totalUsage: '共 {total}，已用 {used}',
      planType: '套餐类型',
      monthlyQuota: '月度配额',
      nextReset: '下次重置',
      helperText: '从最新订阅读取，如有延迟请稍后刷新',
      signInPrompt: '请登录以查看账号信息',
      signOut: '退出登录',
      signOutLoading: '退出中...',
      loading: '加载中...',
      freePlan: '免费计划',
      pointsUnit: '点',
      dailyCreditsLabel: '每日积分',
      planCreditsLabel: '套餐积分',
      planTimeLabel: '套餐时间',
      personalInfo: '个人信息',
      personalInfoDescription: '查看详细账号信息',
      helperSecondary: '积分 = 每日赠送 + 套餐积分',
      reset: {
        default: '24 小时后自动重置',
        invalid: '待定',
        soon: '即将刷新',
        day: '天',
        hour: '小时',
        minute: '分钟',
      },
      planNames: {
        basic: '基础套餐',
        pro: '专业套餐',
        max: '旗舰套餐',
      },
      planDisplay: {
        free: '免费版套餐',
        monthly_basic: '月度基础版套餐',
        monthly_pro: '月度专业版套餐',
        monthly_max: '月度旗舰版套餐',
        yearly_basic: '年度基础版套餐',
        yearly_pro: '年度专业版套餐',
        yearly_max: '年度旗舰版套餐',
        one_time_pro: '一次性专业版套餐',
        one_time_max: '一次性旗舰版套餐',
      },
    },
    accountPage: {
      title: '个人信息',
      subtitle: '查看当前积分、订阅套餐与账单状态。',
      back: '返回首页',
      loginRequired: '请先登录以查看个人信息。',
      goHome: '前往登录',
      sections: {
        profile: '个人信息',
        credits: '积分信息',
        plan: '套餐与账单',
        perks: '专属特权',
      },
      labels: {
        name: '姓名',
        email: '邮箱',
        plan: '当前套餐',
        currentPoints: '当前积分',
        remaining: '剩余积分',
        dailyCredits: '每日积分',
        planCredits: '套餐积分',
        nextReset: '下次重置',
        refreshHint: '积分信息每 24 小时自动同步，如需更新请刷新页面。',
      },
      actions: {
        updateProfile: '更新信息',
        signOut: '退出登录',
        signOutLoading: '退出中...',
        upgrade: '立即升级',
      },
      placeholders: {
        name: '未填写',
        email: '未绑定邮箱',
      },
      planPerks: {
        free: ['每日 10 点积分', '基础生成速度', '包含水印'],
      basic: ['每月 600 点积分', '基础生成速度', '无水印'],
        pro: ['每月 1200 点积分', '加速生成', '优先支持', '无水印'],
        max: ['每月 3600 点积分', '极速生成', '专属客服', '商用授权'],
      },
      perksHelper: '升级后可解锁更多积分、速度以及优先队列。',
      infoHelper: '每日赠送积分 + 套餐积分 = 当前积分。',
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
            monthly: '每月 600 点数',
            yearly: '每月 600 点数',
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
            '每月 600 点数',
            '每月可生成 300 张高清图片',
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
      // 图片尺寸与风格
      resolutionLabel: '分辨率',
      aspectRatioLabel: '图片比例',
      dimensionLabel: '图片尺寸',
      styleLabel: '图片风格',
      styleNone: '无',
      // 风格选项
      styles: {
        none: '无',
        digital_art: '数字艺术',
        rainbow: '霓虹朋克',
        line_art: '线条艺术',
        pixel: '像素艺术',
        photo: '摄影风格',
        film: '电影感',
        paper: '胶片感',
        fold: '折纸',
        '3d': '3D 模型',
        anime: '动漫',
        fantasy: '奇幻艺术',
        low_poly: '低多边形',
        enhance: '增强',
        comic: '漫画书',
        clay: '粘土工艺',
        isometric: '等距',
      },
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
    // 生成记录
    history: {
      title: '生成记录',
      empty: '暂无生成记录',
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
    // Authentication
    auth: {
      emailLogin: 'Email Login',
    },
    // Account menu
    accountMenu: {
      triggerLabel: 'Account',
      currentCredits: 'Current credits',
      totalUsage: 'Total {total}, used {used}',
      planType: 'Plan',
      monthlyQuota: 'Monthly quota',
      nextReset: 'Next reset',
      helperText: 'Synced from your latest subscription. Refresh if it looks outdated.',
      signInPrompt: 'Sign in to view account details',
      signOut: 'Sign out',
      signOutLoading: 'Signing out...',
      loading: 'Loading...',
      freePlan: 'Free plan',
      pointsUnit: 'credits',
      dailyCreditsLabel: 'Daily credits',
      planCreditsLabel: 'Plan credits',
      planTimeLabel: 'Plan window',
      personalInfo: 'Profile',
      personalInfoDescription: 'View detailed account info',
      helperSecondary: 'Credits = daily grant + plan allocation',
      reset: {
        default: 'Resets in 24 hours',
        invalid: 'TBD',
        soon: 'Refreshing soon',
        day: 'd',
        hour: 'h',
        minute: 'm',
      },
      planNames: {
        basic: 'Basic plan',
        pro: 'Pro plan',
        max: 'Max plan',
      },
      planDisplay: {
        free: 'Free plan',
        monthly_basic: 'Monthly Basic',
        monthly_pro: 'Monthly Pro',
        monthly_max: 'Monthly Max',
        yearly_basic: 'Yearly Basic',
        yearly_pro: 'Yearly Pro',
        yearly_max: 'Yearly Max',
        one_time_pro: 'One-time Pro',
        one_time_max: 'One-time Max',
      },
    },
    accountPage: {
      title: 'Profile',
      subtitle: 'Keep track of your credits, subscription, and billing status.',
      back: 'Back to home',
      loginRequired: 'Sign in to view your account.',
      goHome: 'Go to sign in',
      sections: {
        profile: 'Profile',
        credits: 'Credit balance',
        plan: 'Plan & billing',
        perks: 'Perks',
      },
      labels: {
        name: 'Name',
        email: 'Email',
        plan: 'Current plan',
        currentPoints: 'Current credits',
        remaining: 'Remaining credits',
        dailyCredits: 'Daily grant',
        planCredits: 'Plan allocation',
        nextReset: 'Next reset',
        refreshHint: 'We sync your credits every 24 hours. Refresh if the data looks outdated.',
      },
      actions: {
        updateProfile: 'Update profile',
        signOut: 'Sign out',
        signOutLoading: 'Signing out...',
        upgrade: 'Upgrade now',
      },
      placeholders: {
        name: 'Unnamed',
        email: 'No email linked',
      },
      planPerks: {
        free: ['10 credits every day', 'Standard render speed', 'Images include watermark'],
      basic: ['600 credits every month', 'Standard render speed', 'No watermark'],
        pro: ['1,200 credits every month', 'Faster rendering', 'Priority support', 'No watermark'],
        max: ['3,600 credits every month', 'Fastest rendering', 'Dedicated support', 'Commercial license'],
      },
      perksHelper: 'Upgrade to unlock more credits, faster queues, and VIP perks.',
      infoHelper: 'Daily grant + plan allocation = current credits.',
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
            monthly: '600 credits/month',
            yearly: '600 credits/month',
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
            '600 credits per month',
            '300 high-quality images per month',
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
      // Image size & style
      resolutionLabel: 'Resolution',
      aspectRatioLabel: 'Aspect ratio',
      dimensionLabel: 'Dimensions',
      styleLabel: 'Style',
      styleNone: 'None',
      styles: {
        none: 'None',
        digital_art: 'Digital art',
        rainbow: 'Neon punk',
        line_art: 'Line art',
        pixel: 'Pixel art',
        photo: 'Photographic',
        film: 'Cinematic',
        paper: 'Film grain',
        fold: 'Origami',
        '3d': '3D model',
        anime: 'Anime',
        fantasy: 'Fantasy art',
        low_poly: 'Low poly',
        enhance: 'Enhance',
        comic: 'Comic book',
        clay: 'Clay craft',
        isometric: 'Isometric',
      },
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

