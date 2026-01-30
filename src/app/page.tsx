'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, BarChart3, Users2, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    // Background updated to your Midnight Indigo (#09090b)
    <div className="flex min-h-screen flex-col bg-[#09090b] text-white font-sans selection:bg-violet-500/30">
      <main className="flex-1 relative">
        {/* Animated Background Glow - Adds that "Premium" feel */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-violet-600/10 blur-[120px] pointer-events-none" />

        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container relative z-10 mx-auto px-4 text-center">
            
            <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:leading-[1.1] text-white">
              Accelerate your sales pipeline with{' '}
              {/* Gradient updated to your Electric Violet & Emerald theme */}
              <span className="bg-gradient-to-r from-[#8b5cf6] to-[#10b981] bg-clip-text text-transparent">
                Velocity CRM
              </span>
            </h1>
            
            <p className="mt-8 max-w-2xl mx-auto text-base text-neutral-400 md:text-xl leading-relaxed">
              The high-performance platform for tracking, managing, and converting leads. 
              Built for speed, engineered for conversion.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link href="/login">
                {/* Button updated to Violet with a custom glow */}
                <Button size="lg" className="h-14 px-10 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-lg font-semibold rounded-2xl transition-all duration-300 shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] border-t border-white/20">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Subtle grid background to add texture */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          </div>
        </section>
      </main>
    </div>
  );
}