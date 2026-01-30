import { Suspense } from 'react';
import { Loader2, Zap } from 'lucide-react';
import LoginClient from '@/components/loginClient';

// Update metadata to reflect the new brand name
export const metadata = { 
  title: 'Sign In | Velocity CRM',
  description: 'Access your high-performance sales dashboard.' 
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#fafafa] dark:bg-slate-950">
        <div className="relative flex items-center justify-center">
          {/* Subtle pulse effect for the loading state */}
          <div className="absolute h-12 w-12 animate-ping rounded-full bg-sky-500/20" />
          <Zap className="h-8 w-8 text-sky-600 animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Initializing Velocity...
        </p>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}