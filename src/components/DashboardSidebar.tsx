'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  Gauge,
  Users,
  Menu,
  LogOut,
  PanelRight,
  Lock,
  SheetIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  className?: string;
  onLogout?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function DashboardSidebar({ className, onLogout, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const navGroups = [
    {
      title: "Overview",
      items: [
        {
          title: 'Dashboard',
          href: '/dashboard',
          icon: <Zap className="h-[18px] w-[18px]" />,
          description: 'Lead statistics and summary'
        },
      ]
    },
    {
      title: "Leads Management",
      items: [
        {
          title: 'All Leads',
          href: '/leads',
          icon: <Gauge className="h-[18px] w-[18px]" />,
          description: 'View and manage all cases'
        },
      ]
    },
    {
      title: "Administration",
      items: [
        {
          title: 'User Management',
          href: '/admin',
          icon: <Users className="h-[18px] w-[18px]" />,
          description: 'Manage staff and permissions'
        },
        {
          title: 'Lead Management',
          href: '/admin/leads',
          icon: <SheetIcon className="h-[18px] w-[18px]" />,
          description: 'Manage leads and statuses'
        },
        {
          title: 'Security',
          href: '/security',
          icon: <Lock className="h-[18px] w-[18px]" />,
          description: 'Access and security controls'
        }
      ]
    }
  ];

  const NavItems = () => (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-slate-950",
      isCollapsed ? "px-2 py-6" : "px-4 py-8"
    )}>
      {/* Logo Section */}
      <Link href="/dashboard" className={cn(
        "flex items-center mb-10 transition-all",
        isCollapsed ? "justify-center" : "px-2"
      )}>
        {isCollapsed ? (
          <div className="h-10 w-10 flex items-center justify-center bg-sky-600 rounded-xl shadow-lg shadow-sky-500/20">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <img src="/logo.png" className="h-auto w-44 object-contain" alt="Logo" />
          </div>
        )}
      </Link>

      {/* Navigation Groups */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-8">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              {!isCollapsed && (
                <h2 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {group.title}
                </h2>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={cn(
                        "w-full group relative transition-all duration-200 rounded-xl",
                        isActive 
                          ? "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400" 
                          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900",
                        isCollapsed ? "h-12 w-12 p-0 justify-center" : "justify-start px-3 py-3 h-auto"
                      )}
                      asChild
                      onClick={() => isMobile && setIsOpen(false)}
                    >
                      <Link href={item.href}>
                        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                          <div className={cn(
                            "transition-colors",
                            isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600"
                          )}>
                            {item.icon}
                          </div>
                          {!isCollapsed && (
                            <div className="flex flex-col items-start leading-tight">
                              <span className="text-sm font-bold tracking-tight">{item.title}</span>
                              {isActive && (
                                <span className="text-[10px] opacity-70 font-medium">{item.description}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {isActive && !isCollapsed && (
                          <motion.div 
                            layoutId="active-indicator"
                            className="absolute left-0 w-1 h-6 bg-sky-600 rounded-r-full"
                          />
                        )}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="mt-auto pt-6 space-y-2">
        {!isCollapsed && <Separator className="mb-4 opacity-50" />}
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100",
            isCollapsed ? "h-10 w-10 mx-auto" : "w-full justify-start px-3"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <PanelRight className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
          {!isCollapsed && <span className="ml-3 text-xs font-bold uppercase tracking-widest">Collapse View</span>}
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "rounded-xl transition-all",
            "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20",
            isCollapsed ? "h-10 w-10 p-0 mx-auto" : "w-full justify-start px-3"
          )}
          onClick={onLogout}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Logout</span>}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 z-50 p-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shadow-lg bg-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-none">
            <NavItems />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed hidden lg:block h-screen border-r border-slate-200 dark:border-slate-800 z-30 transition-all duration-300 ease-in-out shadow-sm",
      isCollapsed ? "w-20" : "w-72",
      className
    )}>
      <NavItems />
    </div>
  );
}