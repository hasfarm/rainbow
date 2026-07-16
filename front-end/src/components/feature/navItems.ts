export type NavItem = {
  to: string;
  icon: string;
  label: string;
};

export const appNavItems: NavItem[] = [
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
