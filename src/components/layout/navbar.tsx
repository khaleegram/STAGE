'use client';

import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from './theme-provider';
import Image from 'next/image';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';

const user = {
  firstName: 'Admin',
  profilePicture: 'https://placehold.co/100x100.png',
};

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { isMobile, onToggleSidebar } = useSidebar();


  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const baseClasses = "bg-cream/80 dark:bg-black/20 text-black dark:text-white rounded-2xl shadow-lg border-b border-gray-300/50 dark:border-gray-700/50 h-12 px-4 flex items-center space-x-4 backdrop-blur-md";

  if (isMobile) {
    return (
        <header className="sticky top-0 z-40 w-full bg-card/80 backdrop-blur-sm border-b">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Button variant="ghost" size="icon" className="sm:hidden" onClick={onToggleSidebar}>
                    <Menu />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
                 <div className="flex items-center gap-4">
                    <span className="text-sm font-medium hidden sm:inline">{user.firstName}</span>
                    <Image
                        src={user.profilePicture}
                        alt="User"
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                        data-ai-hint="person avatar"
                    />
                    <Button onClick={toggleTheme} variant="ghost" size="icon" className="rounded-full">
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>
            </div>
      </header>
    );
  }

  // Desktop Navbar
  return (
    <div className={cn("fixed top-4 right-4 z-50", baseClasses)}>
        <div className="flex items-center gap-2 p-1">
          <span className="text-sm font-medium pl-2">{user.firstName}</span>
          <Image
            src={user.profilePicture}
            alt="User"
            width={32}
            height={32}
            className="rounded-full object-cover"
            data-ai-hint="person avatar"
          />
          <Button onClick={toggleTheme} variant="ghost" size="icon" className="rounded-full">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
    </div>
  );
}
