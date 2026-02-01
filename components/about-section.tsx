"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Target, Users, Award } from "lucide-react";

export function AboutSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="about" className="py-20 md:py-32 bg-gradient-to-br from-gray-950 to-black">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">
            About <span className="gradient-text">Turion</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We're on a mission to democratize app development and make it
            accessible to everyone.
          </p>
        </div>

        <div ref={ref} className="space-y-12">
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-start gap-6 p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10"
          >
            <div className="rounded-lg bg-purple-950/50 p-3 flex-shrink-0">
              <Target className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">
                Our Mission
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Turion empowers entrepreneurs, startups, and businesses to bring
                their ideas to life without technical barriers. We believe that
                everyone should have the ability to create professional
                applications, regardless of their coding background.
              </p>
            </div>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row items-start gap-6 p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10"
          >
            <div className="rounded-lg bg-purple-950/50 p-3 flex-shrink-0">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">
                Our Vision
              </h3>
              <p className="text-gray-400 leading-relaxed">
                We envision a future where creating software is as simple as
                describing what you want. By leveraging cutting-edge AI
                technology, we're making this vision a reality, one app at a
                time.
              </p>
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row items-start gap-6 p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10"
          >
            <div className="rounded-lg bg-purple-950/50 p-3 flex-shrink-0">
              <Award className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">
                Our Commitment
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Quality, speed, and innovation drive everything we do. We're
                committed to providing the best AI-powered development experience
                with continuous improvements and exceptional customer support.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
