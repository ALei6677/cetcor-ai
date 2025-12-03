import { PAYPAL_PLAN_MAPPING as DEFAULT_PAYPAL_PLAN_MAPPING } from './plan-pricing';

export type BillingType = 'monthly' | 'yearly';
export type PlanId = 'basic' | 'pro' | 'max';

export const ONE_TIME_PLAN_IDS = ['pro', 'max'] as const;
export type OneTimePlanId = (typeof ONE_TIME_PLAN_IDS)[number];

export const isOneTimePlanId = (planId: PlanId): planId is OneTimePlanId =>
  (ONE_TIME_PLAN_IDS as readonly PlanId[]).includes(planId);

export const CREDIT_COST_PER_IMAGE = 2;
export const FREE_PLAN_DAILY_CREDITS = 10;

export const SUBSCRIPTION_PLAN_CREDITS: Record<PlanId, number> = {
  basic: 600,
  pro: 1200,
  max: 3600,
};

export const ONE_TIME_PLAN_CREDITS: Record<OneTimePlanId, number> = {
  pro: 500,
  max: 1000,
};

export const ONE_TIME_PRICES_USD: Record<OneTimePlanId, string> = {
  pro: '20.00',
  max: '40.00',
};

export type PurchaseType = BillingType | 'one_time';

export const getCreditsForPurchase = (planId: PlanId, purchaseType: PurchaseType): number => {
  if (purchaseType === 'one_time') {
    if (!isOneTimePlanId(planId)) {
      return 0;
    }
    return ONE_TIME_PLAN_CREDITS[planId];
  }
  return SUBSCRIPTION_PLAN_CREDITS[planId];
};

export interface PaypalPlanMapping {
  monthly: Record<PlanId, string>;
  yearly: Record<PlanId, string>;
}

let cachedPlanMapping: PaypalPlanMapping | null = null;

const parseJsonEnv = <T>(value: string | undefined, label: string): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[billing] Failed to parse ${label}:`, error);
    return null;
  }
};

const PLAN_IDS: PlanId[] = ['basic', 'pro', 'max'];
const BILLING_TYPES: BillingType[] = ['monthly', 'yearly'];

const isValidPlanMapping = (mapping: PaypalPlanMapping | null): mapping is PaypalPlanMapping => {
  if (!mapping) {
    return false;
  }
  return BILLING_TYPES.every((billingType) =>
    PLAN_IDS.every((planId) => {
      const paypalPlanId = mapping[billingType]?.[planId];
      return typeof paypalPlanId === 'string' && paypalPlanId.length > 0;
    })
  );
};

export const getPaypalPlanMapping = (): PaypalPlanMapping | null => {
  if (cachedPlanMapping) {
    return cachedPlanMapping;
  }

  const envMapping = parseJsonEnv<PaypalPlanMapping>(
    process.env.PAYPAL_PLAN_MAPPING,
    'PAYPAL_PLAN_MAPPING'
  );

  if (isValidPlanMapping(envMapping)) {
    cachedPlanMapping = envMapping;
    return cachedPlanMapping;
  }

  if (process.env.PAYPAL_PLAN_MAPPING) {
    console.warn('[billing] PAYPAL_PLAN_MAPPING 无效，回退至内置默认值。');
  } else {
    console.warn('[billing] PAYPAL_PLAN_MAPPING 未配置，回退至内置默认值。');
  }

  cachedPlanMapping = DEFAULT_PAYPAL_PLAN_MAPPING;
  return cachedPlanMapping;
};

export const getPaypalPlanId = (planId: PlanId, billingType: BillingType): string | null => {
  const mapping = getPaypalPlanMapping();
  if (!mapping) return null;
  return mapping[billingType]?.[planId] ?? null;
};

/**
 * 从 PayPal plan_id 反向查找我们的 planId 和 billingType
 * @param paypalPlanId PayPal 的 plan ID
 * @returns 如果找到，返回 { planId, billingType }，否则返回 null
 */
export const getPlanIdFromPaypalPlanId = (
  paypalPlanId: string
): { planId: PlanId; billingType: BillingType } | null => {
  const mapping = getPaypalPlanMapping();
  if (!mapping) return null;

  for (const billingType of BILLING_TYPES) {
    for (const planId of PLAN_IDS) {
      if (mapping[billingType]?.[planId] === paypalPlanId) {
        return { planId, billingType };
      }
    }
  }

  return null;
};

let hasWarnedDeprecatedOneTimePlan = false;

export const getPaypalHostedButtonMapping = (): Record<OneTimePlanId, string> | null => {
  const mapping = parseJsonEnv<Record<string, string>>(
    process.env.PAYPAL_ONETIME_BUTTONS,
    'PAYPAL_ONETIME_BUTTONS'
  );
  if (!mapping) {
    return null;
  }

  if (mapping.basic && !hasWarnedDeprecatedOneTimePlan) {
    console.warn(
      '[billing] PAYPAL_ONETIME_BUTTONS 含有 basic 配置，已停用一次性基础套餐并自动忽略该值。'
    );
    hasWarnedDeprecatedOneTimePlan = true;
  }

  const filtered = ONE_TIME_PLAN_IDS.reduce((acc, planId) => {
    const buttonId = mapping[planId];
    if (buttonId) {
      acc[planId] = buttonId;
    }
    return acc;
  }, {} as Record<OneTimePlanId, string>);

  return Object.keys(filtered).length ? filtered : null;
};

const resolveBaseUrl = (origin?: string | null): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (origin) return origin;
  return process.env.NODE_ENV === 'production'
    ? 'https://cetcorai.com'
    : 'http://localhost:3000';
};

export const buildSuccessUrl = (origin?: string | null) =>
  `${resolveBaseUrl(origin)}/payment/success`;

export const buildCancelUrl = (origin?: string | null) =>
  `${resolveBaseUrl(origin)}/payment/cancel`;

