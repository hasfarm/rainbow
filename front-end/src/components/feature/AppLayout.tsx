import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background-50">
      <div className="mobile-container min-h-screen bg-background-50 relative">
        <main className="pb-20 page-enter">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}