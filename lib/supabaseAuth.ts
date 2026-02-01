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

  if (existingUser) {
    const metadata = (supabaseUser.user_metadata || {}) as Record<
      string,
      unknown
    >;
    const firstName =
      typeof metadata.first_name === "string" ? metadata.first_name : null;
    const lastName =
      typeof metadata.last_name === "string" ? metadata.last_name : null;
    const fullName =
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.name === "string"
        ? metadata.name
        : [firstName, lastName].filter(Boolean).join(" ") || null;
    const termsAcceptedAt =
      typeof metadata.terms_accepted_at === "string"
        ? new Date(metadata.terms_accepted_at)
        : null;

    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: fullName ?? existingUser.name,
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
        termsAcceptedAt:
          termsAcceptedAt instanceof Date && !isNaN(termsAcceptedAt.getTime())
            ? termsAcceptedAt
            : existingUser.termsAcceptedAt,
      },
    });
  }

  const metadata = (supabaseUser.user_metadata || {}) as Record<
    string,
    unknown
  >;
  const firstName =
    typeof metadata.first_name === "string" ? metadata.first_name : null;
  const lastName =
    typeof metadata.last_name === "string" ? metadata.last_name : null;
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
      ? metadata.name
      : [firstName, lastName].filter(Boolean).join(" ") || null;
  const termsAcceptedAt =
    typeof metadata.terms_accepted_at === "string"
      ? new Date(metadata.terms_accepted_at)
      : null;

  return prisma.user.create({
    data: {
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      name: fullName,
      firstName,
      lastName,
      termsAcceptedAt:
        termsAcceptedAt instanceof Date && !isNaN(termsAcceptedAt.getTime())
          ? termsAcceptedAt
          : null,
    },
  });
}
