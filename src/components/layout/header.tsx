'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header({ title }: { title: string }) {
  return (
    <header className="p-4 border-b flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur z-10">
      <SidebarTrigger/>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </header>
  );
}
