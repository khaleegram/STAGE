'use client';

import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/components/layout/navbar'), { ssr: false });

export default function ClientNavbar() {
  return <Navbar />;
}
