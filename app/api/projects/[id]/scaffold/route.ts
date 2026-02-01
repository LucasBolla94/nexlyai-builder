import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scaffoldProject } from "@/lib/project-scaffolder";
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

    if (project.projectPath) {
      return NextResponse.json(
        { error: "Project already scaffolded", project },
        { status: 400 }
      );
    }

    scaffoldProject({
      projectId: project.id,
      projectName: project.name,
      projectType: project.projectType as any,
      userId: user.id,
    })
      .then((result) => {
        console.log(`Scaffold completed:`, result);
      })
      .catch((error) => {
        console.error(`Scaffold failed:`, error);
      });

    return NextResponse.json({
      success: true,
      message: "Scaffolding started",
      projectId: project.id,
    });
  } catch (error) {
    console.error("Error scaffolding project:", error);
    return NextResponse.json({ error: "Failed to scaffold project" }, { status: 500 });
  }
}
