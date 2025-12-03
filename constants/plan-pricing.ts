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
      credits: 600,
      paypalPlanId: 'P-33W263280A994581YNEPNRYQ',
    },
    yearly: {
      price: 144,
      credits: 600,
      paypalPlanId: 'P-0FE744777L2833816NEPNSOA',
    },
  },
  pro: {
    monthly: {
      price: 25,
      credits: 1200,
      paypalPlanId: 'P-60M89877BT707251GNEPNS4Q',
    },
    yearly: {
      price: 240,
      credits: 1200,
      paypalPlanId: 'P-2UA39161M82718617NEPNTIY',
    },
  },
  max: {
    monthly: {
      price: 55,
      credits: 3600,
      paypalPlanId: 'P-39K35255EV002711VNEPNTWQ',
    },
    yearly: {
      price: 540,
      credits: 3600,
      paypalPlanId: 'P-1S822695CV3353749NEPNUCQ',
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


