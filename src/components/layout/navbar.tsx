'use client';

import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from './theme-provider';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';

const user = {
  firstName: 'Admin',
  profilePicture: 'https://placehold.co/100x100.png',
};

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-card/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
           {/* This button is only visible on mobile to toggle the sidebar */}
           <Button variant="ghost" size="icon" className="sm:hidden" onClick={toggleSidebar}>
            <Menu />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>

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
