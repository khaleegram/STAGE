
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  LayoutDashboard,
  Building2,
  Library,
  GraduationCap,
  BookOpen,
  Layers,
  BookCopy,
  BookUser,
  MapPin,
  Clock,
  CalendarDays,
  Settings,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';

const SidebarContent = () => {
  const { open: isOpen, toggleSidebar, setOpen } = useSidebar();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const handleLinkClick = (e: React.MouseEvent) => {
    // For desktop view, if sidebar is collapsed, a click should expand it.
    if (!isMobile && !isOpen) {
      setOpen(true);
      return;
    }
    // For mobile view, a click should close the sidebar.
    if (isMobile) {
      setOpen(false);
    }
  };

  const linkClass = (path: string, exact: boolean = true) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200",
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
        : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
    );
  }

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/generation', label: 'Generate Timetable', icon: <Sparkles size={20} /> },
    { href: '/timetables', label: 'Timetables', icon: <CalendarDays size={20} /> },
    { href: '/data-creation/sessions', label: 'Sessions', icon: <Clock size={20} /> },
    { href: '/data-creation', label: 'Data Creation', icon: <Database size={20} /> },
  ];

  const NavLink = ({ href, label, icon, exact = true }: { href: string; label: string; icon: React.ReactNode; exact?: boolean; }) => (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} onClick={handleLinkClick} className={linkClass(href, exact)}>
            <div className="flex-shrink-0">{icon}</div>
            <span className={cn("truncate", !isOpen && "sm:hidden")}>{label}</span>
          </Link>
        </TooltipTrigger>
        {!isOpen && (
          <TooltipContent side="right" className="bg-background text-foreground">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </li>
  );

  return (
    <div
      data-state={isOpen ? 'open' : 'collapsed'}
      className={cn(
        "h-full flex flex-col group text-sidebar-foreground",
        "bg-black/30 dark:bg-black/50 backdrop-blur-xl border-r border-white/10 shadow-xl"
      )}
    >
      <div className="p-4 h-16 shrink-0">
         <Link
            href="/"
            onClick={handleLinkClick}
            className={cn("flex items-center gap-2 w-full", !isOpen && "justify-center")}
            aria-label="Toggle Sidebar"
          >
            <div className="flex items-center gap-2 text-sidebar-foreground">
                <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                    stroke="currentColor"
                >
                    <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                </svg>
              <span className={cn("font-bold text-lg", !isOpen && "sm:hidden")}>
                Al-Qalam
              </span>
            </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <ul className="space-y-1.5 text-sm font-medium">
          {menuItems.map((item) => (
            <NavLink key={item.label} {...item} exact={item.href !== '/data-creation'} />
          ))}
           
           <div className="px-3 pt-4">
              <div className="border-t border-sidebar-border/50" />
          </div>

           <NavLink href="/settings" label="Settings" icon={<Settings size={20} />} />
        </ul>
      </nav>
    </div>
  );
}


export function AppSidebar() {
  const isMobile = useIsMobile();
  const { open, setOpen } = useSidebar();

  if (isMobile === undefined) {
    return (
      <div className="w-20 sm:w-64 h-screen">
        <Skeleton className="h-full w-full bg-muted" />
      </div>
    );
  }
  
  if (isMobile) {
    return (
        <Sheet open={open} onOpenChange={setOpen}>
           <SheetContent side="left" className="p-0 border-r-0 w-64 bg-transparent">
             <SheetHeader>
                 <SheetTitle className="sr-only">Main Menu</SheetTitle>
             </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
    )
  }

  return (
    <div className={cn(
        "fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out hidden sm:block", 
        open ? 'w-64' : 'w-20'
    )}>
      <SidebarContent />
    </div>
  );
}
