/**
 * PRICING CONFIGURATION
 * 
 * This file centralizes all pricing and cost calculations for Turion.
 * Update these values to adjust pricing across the entire application.
 */

// ============================================
// LLM API COSTS (OpenAI GPT-5.2)
// ============================================
// These are the costs we pay to the LLM provider
export const LLM_COSTS = {
  // Cost per 1 million tokens (MTok)
  INPUT_TOKEN_COST_PER_MTOK: 1.75,      // $1.75/MTok for input
  OUTPUT_TOKEN_COST_PER_MTOK: 14.0,     // $14.00/MTok for output
  
  // Cache costs (if using caching in the future)
  CACHE_WRITE_5M_PER_MTOK: 0.0,        // Not used for GPT-5.2 pricing
  CACHE_WRITE_1H_PER_MTOK: 0.0,        // Not used for GPT-5.2 pricing
  CACHE_HIT_PER_MTOK: 0.175,           // $0.175/MTok for cached input
};

// Convert to per-token costs for easier calculations
export const LLM_COSTS_PER_TOKEN = {
  INPUT: LLM_COSTS.INPUT_TOKEN_COST_PER_MTOK / 1_000_000,   // $0.000003 per token
  OUTPUT: LLM_COSTS.OUTPUT_TOKEN_COST_PER_MTOK / 1_000_000, // $0.000015 per token
};

// ============================================
// CREDIT PRICING (What we charge customers)
// ============================================
export const CREDIT_PRICING = {
  // Base pricing: £5 for 10,000 credits (10k tokens)
  GBP_PER_10K_CREDITS: 5.0,
  CREDITS_PER_GBP: 10_000 / 5.0,  // 2,000 credits per £1
  
  // Token to credit conversion
  // 1 token = 1 credit (simple 1:1 mapping)
  CREDITS_PER_TOKEN: 1,
  
  // Credit packages available for purchase
  PACKAGES: [
    { credits: 10_000, price: 5.0, label: "10K Credits" },
    { credits: 50_000, price: 22.5, label: "50K Credits", discount: "10% off" },
    { credits: 100_000, price: 40.0, label: "100K Credits", discount: "20% off" },
  ],
};

// ============================================
// SUBSCRIPTION PLANS
// ============================================
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: "Starter",
    priceGBP: 7.0,
    creditsPerMonth: 100_000,  // 100k credits/month (~100k tokens)
    features: [
      "100K AI tokens per month",
      "5 AI-generated apps per month",
      "Basic templates",
      "Community support",
      "Standard deployment",
      "Code export",
    ],
  },
  PRO: {
    name: "Pro",
    priceGBP: 20.0,
    creditsPerMonth: 500_000,  // 500k credits/month (~500k tokens)
    features: [
      "500K AI tokens per month",
      "Unlimited AI-generated apps",
      "Premium templates",
      "Priority support",
      "Advanced deployment",
      "Code ownership",
      "Custom branding",
      "API access",
      "Team collaboration",
    ],
  },
};

// ============================================
// PROFIT MARGIN CALCULATIONS
// ============================================
// These calculations show the profit margin on credits
// Assuming average 50% input tokens, 50% output tokens
const AVERAGE_COST_PER_TOKEN = 
  (LLM_COSTS_PER_TOKEN.INPUT + LLM_COSTS_PER_TOKEN.OUTPUT) / 2; // $0.000009 per token

const GBP_TO_USD = 1.27; // Approximate conversion rate (update as needed)
const PRICE_PER_TOKEN_USD = 
  (CREDIT_PRICING.GBP_PER_10K_CREDITS * GBP_TO_USD) / 10_000; // $0.000635 per token

export const PROFIT_METRICS = {
  AVERAGE_COST_PER_TOKEN_USD: AVERAGE_COST_PER_TOKEN,
  PRICE_PER_TOKEN_USD: PRICE_PER_TOKEN_USD,
  PROFIT_PER_TOKEN_USD: PRICE_PER_TOKEN_USD - AVERAGE_COST_PER_TOKEN,
  PROFIT_MARGIN_PERCENT: 
    ((PRICE_PER_TOKEN_USD - AVERAGE_COST_PER_TOKEN) / PRICE_PER_TOKEN_USD) * 100,
  // Expected: ~98.5% profit margin (excellent!)
};

// ============================================
// BONUS CREDITS (Sign-up, promotions, etc.)
// ============================================
export const BONUS_CREDITS = {
  SIGNUP_BONUS: 10_000,           // 10k credits on signup (£5 value)
  REFERRAL_BONUS: 5_000,          // 5k credits per referral
  MONTHLY_FREE_TIER: 1_000,       // 1k credits for free users per month
};

// ============================================
// CREDIT LIMITS
// ============================================
export const CREDIT_LIMITS = {
  // Maximum negative balance allowed
  // Users can go into debt up to this amount, then get blocked
  MAX_NEGATIVE_BALANCE: -10_000,  // Can go -10k credits in debt
  
  // Minimum balance required to start a new project
  // (prevents users from starting expensive projects when in debt)
  MIN_BALANCE_FOR_NEW_PROJECT: -5_000,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate credit cost based on input and output tokens
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Total credits to charge
 */
export function calculateCreditCost(
  inputTokens: number,
  outputTokens: number
): number {
  // Simple 1:1 mapping: 1 token = 1 credit
  const totalTokens = inputTokens + outputTokens;
  const credits = totalTokens * CREDIT_PRICING.CREDITS_PER_TOKEN;
  
  // Round up to nearest 0.01 credit
  return Math.ceil(credits * 100) / 100;
}

/**
 * Calculate the actual cost (in USD) we pay for these tokens
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Cost in USD
 */
export function calculateActualCost(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = inputTokens * LLM_COSTS_PER_TOKEN.INPUT;
  const outputCost = outputTokens * LLM_COSTS_PER_TOKEN.OUTPUT;
  return inputCost + outputCost;
}

/**
 * Calculate profit made from a transaction
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Profit in USD
 */
export function calculateProfit(
  inputTokens: number,
  outputTokens: number
): number {
  const credits = calculateCreditCost(inputTokens, outputTokens);
  const revenueUSD = (credits / 10_000) * CREDIT_PRICING.GBP_PER_10K_CREDITS * GBP_TO_USD;
  const costUSD = calculateActualCost(inputTokens, outputTokens);
  return revenueUSD - costUSD;
}

/**
 * Format credits for display
 * @param credits - Number of credits
 * @returns Formatted string (e.g., "10,000" or "10.5K")
 */
export function formatCredits(credits: number): string {
  if (credits >= 1_000_000) {
    return `${(credits / 1_000_000).toFixed(1)}M`;
  }
  if (credits >= 1_000) {
    return `${(credits / 1_000).toFixed(1)}K`;
  }
  return credits.toLocaleString();
}

/**
 * Format GBP price for display
 * @param price - Price in GBP
 * @returns Formatted string (e.g., "£5.00")
 */
export function formatPrice(price: number): string {
  return `£${price.toFixed(2)}`;
}
