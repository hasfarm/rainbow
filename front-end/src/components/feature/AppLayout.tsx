import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background-50 md:bg-background-100">
      <div className="mobile-container md:max-w-none min-h-screen bg-background-50 relative">
        <main className="pb-20 md:pb-0 page-enter">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}