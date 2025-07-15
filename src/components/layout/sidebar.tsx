'use client';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  BookUser,
  Settings,
  Building,
} from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { usePathname } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/colleges', icon: Building, label: 'Colleges' },
    { href: '#', icon: CalendarDays, label: 'Timetables' },
    { href: '#', icon: BookUser, label: 'Faculty' },
    { href: '#', icon: Users, label: 'Students' },
    { href: '#', icon: Settings, label: 'Settings' },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
