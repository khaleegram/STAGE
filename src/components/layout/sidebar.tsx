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
} from 'lucide-react';
import { Logo } from '@/components/icons/logo';

export function AppSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive tooltip="Dashboard">
              <Link href="/">
                <LayoutDashboard />
                <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Timetables">
              <Link href="#">
                <CalendarDays />
                <span className="group-data-[state=collapsed]:hidden">Timetables</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Faculty">
              <Link href="#">
                <BookUser />
                <span className="group-data-[state=collapsed]:hidden">Faculty</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Students">
              <Link href="#">
                <Users />
                <span className="group-data-[state=collapsed]:hidden">Students</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="#">
                <Settings />
                <span className="group-data-[state=collapsed]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
