import { NavLink } from 'react-router-dom';

export type AdminSidebarItem = {
  label: string;
  icon: string;
  to: string;
  end?: boolean;
};

const defaultItems: AdminSidebarItem[] = [
  { label: 'Dashboard', icon: 'ri-dashboard-line', to: '/dashboard', end: true },
  { label: 'Attendance', icon: 'ri-fingerprint-line', to: '/attendance' },
  { label: 'Employee', icon: 'ri-team-line', to: '/employees' },
  { label: 'Leave', icon: 'ri-calendar-check-line', to: '/leave' },
  { label: 'Payroll', icon: 'ri-bank-card-line', to: '/payslip' },
];

type AdminSidebarProps = {
  items?: AdminSidebarItem[];
  className?: string;
};

export function AdminSidebar({ items = defaultItems, className = '' }: AdminSidebarProps) {
  return (
    <aside className={`bg-gradient-to-b from-background-50 to-background-100 border-r border-background-200 p-4 md:p-5 ${className}`}>
      <div className="mb-7 flex items-center gap-2.5">
        <span className="h-10 w-10 rounded-xl bg-primary-500 text-white flex items-center justify-center">
          <i className="ri-sparkling-2-fill text-xl"></i>
        </span>
        <div>
          <p className="text-lg font-heading font-bold text-foreground-900 leading-tight">Rainbow</p>
          <p className="text-xs text-foreground-500">HR Workspace</p>
        </div>
      </div>

      <p className="text-xs font-semibold tracking-wide text-foreground-400 uppercase mb-3">Menu</p>
      <nav className="space-y-1.5">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white shadow-[0_8px_20px_rgba(244,114,65,0.35)]'
                  : 'text-foreground-600 hover:bg-background-100'
              }`
            }
          >
            <i className={`${item.icon} text-lg`}></i>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl bg-background-50 border border-background-200 p-4">
        <p className="text-xs text-foreground-500 mb-1">Help & Support</p>
        <p className="text-sm font-medium text-foreground-800">Need onboarding guide?</p>
        <button className="mt-3 w-full rounded-xl bg-foreground-900 text-background-50 py-2 text-sm font-medium hover:bg-foreground-800 transition-colors">
          Open Docs
        </button>
      </div>
    </aside>
  );
}
