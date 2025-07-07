
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, MessageSquare, Settings, QrCode, GraduationCap, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      path: '/',
    },
    {
      title: 'Leads',
      icon: Users,
      path: '/leads',
    },
    {
      title: 'Mensagens',
      icon: MessageSquare,
      path: '/messages',
    },
    {
      title: 'QR Code',
      icon: QrCode,
      path: '/qr-code',
    },
    {
      title: 'Configurações',
      icon: Settings,
      path: '/settings',
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo/Header */}
      <div className="flex items-center justify-center h-16 border-b border-border px-4">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">CESMAC</span>
              <span className="text-xs text-muted-foreground">Lead Manager</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start h-12',
                  collapsed && !isMobile ? 'px-3' : 'px-4',
                  isActive && 'bg-primary text-primary-foreground'
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className={cn('h-5 w-5', (collapsed && !isMobile) ? '' : 'mr-3')} />
                {(!collapsed || isMobile) && <span>{item.title}</span>}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {(!collapsed || isMobile) && (
          <div className="text-xs text-muted-foreground">
            <p>CESMAC Lead Manager</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </>
  );

  // Mobile view with Sheet
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full bg-card text-sidebar-foreground">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view
  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
