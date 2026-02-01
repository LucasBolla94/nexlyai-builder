import { NextResponse } from "next/server";
import { getCreditBalance, getTransactionHistory } from "@/lib/credits";
import { getOrCreatePrismaUser } from "@/lib/supabaseAuth";

// GET /api/credits - Get user's credit balance and recent transactions
export async function GET(request: Request) {
  try {
    const user = await getOrCreatePrismaUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getCreditBalance(user.id);
    const transactions = await getTransactionHistory(user.id, 10);

    return NextResponse.json({
      balance: {
        current: balance.balance,
        lifetimeEarned: balance.lifetimeEarned,
        lifetimeSpent: balance.lifetimeSpent,
      },
      recentTransactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
