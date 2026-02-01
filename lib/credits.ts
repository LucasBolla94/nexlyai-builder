/**
 * CREDIT MANAGEMENT UTILITIES
 * 
 * This file contains helper functions for managing user credits,
 * transactions, and balance updates.
 */

import { prisma } from "@/lib/db";
import { calculateCreditCost, CREDIT_LIMITS } from "@/lib/pricing-config";

/**
 * Get or create a user's credit balance
 */
export async function getCreditBalance(userId: string) {
  let balance = await prisma.creditBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    // Create initial balance with signup bonus
    balance = await prisma.creditBalance.create({
      data: {
        userId,
        balance: 10000, // 10k signup bonus
        lifetimeEarned: 10000,
      },
    });

    // Record the signup bonus transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: "bonus",
        amount: 10000,
        description: "Welcome bonus - 10,000 credits",
      },
    });
  }

  return balance;
}

/**
 * Add credits to a user's balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "purchase" | "bonus" | "refund",
  description: string,
  metadata?: Record<string, any>
) {
  const balance = await getCreditBalance(userId);

  const updatedBalance = await prisma.creditBalance.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      lifetimeEarned: { increment: amount },
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId,
      type,
      amount,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  return updatedBalance;
}

/**
 * Deduct credits from a user's balance
 * Allows negative balance up to CREDIT_LIMITS.MAX_NEGATIVE_BALANCE
 * @throws Error if credit limit exceeded
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>
) {
  const balance = await getCreditBalance(userId);
  const newBalance = balance.balance - amount;

  // Check if new balance would exceed the negative limit
  if (newBalance < CREDIT_LIMITS.MAX_NEGATIVE_BALANCE) {
    throw new Error(
      `Credit limit exceeded. Your balance would be ${newBalance.toFixed(0)} credits, ` +
      `but the minimum allowed is ${CREDIT_LIMITS.MAX_NEGATIVE_BALANCE.toFixed(0)} credits. ` +
      `Please add credits to continue.`
    );
  }

  const updatedBalance = await prisma.creditBalance.update({
    where: { userId },
    data: {
      balance: { decrement: amount },
      lifetimeSpent: { increment: amount },
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId,
      type: "usage",
      amount: -amount, // Negative for deductions
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  return updatedBalance;
}

/**
 * Check if user has sufficient credits (considering negative limit)
 */
export async function hasCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  const newBalance = balance.balance - amount;
  return newBalance >= CREDIT_LIMITS.MAX_NEGATIVE_BALANCE;
}

/**
 * Check if user can start a new project (stricter limit)
 */
export async function canStartProject(userId: string): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance.balance >= CREDIT_LIMITS.MIN_BALANCE_FOR_NEW_PROJECT;
}

/**
 * Get user's transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Calculate and deduct credits for a message
 */
export async function chargeForMessage(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  messageId: string
) {
  const creditCost = calculateCreditCost(inputTokens, outputTokens);
  
  await deductCredits(
    userId,
    creditCost,
    `AI message (${inputTokens + outputTokens} tokens)`,
    {
      messageId,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    }
  );

  return creditCost;
}
