
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className={cn(
        "flex-1 overflow-auto",
        isMobile ? "p-2" : "p-6"
      )}>
        {children || <Outlet />}
      </main>
    </div>
  );
};
