
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
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
  Users,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';

const SidebarContent = () => {
  const { open: isOpen, toggleSidebar, setOpen } = useSidebar();
  const pathname = usePathname();
  const [isDataCreationOpen, setIsDataCreationOpen] = useState(pathname.startsWith('/data-creation'));

  const handleLinkClick = () => {
    const isMobile = window.innerWidth < 768;
    if(isMobile) {
      setOpen(false);
    }
  };

  const toggleDataCreationMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDataCreationOpen(!isDataCreationOpen);
  }

  const linkClass = (path: string, exact: boolean = true) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200",
      isActive
        ? 'bg-primary/20 text-primary'
        : 'text-white hover:bg-cream/10 hover:text-primary'
    );
  }
  
  const dataCreationLinkClass = (path: string) => {
    const isActive = pathname === path;
     return cn(
      "flex items-center gap-3 pl-4 pr-2 py-2 text-sm rounded-lg transition-colors duration-200",
      isActive
        ? 'bg-primary/20 text-primary'
        : 'text-gray-300 hover:bg-cream/10 hover:text-primary'
    );
  }

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/generation', label: 'Generate Timetable', icon: <Sparkles size={18} /> },
    { href: '/timetables', label: 'Timetables', icon: <CalendarDays size={18} /> },
  ];

  const dataCreationItems = [
    { href: '/data-creation/sessions', label: 'Sessions', icon: <Clock size={18} /> },
    { href: '/data-creation/colleges', label: 'Colleges', icon: <Building2 size={18} /> },
    { href: '/data-creation/departments', label: 'Departments', icon: <Library size={18} /> },
    { href: '/data-creation/programs', label: 'Programs', icon: <GraduationCap size={18} /> },
    { href: '/data-creation/levels', label: 'Levels', icon: <Layers size={18} /> },
    { href: '/data-creation/courses', label: 'Courses', icon: <BookOpen size={18} /> },
    { href: '/data-creation/combined-courses', label: 'Combined Courses', icon: <BookCopy size={18} /> },
    { href: '/data-creation/staff', label: 'Staff', icon: <BookUser size={18} /> },
    { href: '/data-creation/venues', label: 'Venues', icon: <MapPin size={18} /> },
  ];

  return (
    <div
      data-state={isOpen ? 'open' : 'collapsed'}
      className={cn(
        `h-full bg-sidebar flex flex-col transition-all duration-300 ease-in-out group`
      )}
    >
      <div className="flex items-center justify-between p-4 h-16">
        <Link href="/" className={cn("flex items-center gap-2", !isOpen && "w-full justify-center")}>
            <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary flex-shrink-0"
            >
                <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
            </svg>
          <span className={cn("font-bold text-lg text-sidebar-foreground", !isOpen && "hidden")}>
            Al-Qalam
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <ul className="space-y-1.5 text-sm font-medium">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href} onClick={handleLinkClick} className={linkClass(item.href)}>
                <div className="flex-shrink-0">{item.icon}</div>
                <span className="truncate group-data-[state=collapsed]:hidden">{item.label}</span>
              </Link>
            </li>
          ))}
           <li>
              <button onClick={toggleDataCreationMenu} className={cn(linkClass('/data-creation', false), "w-full justify-between")}>
                  <div className="flex items-center gap-3">
                      <Database size={18} />
                      <span className="truncate group-data-[state=collapsed]:hidden">Data Creation</span>
                  </div>
                  <ChevronDown size={18} className={cn("transition-transform group-data-[state=collapsed]:hidden", isDataCreationOpen && "rotate-180")} />
              </button>
          </li>
          {isDataCreationOpen && (
            <ul className="mt-1 space-y-1 pl-5 group-data-[state=collapsed]:hidden">
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

           <li>
              <Link href="#" onClick={handleLinkClick} className={linkClass('/#settings', false)}>
                <div className="flex-shrink-0"><Settings size={18} /></div>
                <span className="truncate group-data-[state=collapsed]:hidden">Settings</span>
              </Link>
            </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border h-16 flex items-center justify-center">
        <Button variant="ghost" onClick={toggleSidebar} className="text-sidebar-foreground hover:text-primary hidden md:flex">
          <Menu size={24} />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>
    </div>
  );
}


export function AppSidebar() {
  const isMobile = useIsMobile();
  const { open, setOpen } = useSidebar();

  if (isMobile === undefined) {
    return (
      <div className="w-20 md:w-64 h-screen">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  if (isMobile) {
    return (
      <header className="sm:hidden fixed top-0 left-0 w-full z-40 flex items-center justify-between bg-sidebar px-4 py-3 shadow-lg">
        <Link href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-lg text-sidebar-foreground">Al-Qalam</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="text-sidebar-foreground" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-64 bg-transparent">
            <SheetHeader>
                <SheetTitle className="sr-only">Main Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>
    )
  }

  // Desktop sidebar
  return (
    <div className={cn("fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out", open ? 'w-64' : 'w-20')}>
      <SidebarContent />
    </div>
  );
}
