import { NavLink } from 'react-router-dom';
import { appNavItems } from './navItems';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

export function DesktopNav() {
  const unreadCount = useUnreadNotifications();

  return (
    <nav className="hidden md:block sticky top-0 z-40 border-b border-background-200/80 bg-background-50/95 backdrop-blur">
      <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground-800">Rainbow HRM</p>

          <div className="flex items-center gap-2">
            {appNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-foreground-500 hover:bg-background-100 hover:text-foreground-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-base leading-none">
                      <i className={item.icon}></i>
                    </span>
                    <span>{item.label}</span>
                    {item.to === '/requests' && unreadCount > 0 && (
                      <span className="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-primary-500" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
