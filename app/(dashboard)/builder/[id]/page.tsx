"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Play,
  Square,
  ExternalLink,
  Trash2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabaseClient } from "@/lib/supabaseClient";
import { supabaseFetch } from "@/lib/supabaseFetch";

interface BuildStep {
  id: string;
  step: number;
  title: string;
  status: string;
  completedAt?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  projectType: string;
  status: string;
  previewUrl?: string;
  subdomain?: string;
  buildSteps: BuildStep[];
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();

      if (!isActive) return;

      if (error || !data.session) {
        router.push("/login");
        return;
      }

      setIsAuthLoading(false);
      if (projectId) {
        fetchProject();
        const interval = setInterval(fetchProject, 3000);
        return () => clearInterval(interval);
      }
    };

    loadSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.push("/login");
        }
      }
    );

    return () => {
      isActive = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [projectId, router]);

  const fetchProject = async () => {
    try {
      const response = await supabaseFetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScaffold = async () => {
    setIsScaffolding(true);
    try {
      const response = await supabaseFetch(`/api/projects/${projectId}/scaffold`, {
        method: "POST",
      });
      if (response.ok) {
        setTimeout(fetchProject, 2000);
      }
    } catch (error) {
      console.error("Error scaffolding project:", error);
    } finally {
      setIsScaffolding(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const response = await supabaseFetch(`/api/projects/${projectId}/start`, {
        method: "POST",
      });
      if (response.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error("Error starting server:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const response = await supabaseFetch(`/api/projects/${projectId}/stop`, {
        method: "POST",
      });
      if (response.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error("Error stopping server:", error);
    } finally {
      setIsStopping(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Project not found</p>
          <Button onClick={() => router.push("/builder")}>Back to Builder</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
      case "running":
        return "text-green-400 bg-green-400/20";
      case "generating":
        return "text-yellow-400 bg-yellow-400/20";
      case "error":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/builder")}
            className="mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-gray-400">{project.description}</p>
                )}
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status}
              </span>
            </div>

            <div className="flex gap-4">
              {project.status === "planning" && (
                <Button
                  onClick={handleScaffold}
                  disabled={isScaffolding}
                  className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                >
                  {isScaffolding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Project
                    </>
                  )}
                </Button>
              )}

              {project.status === "ready" && (
                <Button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Preview
                    </>
                  )}
                </Button>
              )}

              {project.status === "running" && (
                <>
                  <Button
                    onClick={handleStop}
                    disabled={isStopping}
                    variant="outline"
                  >
                    {isStopping ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Stopping...
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Stop Preview
                      </>
                    )}
                  </Button>
                  {project.previewUrl && (
                    <Button
                      onClick={() => window.open(project.previewUrl, "_blank")}
                      className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Preview
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {project.buildSteps && project.buildSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gray-900 border border-purple-500/20 rounded-lg"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Build Progress
              </h2>
              <div className="space-y-3">
                {project.buildSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-4 p-3 bg-black/50 rounded-lg"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === "completed"
                          ? "bg-green-600"
                          : step.status === "in_progress"
                          ? "bg-yellow-600 animate-pulse"
                          : step.status === "failed"
                          ? "bg-red-600"
                          : "bg-gray-600"
                      }`}
                    >
                      <span className="text-white text-sm">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{step.title}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {step.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {project.previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-gray-900 border border-purple-500/20 rounded-lg"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Preview Information
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">URL:</span>
                  <a
                    href={project.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 ml-2"
                  >
                    {project.previewUrl}
                  </a>
                </div>
                {project.subdomain && (
                  <div>
                    <span className="text-gray-400">Subdomain:</span>
                    <span className="text-white ml-2">{project.subdomain}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
