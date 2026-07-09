import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AuthContext } from '@/hooks/useAuth';

export function AppLayout() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';
  const hideBottomNavOnMobile = isAdmin && location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-background-50 md:bg-background-100">
      <div className="mobile-container md:max-w-none min-h-screen bg-background-50 relative">
        <main className={`${hideBottomNavOnMobile ? 'pb-0' : 'pb-20'} md:pb-0 page-enter`}>
          <Outlet />
        </main>
        {!hideBottomNavOnMobile && <BottomNav />}
      </div>
    </div>
  );
}