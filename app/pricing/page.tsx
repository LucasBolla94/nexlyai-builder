"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const plans = [
  {
    name: "Starter",
    price: "£7",
    period: "/month",
    description: "Perfect for individuals and small projects",
    features: [
      "5 AI-generated apps per month",
      "Basic templates",
      "Community support",
      "Standard deployment",
      "Code export",
    ],
    cta: "Start Building",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "£20",
    period: "/month + VAT",
    description: "For professionals and growing businesses",
    features: [
      "Unlimited AI-generated apps",
      "Premium templates",
      "Priority support",
      "Advanced deployment options",
      "Code export & ownership",
      "Custom branding",
      "API access",
      "Team collaboration",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
];

export default function PricingPage() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="gradient-bg py-20 md:py-32">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              Simple, <span className="gradient-text">Transparent Pricing</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Start free, upgrade anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-black">
        <div className="container mx-auto max-w-7xl px-4">
          <div
            ref={ref}
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  className={`relative h-full p-8 rounded-lg border transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-br from-purple-950/50 to-gray-950 border-purple-500 shadow-lg shadow-purple-500/20"
                      : "bg-gradient-to-br from-gray-900 to-gray-950 border-white/10 hover:border-purple-500/50"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-sm font-semibold text-white">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {plan.name}
                      </h3>
                      <p className="text-gray-400 mt-2">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline space-x-1">
                      <span className="text-5xl font-bold gradient-text">
                        {plan.price}
                      </span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link href="/signup" className="block">
                      <Button
                        className={`w-full ${
                          plan.highlighted
                            ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white glow-purple"
                            : "bg-white/10 hover:bg-white/20 text-white"
                        }`}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <div className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-400">
                  Yes! You can upgrade or downgrade your plan at any time. Changes
                  take effect immediately.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-400">
                  We accept all major credit cards and debit cards. All payments
                  are processed securely.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-400">
                  Yes! You can try NexlyAI free for 7 days with full access to all
                  features. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
