/**
 * PROJECT SCAFFOLDER
 * 
 * Handles automatic project generation using industry-standard tools:
 * - npx create-next-app for Next.js projects
 * - npx create-react-app for React projects  
 * - npx create-expo-app for React Native projects
 */

import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/db";
import { ProjectType } from "@/lib/types";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

// Base directory for all generated projects
const PROJECTS_DIR = "/home/ubuntu/nexly_ai/generated_projects";

// ============================================
// PORT MANAGEMENT
// ============================================

const PORT_RANGE_START = 30000;
const PORT_RANGE_END = 40000;

/**
 * Find an available port for preview
 */
async function findAvailablePort(): Promise<number> {
  // Get all currently used ports
  const usedPorts = await prisma.project.findMany({
    where: {
      port: { not: null },
      status: { in: ["running", "ready"] },
    },
    select: { port: true },
  });

  const usedPortNumbers = usedPorts.map((p) => p.port).filter((p): p is number => p !== null);

  // Find first available port
  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (!usedPortNumbers.includes(port)) {
      return port;
    }
  }

  throw new Error("No available ports in range");
}

/**
 * Generate a unique subdomain for preview
 */
function generateSubdomain(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let subdomain = "proj-";
  for (let i = 0; i < 6; i++) {
    subdomain += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return subdomain;
}

// ============================================
// PROJECT SCAFFOLDING
// ============================================

interface ScaffoldOptions {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
  userId: string;
}

interface ScaffoldResult {
  success: boolean;
  projectPath: string;
  subdomain: string;
  port: number;
  previewUrl: string;
  error?: string;
}

/**
 * Scaffold a new project using appropriate CLI tool
 */
export async function scaffoldProject(
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  const { projectId, projectName, projectType, userId } = options;

  try {
    // Ensure projects directory exists
    await fs.mkdir(PROJECTS_DIR, { recursive: true });

    // Generate unique folder name
    const folderName = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${projectId.substring(0, 8)}`;
    const projectPath = path.join(PROJECTS_DIR, folderName);

    // Get port and subdomain
    const port = await findAvailablePort();
    const subdomain = generateSubdomain();
    const previewUrl = `https://${subdomain}.preview.bolla.network`;

    // Update project with preview info
    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectPath,
        port,
        subdomain,
        previewUrl,
        status: "generating",
      },
    });

    // Record build step
    await createBuildStep(projectId, 1, "Scaffolding project", "in_progress");

    // Execute scaffolding command based on project type
    let scaffoldCommand: string;

    switch (projectType) {
      case "nextjs":
        scaffoldCommand = `npx create-next-app@latest ${projectPath} --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes`;
        break;

      case "react":
        scaffoldCommand = `npx create-react-app ${projectPath} --template typescript`;
        break;

      case "react-native":
        scaffoldCommand = `npx create-expo-app@latest ${projectPath} --template blank-typescript`;
        break;

      default:
        throw new Error(`Unsupported project type: ${projectType}`);
    }

    console.log(`[Scaffold] Running: ${scaffoldCommand}`);
    const { stdout, stderr } = await execAsync(scaffoldCommand, {
      cwd: PROJECTS_DIR,
      timeout: 300000, // 5 minutes timeout
    });

    console.log(`[Scaffold] Output:`, stdout);
    if (stderr) console.error(`[Scaffold] Warnings:`, stderr);

    // Complete build step
    await completeBuildStep(projectId, 1, stdout);

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ready" },
    });

    return {
      success: true,
      projectPath,
      subdomain,
      port,
      previewUrl,
    };
  } catch (error: any) {
    console.error(`[Scaffold] Error:`, error);

    // Mark build step as failed
    await failBuildStep(projectId, 1, error.message);

    // Update project with error
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "error",
        errorLog: error.message,
      },
    });

    return {
      success: false,
      projectPath: "",
      subdomain: "",
      port: 0,
      previewUrl: "",
      error: error.message,
    };
  }
}

// ============================================
// PROJECT OPERATIONS
// ============================================

/**
 * Start the development server for a project
 */
export async function startDevServer(projectId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.projectPath || !project.port) {
      throw new Error("Project not found or missing path/port");
    }

    // Different commands for different project types
    let startCommand: string;

    switch (project.projectType) {
      case "nextjs":
        startCommand = `cd ${project.projectPath} && PORT=${project.port} npm run dev`;
        break;

      case "react":
        startCommand = `cd ${project.projectPath} && PORT=${project.port} BROWSER=none npm start`;
        break;

      case "react-native":
        startCommand = `cd ${project.projectPath} && npx expo start --port ${project.port}`;
        break;

      default:
        throw new Error(`Unsupported project type: ${project.projectType}`);
    }

    console.log(`[Dev Server] Starting: ${startCommand}`);

    // Start server in background
    exec(startCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Dev Server] Error:`, error);
      }
      console.log(`[Dev Server] Output:`, stdout);
      if (stderr) console.error(`[Dev Server] Warnings:`, stderr);
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "running" },
    });

    return true;
  } catch (error: any) {
    console.error(`[Dev Server] Error:`, error);
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "error",
        errorLog: error.message,
      },
    });
    return false;
  }
}

/**
 * Stop the development server
 */
export async function stopDevServer(projectId: string): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.port) {
      throw new Error("Project not found or missing port");
    }

    // Kill process on port
    const killCommand = `lsof -ti:${project.port} | xargs kill -9 || true`;
    await execAsync(killCommand);

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "stopped" },
    });

    return true;
  } catch (error: any) {
    console.error(`[Stop Server] Error:`, error);
    return false;
  }
}

// ============================================
// BUILD STEP HELPERS
// ============================================

async function createBuildStep(
  projectId: string,
  step: number,
  title: string,
  status: "pending" | "in_progress" | "completed" | "failed"
): Promise<void> {
  await prisma.projectBuildStep.create({
    data: {
      projectId,
      step,
      title,
      status,
    },
  });
}

async function completeBuildStep(
  projectId: string,
  step: number,
  output: string
): Promise<void> {
  await prisma.projectBuildStep.updateMany({
    where: { projectId, step },
    data: {
      status: "completed",
      output,
      completedAt: new Date(),
    },
  });
}

async function failBuildStep(
  projectId: string,
  step: number,
  error: string
): Promise<void> {
  await prisma.projectBuildStep.updateMany({
    where: { projectId, step },
    data: {
      status: "failed",
      output: error,
      completedAt: new Date(),
    },
  });
}

// ============================================
// CODE GENERATION
// ============================================

/**
 * Generate custom code for the project using AI
 */
export async function generateProjectCode(
  projectId: string,
  requirements: string,
  techStack: string[]
): Promise<boolean> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.projectPath) {
      throw new Error("Project not found or missing path");
    }

    // Create build step for code generation
    await createBuildStep(projectId, 2, "Generating custom code", "in_progress");

    // This is where we'd use AI to generate specific files
    // For now, we'll use the scaffolded project as-is
    // In a full implementation, this would call the AI to:
    // 1. Generate pages/components
    // 2. Create API routes
    // 3. Set up database models
    // 4. Add styling
    // etc.

    await completeBuildStep(
      projectId,
      2,
      "Code generation completed - using base scaffold"
    );

    return true;
  } catch (error: any) {
    console.error(`[Code Generation] Error:`, error);
    await failBuildStep(projectId, 2, error.message);
    return false;
  }
}
