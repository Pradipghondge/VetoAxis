'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, 
  Settings, 
  User as UserIcon, 
  Bell, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

export default function DashboardHeader() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        
        {/* Left Side: Contextual Indicator (Visible only on desktop usually) */}
        <div className="hidden lg:flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
             System Encrypted & Active
           </span>
        </div>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center space-x-5">
          
          {/* Activity/Notification Placeholder */}
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-sky-600 rounded-xl">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center gap-3 pl-2 pr-1 h-10 rounded-2xl hover:bg-slate-50 transition-all">
                <div className="flex flex-col items-end text-right hidden sm:flex">
                  <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                    {user?.name || 'Tejas Dhamankar'}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-sky-600">
                    {user?.role === 'super_admin' ? 'Super Systems Admin' : 'Lead Agent'}
                  </span>
                </div>
                <Avatar className="h-8 w-8 rounded-xl border-2 border-white dark:border-slate-800 shadow-sm">
                  <AvatarFallback className="bg-sky-600 text-[10px] font-black text-white uppercase">
                    {user?.name ? user.name.substring(0, 2) : 'TD'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-slate-100 shadow-2xl">
              <DropdownMenuLabel className="px-3 py-4">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black tracking-tight text-slate-900">
                      Account Identity
                    </p>
                    <div className="p-0.5 bg-sky-50 rounded">
                      <Zap className="h-3 w-3 text-sky-600 fill-sky-600" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-400 truncate">
                    {user?.email || 'dhamankartejas14@gmail.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="bg-slate-50" />
              
              <div className="py-1">
                <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer text-xs font-bold text-slate-600 focus:bg-slate-50 focus:text-sky-600">
                  <UserIcon className="mr-3 h-4 w-4" />
                  Security Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer text-xs font-bold text-slate-600 focus:bg-slate-50 focus:text-sky-600">
                  <Settings className="mr-3 h-4 w-4" />
                  System Preferences
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-slate-50" />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="rounded-xl px-3 py-2.5 cursor-pointer text-xs font-black uppercase tracking-widest text-rose-500 focus:bg-rose-50 focus:text-rose-600"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Kill Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}