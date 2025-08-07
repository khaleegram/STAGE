
'use client';

import React from 'react';
import { Moon, Sun, Menu, LogOut, Settings } from 'lucide-react';
import { useTheme } from './theme-provider';
import Image from 'next/image';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { isMobile, onToggleSidebar } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const baseClasses = "bg-cream/80 dark:bg-black/20 text-black dark:text-white rounded-2xl shadow-lg border-b border-gray-300/50 dark:border-gray-700/50 h-12 px-4 flex items-center space-x-4 backdrop-blur-md";

  const UserMenu = () => (
    <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" className="relative h-12 w-12 rounded-full overflow-hidden p-0">
  <Image
    src={user?.photoURL || 'https://placehold.co/100x100.png'}
    alt="User"
    fill
    className="object-cover rounded-full"
    data-ai-hint="person avatar"
  />
</Button>

  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" align="end" forceMount>
    <DropdownMenuLabel className="font-normal">
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium leading-none">
          {user?.displayName?.split(' ')[0] || 'User'}
        </p>
        <p className="text-xs leading-none text-muted-foreground">
          {user?.email}
        </p>
      </div>
    </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );


  if (isMobile) {
    return (
        <header className="sticky top-0 z-40 w-full bg-card/80 backdrop-blur-sm border-b">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Button variant="ghost" size="icon" className="sm:hidden" onClick={onToggleSidebar}>
                    <Menu />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
                 <div className="flex items-center gap-2">
                    <Button onClick={toggleTheme} variant="ghost" size="icon" className="rounded-full">
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    <UserMenu />
                </div>
            </div>
      </header>
    );
  }

  // Desktop Navbar
  return (
    <div className={cn("fixed top-4 right-4 z-50", baseClasses)}>
        <div className="flex items-center gap-2 p-1">
          <Button onClick={toggleTheme} variant="ghost" size="icon" className="rounded-full">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <UserMenu />
        </div>
    </div>
  );
}
