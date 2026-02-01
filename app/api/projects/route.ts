import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canStartProject } from "@/lib/credits";
import { ProjectType } from "@/lib/types";
import { getOrCreatePrismaUser } from "@/lib/supabaseAuth";

// GET /api/projects - Get all user projects
export async function GET(request: Request) {
  try {
    const user = await getOrCreatePrismaUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        buildSteps: {
          orderBy: { step: "asc" },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const user = await getOrCreatePrismaUser(request);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can start a new project (credit limit check)
    const canStart = await canStartProject(user.id);
    if (!canStart) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message:
            "Your credit balance is too low to start a new project. Please add credits first.",
        },
        { status: 402 }
      );
    }

    const { name, description, projectType } = await request.json();

    if (!name || !projectType) {
      return NextResponse.json(
        { error: "Name and project type are required" },
        { status: 400 }
      );
    }

    // Validate project type
    const validTypes: ProjectType[] = ["nextjs", "react", "react-native"];
    if (!validTypes.includes(projectType as ProjectType)) {
      return NextResponse.json(
        { error: "Invalid project type" },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        description,
        projectType,
        status: "planning",
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
