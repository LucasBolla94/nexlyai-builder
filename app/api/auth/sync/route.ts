import { NextResponse } from "next/server";
import { getOrCreatePrismaUser } from "@/lib/supabaseAuth";

export async function POST(req: Request) {
  try {
    const user = await getOrCreatePrismaUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
