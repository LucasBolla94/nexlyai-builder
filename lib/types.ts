/**
 * TYPE DEFINITIONS FOR NEXLYAI
 */

// Project Builder Types
export type ProjectType = "nextjs" | "react" | "react-native";
export type ProjectStatus = "planning" | "generating" | "ready" | "running" | "error" | "stopped";
export type ProjectPhase = "discovery" | "planning" | "generation" | "ready";
export type BuildStepStatus = "pending" | "in_progress" | "completed" | "failed";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  projectType: ProjectType;
  status: ProjectStatus;
  subdomain?: string;
  port?: number;
  previewUrl?: string;
  projectPath?: string;
  gitRepo?: string;
  conversationSummary?: string;
  techStack?: string;
  requirements?: string;
  tokensUsed: number;
  creditCost: number;
  errorLog?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
}

export interface BuildStep {
  id: string;
  projectId: string;
  step: number;
  title: string;
  description?: string;
  status: BuildStepStatus;
  output?: string;
  tokensUsed: number;
  creditCost: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProjectGenerationRequest {
  userId: string;
  projectType: ProjectType;
  requirements: string;
  techStack?: string[];
  phase: ProjectPhase;
}

export interface BuildProgress {
  projectId: string;
  currentStep: number;
  totalSteps: number;
  status: ProjectStatus;
  steps: BuildStep[];
  estimatedTimeRemaining?: number;
}
