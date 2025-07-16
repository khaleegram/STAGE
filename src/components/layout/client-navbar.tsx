'use client';

import { useSidebar } from '@/components/ui/sidebar';
import Navbar from '@/components/layout/navbar';

const ClientNavbar = () => {
    const { isMobile, onToggleSidebar } = useSidebar();
    return <Navbar />;
};

export default ClientNavbar;
