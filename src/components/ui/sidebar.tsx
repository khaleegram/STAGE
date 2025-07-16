'use client';

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean | undefined;
  onToggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false); // Default to closed on mobile

  // Set initial state based on device type once it's known
  React.useEffect(() => {
    if (isMobile !== undefined) {
      setOpen(!isMobile);
    }
  }, [isMobile]);

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const onToggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const contextValue = React.useMemo<SidebarContextValue>(
    () => ({
      open,
      setOpen,
      toggleSidebar,
      isMobile,
      onToggleSidebar,
    }),
    [open, toggleSidebar, isMobile, onToggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}
