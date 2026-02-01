"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Globe, Code, Smartphone, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabaseClient } from "@/lib/supabaseClient";
import { supabaseFetch } from "@/lib/supabaseFetch";

export default function NewProjectPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectType: "nextjs",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await supabaseFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/builder/${data.project.id}`);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const projectTypes = [
    {
      id: "nextjs",
      name: "Next.js",
      description: "Full-stack web app",
      icon: Globe,
    },
    {
      id: "react",
      name: "React",
      description: "Single-page web app",
      icon: Code,
    },
    {
      id: "react-native",
      name: "React Native",
      description: "iOS & Android mobile app",
      icon: Smartphone,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-gray-900 border border-purple-500/20 rounded-lg"
          >
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Create New Project
            </h1>
            <p className="text-gray-400 mb-8">
              Tell us about your project idea
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-white">
                  Project Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Awesome App"
                  className="mt-2 bg-black border-purple-500/30 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what your app should do..."
                  className="mt-2 bg-black border-purple-500/30 text-white min-h-[100px]"
                />
              </div>

              <div>
                <Label className="text-white mb-4 block">Project Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.projectType === type.id;

                    return (
                      <div
                        key={type.id}
                        onClick={() =>
                          setFormData({ ...formData, projectType: type.id })
                        }
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-500 bg-purple-600/20"
                            : "border-purple-500/20 hover:border-purple-500/50"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <Icon
                            className={`h-8 w-8 mb-2 ${
                              isSelected ? "text-purple-400" : "text-gray-400"
                            }`}
                          />
                          <h3 className="font-semibold text-white">
                            {type.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !formData.name}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
