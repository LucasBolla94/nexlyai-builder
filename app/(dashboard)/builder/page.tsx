"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Sparkles, Code, Smartphone, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { supabaseClient } from "@/lib/supabaseClient";
import { supabaseFetch } from "@/lib/supabaseFetch";

interface Project {
  id: string;
  name: string;
  projectType: string;
  status: string;
  previewUrl?: string;
  createdAt: string;
}

export default function BuilderPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
      fetchProjects();
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
  }, [router]);

  const fetchProjects = async () => {
    try {
      const response = await supabaseFetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = () => {
    router.push("/builder/new");
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const getProjectIcon = (type: string) => {
    switch (type) {
      case "nextjs":
        return <Globe className="h-5 w-5" />;
      case "react":
        return <Code className="h-5 w-5" />;
      case "react-native":
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Code className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
      case "running":
        return "text-green-400";
      case "generating":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                AI Project Builder
              </h1>
              <p className="text-gray-400">
                Create web and mobile apps with AI assistance
              </p>
            </div>
            <Button
              onClick={handleCreateProject}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Sparkles className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No projects yet
              </h3>
              <p className="text-gray-400 mb-6">
                Start your first AI-generated project
              </p>
              <Button
                onClick={handleCreateProject}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-gray-900 border border-purple-500/20 rounded-lg hover:border-purple-500/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/builder/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        {getProjectIcon(project.projectType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-400 capitalize">
                          {project.projectType}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium capitalize ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                    {project.previewUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(project.previewUrl, "_blank");
                        }}
                      >
                        Preview
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
