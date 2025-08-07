
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
  Menu,
  Wand2,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Logo } from '../icons/logo';


const SidebarContent = () => {
  const { open: isOpen, toggleSidebar, setOpen } = useSidebar();
  const pathname = usePathname();
  const [isDataCreationOpen, setIsDataCreationOpen] = useState(pathname.startsWith('/data-creation'));

  useEffect(() => {
    // Automatically open the data creation section if the current path is within it
    if (isOpen && pathname.startsWith('/data-creation')) {
        setIsDataCreationOpen(true);
    }
  }, [pathname, isOpen]);

  const handleLinkClick = () => {
    // Always collapse the sidebar on link click if it's open
    if (isOpen) {
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
  ];
  
  const dataCreationLinks = [
    { href: '/data-creation/ai-importer', title: 'AI Smart Importer', icon: <Wand2 size={18} /> },
    { href: '/data-creation/colleges', title: 'Colleges', icon: <Building2 size={18} /> },
    { href: '/data-creation/departments', title: 'Departments', icon: <Library size={18} /> },
    { href: '/data-creation/programs', title: 'Programs', icon: <GraduationCap size={18} /> },
    { href: '/data-creation/levels', title: 'Levels', icon: <Layers size={18} /> },
    { href: '/data-creation/courses', title: 'Courses', icon: <BookOpen size={18} /> },
    { href: '/data-creation/combined-courses', title: 'Combined Courses', icon: <BookCopy size={18} /> },
    { href: '/data-creation/staff', title: 'Staff', icon: <BookUser size={18} /> },
    { href: '/data-creation/venues', title: 'Venues', icon: <MapPin size={18} /> },
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
      <div className="p-4 h-16 shrink-0 flex items-center justify-between">
         <button
            onClick={toggleSidebar}
            className={cn("flex items-center gap-2 w-full text-left", !isOpen && "justify-center")}
            aria-label="Toggle Sidebar"
          >
            <Logo className={cn(!isOpen && 'group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:w-full')}/>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <ul className="space-y-1.5 text-sm font-medium">
          {menuItems.map((item) => (
            <NavLink key={item.label} {...item} exact={item.href !== '/data-creation'} />
          ))}

          <li>
            <Collapsible open={isOpen && isDataCreationOpen} onOpenChange={setIsDataCreationOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                          className={cn(linkClass('/data-creation', false), 'w-full justify-between')}
                          onClick={() => {
                              if (!isOpen) { 
                                  toggleSidebar();
                                  setIsDataCreationOpen(true);
                              } else {
                                  setIsDataCreationOpen((prev) => !prev)
                              }
                          }}
                      >
                        <div className="flex items-center gap-3">
                          <Database size={20} />
                          <span className={cn("truncate", !isOpen && "sm:hidden")}>Data Creation</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", !isOpen && "sm:hidden", isDataCreationOpen && "rotate-180")} />
                      </button>
                  </TooltipTrigger>
                   {!isOpen && (
                      <TooltipContent side="right" className="bg-background text-foreground">
                          Data Creation
                      </TooltipContent>
                   )}
                </Tooltip>
               <CollapsibleContent className="py-1 pl-7 pr-2 space-y-1.5 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  {dataCreationLinks.map(link => (
                      <Link key={link.href} href={link.href} onClick={handleLinkClick} className={cn(linkClass(link.href), pathname.startsWith(link.href) && 'bg-sidebar-accent/50')}>
                          {link.icon}
                          <span className="truncate">{link.title}</span>
                      </Link>
                  ))}
               </CollapsibleContent>
            </Collapsible>
           </li>
           
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
