import { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AuthContext } from '@/hooks/useAuth';
import { DesktopNav } from './DesktopNav';

export function AppLayout() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';
  const hideAppNavigation = isAdmin && location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-background-50 md:bg-background-100">
      <div className="mobile-container md:max-w-none min-h-screen bg-background-50 relative">
        {!hideAppNavigation && <DesktopNav />}
        <main className={`${hideAppNavigation ? 'pb-0' : 'pb-20'} md:pb-8 page-enter`}>
          <Outlet />
        </main>
        {!hideAppNavigation && <BottomNav />}
      </div>
    </div>
  );
}