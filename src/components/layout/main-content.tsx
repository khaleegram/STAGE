'use client'

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import React from "react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export default function MainContent({ children }: { children: React.ReactNode }) {
    const { open: isSidebarOpen } = useSidebar();
    const scrollDirection = useScrollDirection();

    return (
        <main
          className={cn(
            'transition-all duration-300',
            scrollDirection === 'down' ? 'sm:pt-6' : 'sm:pt-24',
            'sm:px-6',
            isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20',
            'max-sm:ml-0 max-sm:px-4 max-sm:pt-20'
          )}
        >
          {children}
        </main>
    )
}
