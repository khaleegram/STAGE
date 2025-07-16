
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
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { open: isOpen, toggleSidebar, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const [isDataCreationOpen, setIsDataCreationOpen] = useState(pathname.startsWith('/data-creation'));


  const handleLinkClick = () => {
    // Close mobile sidebar on link click
    if (window.innerWidth < 768) { // md breakpoint
        setOpenMobile(false);
    }
  };

  const toggleDataCreationMenu = () => {
    setIsDataCreationOpen(!isDataCreationOpen);
  }

  const linkClass = (path: string, exact: boolean = true) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200",
      isActive
        ? 'bg-primary/80 text-white'
        : 'text-white hover:bg-white/10'
    );
  }
  
  const dataCreationLinkClass = (path: string) => {
    const isActive = pathname === path;
     return cn(
      "flex items-center gap-3 pl-4 pr-2 py-2 text-sm rounded-lg transition-colors duration-200",
      isActive
        ? 'bg-primary/80 text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
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

  const isDataCreationActive = pathname.startsWith('/data-creation');


  return (
    <>
      <div
        className={`fixed sm:relative top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-20'
        } bg-sidebar-background text-sidebar-foreground flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          <Link href="/" className={cn("flex items-center gap-2", !isOpen && "w-full justify-center")}>
              <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white flex-shrink-0"
              >
                  <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  />
              </svg>
            <span className={cn("font-bold text-lg text-white", !isOpen && "hidden")}>
              Al-Qalam
            </span>
          </Link>

          <button onClick={toggleSidebar} className="text-white hover:text-primary md:hidden">
            <Menu size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          <ul className="space-y-1.5 text-sm font-medium">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link href={item.href} onClick={handleLinkClick} className={linkClass(item.href)}>
                  <div className="flex-shrink-0">{item.icon}</div>
                  {isOpen && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            ))}
             <li>
                <button onClick={toggleDataCreationMenu} className={cn(linkClass('/data-creation', false), "w-full justify-between")}>
                    <div className="flex items-center gap-3">
                        <Database size={18} />
                        {isOpen && <span className="truncate">Data Creation</span>}
                    </div>
                    {isOpen && (
                      <ChevronDown size={18} className={cn("transition-transform", isDataCreationOpen && "rotate-180")} />
                    )}
                </button>
            </li>
            {isOpen && isDataCreationOpen && (
              <ul className="mt-1 space-y-1">
                {dataCreationItems.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} onClick={handleLinkClick} className={dataCreationLinkClass(item.href)}>
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            
             <div className="px-3 pt-4">
                <div className="border-t border-sidebar-border" />
            </div>

             <li>
                <Link href="#" onClick={handleLinkClick} className={linkClass('/#settings', false)}>
                  <div className="flex-shrink-0"><Settings size={18} /></div>
                  {isOpen && <span className="truncate">Settings</span>}
                </Link>
              </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
