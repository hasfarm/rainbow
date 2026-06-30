import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/dashboard',
    icon: 'ri-dashboard-line',
    label: 'Trang chủ',
  },
  {
    to: '/attendance',
    icon: 'ri-fingerprint-line',
    label: 'Chấm công',
  },
  {
    to: '/requests',
    icon: 'ri-file-list-3-line',
    label: 'Thông báo',
  },
  {
    to: '/profile',
    icon: 'ri-user-line',
    label: 'Cá nhân',
  },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background-50 border-t border-background-200/70">
      <div className="mobile-container">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full relative transition-colors duration-200 ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-foreground-400 hover:text-foreground-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                  )}
                  <span className={`w-6 h-6 flex items-center justify-center text-xl ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                    <i className={item.icon}></i>
                  </span>
                  <span className="text-[11px] font-medium whitespace-nowrap">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}