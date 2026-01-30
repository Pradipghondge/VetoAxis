'use client';

import { ReactNode, useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout } = useAuth();
  // Lift the state here so the layout knows how much margin to apply
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    if (logout) logout();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Pass state and setter as props */}
      <DashboardSidebar 
        onLogout={handleLogout} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        // Match the margins to the sidebar widths precisely
        isCollapsed ? "lg:ml-20" : "lg:ml-72"
      )}>
        <main className="flex-1 p-4 lg:p-10 pt-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}