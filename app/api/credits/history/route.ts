import { NextResponse } from "next/server";
import { getTransactionHistory } from "@/lib/credits";
import { getOrCreatePrismaUser } from "@/lib/supabaseAuth";

// GET /api/credits/history - Get full transaction history
export async function GET(request: Request) {
  try {
    const user = await getOrCreatePrismaUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const transactions = await getTransactionHistory(user.id, limit);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}
