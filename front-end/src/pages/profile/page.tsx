import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { roleLabels } from '@/mocks/users';

export default function ProfilePage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const infoItems = [
    { icon: 'ri-mail-line', label: 'Email', value: user?.email },
    { icon: 'ri-phone-line', label: 'Số điện thoại', value: user?.phone },
    { icon: 'ri-building-line', label: 'Phòng ban', value: user?.department },
    { icon: 'ri-briefcase-line', label: 'Chức vụ', value: user?.position },
    { icon: 'ri-shield-user-line', label: 'Vai trò', value: user?.role ? roleLabels[user.role] : '' },
    { icon: 'ri-calendar-line', label: 'Ngày vào làm', value: user?.joinDate },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <h1 className="text-lg font-heading font-bold text-foreground-950 mb-5">Cá nhân</h1>

      {/* Avatar & Name */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-primary-100 mb-3 border-2 border-primary-200">
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <i className="ri-user-line text-3xl text-primary-400"></i>
            </div>
          )}
        </div>
        <h2 className="text-base font-heading font-semibold text-foreground-950">{user?.name}</h2>
        <p className="text-xs text-foreground-500">{user?.position} - {user?.department}</p>
      </div>

      {/* Leave balance card */}
      <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-4 text-white mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/80 mb-0.5">Ngày phép còn lại</p>
            <p className="text-3xl font-heading font-bold">{user?.annualLeave ?? 0}</p>
          </div>
          <span className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <i className="ri-calendar-check-line text-2xl"></i>
          </span>
        </div>
      </div>

      {/* Info list */}
      <div className="bg-background-50 border border-background-200/70 rounded-2xl overflow-hidden mb-5">
        {infoItems.map((item, idx) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-4 py-3.5 ${
              idx !== infoItems.length - 1 ? 'border-b border-background-200/70' : ''
            }`}
          >
            <span className="w-8 h-8 bg-background-100 rounded-lg flex items-center justify-center shrink-0">
              <i className={`${item.icon} text-sm text-foreground-500`}></i>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground-500">{item.label}</p>
              <p className="text-sm font-medium text-foreground-950 truncate">{item.value || '---'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold text-sm rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <i className="ri-logout-box-line text-base"></i>
        </span>
        Đăng xuất
      </button>

      <p className="text-center text-[11px] text-foreground-300 mt-4">
        HRM App v1.0.0 - Phase 1
      </p>
    </div>
  );
}