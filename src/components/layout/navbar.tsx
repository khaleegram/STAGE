'use client';

import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from './theme-provider';
import Image from 'next/image';
import { useSidebar } from '../ui/sidebar';
import { Button } from '../ui/button';

const user = {
  firstName: 'John',
  profilePicture: 'https://placehold.co/100x100.png',
};

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-cream dark:bg-black/80 backdrop-blur-sm border-b border-gray-300 dark:border-gray-700">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
           {/* This button is only visible on mobile to toggle the sidebar */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="text-primary" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
           <h1 className="text-xl font-bold tracking-tight hidden sm:block">Al-Qalam Scheduler</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden sm:inline text-black dark:text-white">{user.firstName}</span>
          <Image
            src={user.profilePicture}
            alt="User"
            width={32}
            height={32}
            className="rounded-full object-cover"
            data-ai-hint="person avatar"
          />
          <Button onClick={toggleTheme} variant="ghost" size="icon">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-black dark:text-white" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-black dark:text-white" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
