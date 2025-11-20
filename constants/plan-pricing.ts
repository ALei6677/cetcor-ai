import type { BillingType, PlanId } from './billing';

export type SubscriptionBillingCycle = BillingType;

export interface PlanCyclePricing {
  price: number;
  credits: number;
  paypalPlanId: string;
}

export type PlanPricingConfig = Record<PlanId, Record<SubscriptionBillingCycle, PlanCyclePricing>>;

export const PLAN_IDS: PlanId[] = ['basic', 'pro', 'max'];

export const PLAN_PRICING: PlanPricingConfig = {
  basic: {
    monthly: {
      price: 15,
      credits: 240,
      paypalPlanId: 'P-11U5718285742053WNEOHLGY',
    },
    yearly: {
      price: 144,
      credits: 240,
      paypalPlanId: 'P-5BS562283P586814ENEOHOXY',
    },
  },
  pro: {
    monthly: {
      price: 25,
      credits: 1200,
      paypalPlanId: 'P-9LY09418ED5289138NEOHQTA',
    },
    yearly: {
      price: 240,
      credits: 1200,
      paypalPlanId: 'P-0T1494965C620674FNEOHTXI',
    },
  },
  max: {
    monthly: {
      price: 55,
      credits: 3600,
      paypalPlanId: 'P-6W150488WW857202PNEOHSNY',
    },
    yearly: {
      price: 540,
      credits: 3600,
      paypalPlanId: 'P-0J454073AR074815PNEOHTJA',
    },
  },
};

export const PAYPAL_PLAN_MAPPING = {
  monthly: {
    basic: PLAN_PRICING.basic.monthly.paypalPlanId,
    pro: PLAN_PRICING.pro.monthly.paypalPlanId,
    max: PLAN_PRICING.max.monthly.paypalPlanId,
  },
  yearly: {
    basic: PLAN_PRICING.basic.yearly.paypalPlanId,
    pro: PLAN_PRICING.pro.yearly.paypalPlanId,
    max: PLAN_PRICING.max.yearly.paypalPlanId,
  },
} as const;

export const getPlanPricing = (planId: PlanId, billingCycle: SubscriptionBillingCycle) =>
  PLAN_PRICING[planId][billingCycle];


