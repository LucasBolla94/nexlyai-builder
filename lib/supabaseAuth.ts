import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { prisma } from "@/lib/db";

export async function getSupabaseUserFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user;
}

export async function getOrCreatePrismaUser(req: Request) {
  const supabaseUser = await getSupabaseUserFromRequest(req);
  if (!supabaseUser?.id || !supabaseUser.email) return null;

  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  if (existingUser) return existingUser;

  return prisma.user.create({
    data: {
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      name:
        (supabaseUser.user_metadata as Record<string, unknown>)?.name ??
        (supabaseUser.user_metadata as Record<string, unknown>)?.full_name ??
        null,
    },
  });
}
