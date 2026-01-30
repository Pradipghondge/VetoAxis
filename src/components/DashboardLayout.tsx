'use client';

import { ReactNode, useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    if (logout) logout();
  };

  return (
    // Use flex-row so Sidebar and Main Content sit side-by-side
    <div className="flex flex-col md:flex-row bg-[#09090b] w-full flex-1 mx-auto overflow-hidden h-screen">
      
      {/* Sidebar - Positioned naturally by flex */}
      <DashboardSidebar 
        onLogout={handleLogout} 
        open={open}
        setOpen={setOpen}
      />

      {/* Main content area - No more lg:ml-72, flex-1 handles the width */}
      <main className="flex flex-1 flex-col w-full h-full overflow-y-auto bg-[#09090b]">
        <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}