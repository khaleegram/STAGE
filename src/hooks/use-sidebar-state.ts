import * as React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export function useSidebarState() {
  const { open } = useSidebar();
  return { isSidebarOpen: open };
}
