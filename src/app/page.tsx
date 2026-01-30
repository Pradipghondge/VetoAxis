'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, BarChart3, Users2, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <main className="flex-1">
          {/* Hero Section - Reduced Title Size */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Now powered by Velocity Engine
            </div>
            
            <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:leading-[1.1]">
              Accelerate your sales pipeline with{' '}
              <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
                Velocity CRM
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-base text-muted-foreground md:text-lg">
              The high-performance platform for tracking, managing, and converting leads. 
              Built for speed, engineered for conversion.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
              <Button size="lg" className="h-12 px-8 bg-sky-600 hover:bg-sky-500 shadow-xl shadow-sky-500/20">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}