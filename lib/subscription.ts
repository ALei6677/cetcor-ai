import type { PlanId } from '@/constants/billing';

const PLAN_IDS: PlanId[] = ['basic', 'pro', 'max'];

export type PlanDisplayKey =
  | 'free'
  | 'monthly_basic'
  | 'monthly_pro'
  | 'monthly_max'
  | 'yearly_basic'
  | 'yearly_pro'
  | 'yearly_max'
  | 'one_time_pro'
  | 'one_time_max';

const isValidPlanId = (planId?: string | null): planId is PlanId =>
  PLAN_IDS.includes(planId as PlanId);

export const normalizePlanId = (planId?: string | null): PlanId | null =>
  isValidPlanId(planId) ? (planId as PlanId) : null;

/**
 * 根据 planId 与 billingType 计算展示 key，方便多语言映射
 */
export const resolvePlanDisplayKey = (
  planId?: string | null,
  billingType?: string | null
): PlanDisplayKey => {
  const normalizedPlan = normalizePlanId(planId);

  if (!normalizedPlan) {
    return 'free';
  }

  if (billingType === 'yearly') {
    return `yearly_${normalizedPlan}` as PlanDisplayKey;
  }

  if (billingType === 'one_time') {
    if (normalizedPlan === 'basic') {
      return 'monthly_basic';
    }
    return `one_time_${normalizedPlan}` as PlanDisplayKey;
  }

  return `monthly_${normalizedPlan}` as PlanDisplayKey;
};


