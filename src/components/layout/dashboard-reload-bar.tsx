'use client';

import React from 'react';
import Link from 'next/link';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function DashboardReloadBar() {
  const { isSidebarOpen } = useSidebarState();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'hidden sm:flex fixed top-4 z-50 transition-all duration-300',
        isSidebarOpen ? 'left-64' : 'left-20'
      )}
    >
      <div className="relative flex items-center space-x-3 bg-transparent">
        <div className="absolute inset-0 bg-maroon-light-transparent dark:bg-maroon-dark-transparent backdrop-blur-md rounded-r-xl shadow-lg border-b border-gray-300 dark:border-gray-700" />
        
        <Link href="/" passHref>
          <Button
            variant="link"
            className="relative px-4 py-2 rounded-md bg-transparent text-white text-sm font-semibold hover:underline"
          >
            My Dashboard
          </Button>
        </Link>
        
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    onClick={handleReload}
                    variant="ghost"
                    size="icon"
                    className="relative p-2 rounded-md bg-transparent text-white hover:bg-transparent hover:text-yellow-400"
                    aria-label="Reload Page"
                >
                    <RotateCw className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Reload Page</p>
            </TooltipContent>
        </Tooltip>

      </div>
    </div>
  );
}
