"use client";

import { Code2, Zap, Shield, Palette, Cpu, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Generate complete applications in minutes, not days. Our AI understands your requirements instantly.",
  },
  {
    icon: Code2,
    title: "Clean Code",
    description:
      "Production-ready code following best practices. Fully customizable and maintainable.",
  },
  {
    icon: Palette,
    title: "Beautiful Design",
    description:
      "Modern, responsive interfaces that look great on any device. No design skills needed.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Built-in authentication, data encryption, and security best practices from day one.",
  },
  {
    icon: Cpu,
    title: "AI-Powered",
    description:
      "Advanced AI models understand context and generate exactly what you need.",
  },
  {
    icon: Rocket,
    title: "Deploy Instantly",
    description:
      "One-click deployment to production. Get your app live in seconds.",
  },
];

export function FeaturesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="features" className="py-20 md:py-32 bg-black">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">
            Everything You Need to{" "}
            <span className="gradient-text">Build Great Apps</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to help you create professional applications
            without the complexity.
          </p>
        </div>

        {/* Features Grid */}
        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="group h-full p-6 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                  <div className="rounded-lg bg-purple-950/50 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-purple-900/50 transition-colors">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
