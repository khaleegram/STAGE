'use client'

import { useSidebarState } from "@/hooks/use-sidebar-state";
import { cn } from "@/lib/utils";
import React from "react";

export default function MainContent({ children }: { children: React.ReactNode }) {
    const { isSidebarOpen } = useSidebarState();

    return (
        <main
          className={cn(
            'transition-all duration-300 w-full p-6 pt-16',
            'sm:pt-6 sm:pr-6', // Adjust padding for desktop
            isSidebarOpen ? 'sm:ml-64' : 'sm:ml-20',
            'max-sm:ml-0 max-sm:px-4 max-sm:pt-20'
          )}
        >
          {children}
        </main>
    )
}
