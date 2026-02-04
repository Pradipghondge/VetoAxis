'use client';

import { ReactNode } from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children, hideSidebar }: { children: ReactNode, hideSidebar?: boolean }) {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Synchronizing identity...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* This is your new shadcn sidebar replacing the old one */}
        {!hideSidebar && <AppSidebar />}

        <SidebarInset className="flex flex-col bg-background overflow-x-hidden">
          {/* SiteHeader handles the Top Bar and Breadcrumbs */}
          <SiteHeader />

          <main className="flex flex-1 flex-col w-full min-w-0 h-full overflow-y-auto overflow-x-hidden bg-background">
            <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto overflow-hidden">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}