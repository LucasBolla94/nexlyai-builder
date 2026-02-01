"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { supabaseFetch } from "@/lib/supabaseFetch";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError("You must accept the Terms of Service to continue.");
      setIsLoading(false);
      return;
    }

    try {
      const fullName = [formData.firstName, formData.lastName]
        .filter(Boolean)
        .join(" ");

      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: fullName,
            full_name: fullName,
            first_name: formData.firstName,
            last_name: formData.lastName,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Something went wrong");
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        setError(
          "Account created. Please check your email to confirm and then log in."
        );
        setIsLoading(false);
        return;
      }

      await supabaseFetch("/api/auth/sync", { method: "POST" });
      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 p-2">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">Turion</span>
        </Link>

        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-400">
              Start building amazing apps with AI
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-300">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-300">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500">At least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Retype Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="********"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                minLength={8}
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="flex items-start gap-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acceptTerms: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-purple-500/40 bg-black text-purple-500 focus:ring-purple-500"
                  required
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-sm text-gray-300"
                >
                  I agree to the Turion Terms of Service and understand that
                  Turion is an AI LLM + UI Builder platform. I will use the
                  tools responsibly and comply with the usage policies.
                </label>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
                <ShieldCheck className="h-4 w-4" />
                A secure, startup-friendly policy for AI product builders.
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
