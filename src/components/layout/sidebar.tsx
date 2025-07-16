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
  const [isDataCreationOpen, setIsDataCreationOpen] = useState(pathname.startsWith('/data-creation'));
  const isMobile = useIsMobile();

  const handleLinkClick = (e: React.MouseEvent) => {
    // For desktop view, if sidebar is collapsed, a click should expand it.
    if (!isMobile && !isOpen) {
      e.preventDefault(); // Prevent navigation to allow sidebar to expand first
      setOpen(true);
      return;
    }
    // For mobile view, a click should close the sidebar.
    if (isMobile) {
      setOpen(false);
    }
  };

  const toggleDataCreationMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && !isMobile) {
        setOpen(true);
        setIsDataCreationOpen(true);
        return;
    }
    setIsDataCreationOpen(!isDataCreationOpen);
  }
  
  useEffect(() => {
    setIsDataCreationOpen(pathname.startsWith('/data-creation'));
  }, [pathname]);

  const linkClass = (path: string, exact: boolean = true) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200",
      isActive
        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
        : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
    );
  }
  
  const dataCreationLinkClass = (path: string) => {
    const isActive = pathname === path;
     return cn(
      "flex items-center gap-3 pl-4 pr-2 py-2 text-sm rounded-lg transition-colors duration-200",
      isActive
        ? 'text-sidebar-accent-foreground font-semibold'
        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
    );
  }

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/generation', label: 'Generate Timetable', icon: <Sparkles size={20} /> },
    { href: '/timetables', label: 'Timetables', icon: <CalendarDays size={20} /> },
  ];

  const dataCreationItems = [
    { href: '/data-creation/sessions', label: 'Sessions', icon: <Clock size={16} /> },
    { href: '/data-creation/colleges', label: 'Colleges', icon: <Building2 size={16} /> },
    { href: '/data-creation/departments', label: 'Departments', icon: <Library size={16} /> },
    { href: '/data-creation/programs', label: 'Programs', icon: <GraduationCap size={16} /> },
    { href: '/data-creation/levels', label: 'Levels', icon: <Layers size={16} /> },
    { href: '/data-creation/courses', label: 'Courses', icon: <BookOpen size={16} /> },
    { href: '/data-creation/combined-courses', label: 'Combined Courses', icon: <BookCopy size={16} /> },
    { href: '/data-creation/staff', label: 'Staff', icon: <BookUser size={16} /> },
    { href: '/data-creation/venues', label: 'Venues', icon: <MapPin size={16} /> },
  ];

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} onClick={handleLinkClick} className={linkClass(href)}>
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
        "bg-sidebar backdrop-blur-xl border-r border-sidebar-border/50"
      )}
    >
      <div className="p-4 h-16 shrink-0">
         <Link href="/" onClick={toggleSidebar} className={cn("flex items-center gap-2 w-full", !isOpen && "justify-center")}>
            <div className="flex items-center gap-2">
                <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-sidebar-foreground flex-shrink-0"
                >
                    <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
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
            <NavLink key={item.label} {...item} />
          ))}
           <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={toggleDataCreationMenu} className={cn(linkClass('/data-creation', false), "w-full justify-between")}>
                      <div className="flex items-center gap-3">
                          <Database size={20} />
                          <span className={cn("truncate", !isOpen && "sm:hidden")}>Data Creation</span>
                      </div>
                      <ChevronDown size={18} className={cn("transition-transform", !isOpen && "sm:hidden", isDataCreationOpen && "rotate-180")} />
                  </button>
                </TooltipTrigger>
                 {!isOpen && (
                  <TooltipContent side="right" className="bg-background text-foreground">
                    Data Creation
                  </TooltipContent>
                )}
              </Tooltip>
          </li>
          {isDataCreationOpen && (
            <ul className={cn("mt-1 space-y-1 pl-7 transition-all", !isOpen && "sm:hidden")}>
              {dataCreationItems.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} onClick={handleLinkClick} className={dataCreationLinkClass(item.href)}>
                    <div className="w-5">{item.icon}</div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
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
