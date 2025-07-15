'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Home,
  Users,
  CalendarAlt,
  Database,
  University,
  Building,
  Book,
  ChalkboardTeacher,
  DoorOpen,
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
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export function AppSidebar() {
  const { open: isOpen, toggleSidebar, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close mobile sidebar on link click
    if (window.innerWidth < 768) { // md breakpoint
        setOpenMobile(false);
    }
  };

  const linkClass = (path: string, exact: boolean = true) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-yellow-500/20 text-yellow-400'
        : 'text-white hover:bg-cream/10 hover:text-yellow-400'
    }`;
  }

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/timetables', label: 'Timetables', icon: <CalendarDays size={18} /> },
  ];

  const dataCreationItems = [
    { href: '/data-creation/colleges', label: 'Colleges', icon: <Building2 size={18} /> },
    { href: '/data-creation/departments', label: 'Departments', icon: <Library size={18} /> },
    { href: '/data-creation/programs', label: 'Programs', icon: <GraduationCap size={18} /> },
    { href: '/data-creation/levels', label: 'Levels', icon: <Layers size={18} /> },
    { href: '/data-creation/courses', label: 'Courses', icon: <BookOpen size={18} /> },
    { href: '/data-creation/combined-courses', label: 'Combined Courses', icon: <BookCopy size={18} /> },
    { href: '/data-creation/staff', label: 'Staff', icon: <BookUser size={18} /> },
    { href: '/data-creation/venues', label: 'Venues', icon: <MapPin size={18} /> },
    { href: '/#sessions', label: 'Sessions', icon: <Clock size={18} /> },
    { href: '/#students', label: 'Students', icon: <Users size={18} /> },
    { href: '/#settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const isDataCreationActive = pathname.startsWith('/data-creation');


  return (
    <>
      <div
        className={`fixed sm:relative top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-16'
        } bg-black/30 dark:bg-black/50 backdrop-blur-xl border-r border-white/10 shadow-xl flex flex-col`}
      >
        <div className="flex items-center justify-between p-4">
          <div onClick={toggleSidebar} className="cursor-pointer text-white">
            <Menu size={20} />
          </div>
          {isOpen && (
            <span className="text-xl text-white font-bold tracking-wide">
              AUK
            </span>
          )}
        </div>

        <nav className="px-2 mt-2 flex-1 overflow-y-auto">
          <ul className="space-y-2 text-sm font-medium">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link href={item.href} onClick={handleLinkClick} className={linkClass(item.href)}>
                  {item.icon}
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
             <li>
                <div className={linkClass('/data-creation', false)}>
                    <Database size={18} />
                    {isOpen && <span>Data Creation</span>}
                </div>
            </li>
            {isOpen && (
              <div className="ml-5 mt-2 space-y-2 border-l border-gray-500 pl-4">
                {dataCreationItems.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} onClick={handleLinkClick} className={linkClass(item.href)}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </div>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
