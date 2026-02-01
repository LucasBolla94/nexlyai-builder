import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stopDevServer } from "@/lib/project-scaffolder";
import { getOrCreatePrismaUser } from "@/lib/supabaseAuth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getOrCreatePrismaUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const success = await stopDevServer(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to stop dev server" }, { status: 500 });
    }

    const updatedProject = await prisma.project.findUnique({ where: { id } });
    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error("Error stopping dev server:", error);
    return NextResponse.json({ error: "Failed to stop dev server" }, { status: 500 });
  }
}
