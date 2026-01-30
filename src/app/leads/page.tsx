import { Suspense } from 'react';
import { Loader2, Zap } from 'lucide-react';
import ClientLeads from '@/components/clientLeads';

export const metadata = {
  title: 'Lead Terminal | Velocity CRM',
  description: 'High-density lead management and outreach protocol.',
};

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#09090b]">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-[#8b5cf6]/20" />
            <Zap className="h-10 w-10 text-[#8b5cf6] animate-pulse fill-[#8b5cf6]/20" />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
            Loading Lead Database...
          </p>
        </div>
      }
    >
      <ClientLeads />
    </Suspense>
  );
}