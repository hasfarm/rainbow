import { AuthContext } from '@/hooks/useAuth';
import { mockAttendance, getCheckIn, getCheckOut, type AttendanceRecord } from '@/mocks/attendance';
import { mockOvertimes } from '@/mocks/overtimes';
import { mockLeaves } from '@/mocks/leaves';
import { mockTimeOffs } from '@/mocks/timeoff';
import { mockNotifications } from '@/mocks/notifications';
import { format } from 'date-fns';
import { useContext } from 'react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { to: '/attendance', icon: 'ri-fingerprint-line', label: 'Chấm công', color: 'bg-primary-500' },
  { to: '/leave', icon: 'ri-calendar-check-line', label: 'Nghỉ phép', color: 'bg-accent-500' },
  { to: '/overtime', icon: 'ri-time-line', label: 'Tăng ca', color: 'bg-secondary-500' },
  { to: '/timeoff', icon: 'ri-run-line', label: 'Đi trễ / VS', color: 'bg-foreground-700' },
  { to: '/payslip', icon: 'ri-bank-card-line', label: 'Phiếu lương', color: 'bg-accent-600' },
];

export default function DashboardPage() {
  const { user } = useContext(AuthContext);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const userAttendance = mockAttendance.filter((a) => a.userId === user?.id);
  const todayRecord = userAttendance.find((a) => a.date === todayStr);

  const pendingLeaves = mockLeaves.filter((l) => l.userId === user?.id && l.status === 'pending').length;
  const pendingOvertimes = mockOvertimes.filter((o) => o.userId === user?.id && o.status === 'pending').length;
  const pendingTimeOffs = mockTimeOffs.filter((t) => t.userId === user?.id && t.status === 'pending').length;
  const pendingRequests = pendingLeaves + pendingOvertimes + pendingTimeOffs;
  const unreadNotifications = mockNotifications.filter(
    (n) => (n.type === 'announcement') || (n.type === 'private' && n.recipientId === user?.id),
  ).filter((n) => !n.isRead).length;
  const remainingLeave = user?.annualLeave ?? 0;

  const getStatusInfo = (record: AttendanceRecord | undefined) => {
    if (!record || record.status === 'absent') {
      return {
        label: 'Chưa chấm công',
        icon: 'ri-alert-line',
        color: 'text-foreground-400',
        bg: 'bg-foreground-100',
      };
    }
    if (record.status === 'on_time') {
      return {
        label: 'Đã chấm công',
        icon: 'ri-check-double-line',
        color: 'text-accent-600',
        bg: 'bg-accent-100',
      };
    }
    if (record.status === 'late') {
      return {
        label: 'Đi muộn',
        icon: 'ri-alert-line',
        color: 'text-secondary-600',
        bg: 'bg-secondary-100',
      };
    }
    return {
      label: 'Về sớm',
      icon: 'ri-time-line',
      color: 'text-primary-600',
      bg: 'bg-primary-100',
    };
  };

  const statusInfo = getStatusInfo(todayRecord);
  const checkInTime = todayRecord ? getCheckIn(todayRecord) : null;
  const checkOutTime = todayRecord ? getCheckOut(todayRecord) : null;
  const punchCount = todayRecord ? todayRecord.punches.length : 0;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-heading font-bold text-foreground-950">
            Xin chào, {user?.name?.split(' ').pop()}!
          </h1>
          <p className="text-xs text-foreground-500 mt-0.5">{user?.position}</p>
        </div>
        <Link to="/profile">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center cursor-pointer">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <i className="ri-user-line text-lg text-primary-500"></i>
            )}
          </div>
        </Link>
      </div>

      {/* Today's attendance status card */}
      <Link to="/attendance" className="block mb-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>
          <div className="relative z-10">
            <p className="text-xs text-white/80 mb-1">Hôm nay - {format(new Date(), 'dd/MM/yyyy')}</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className={`${statusInfo.icon} text-base`}></i>
              </span>
              <span className="text-base font-semibold">{statusInfo.label}</span>
            </div>
            {checkInTime && (
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-white/70 text-xs">Check-in</span>
                  <p className="font-semibold">{checkInTime}</p>
                </div>
                {checkOutTime && (
                  <>
                    <span className="text-white/30">→</span>
                    <div>
                      <span className="text-white/70 text-xs">Check-out</span>
                      <p className="font-semibold">{checkOutTime}</p>
                    </div>
                  </>
                )}
              </div>
            )}
            {punchCount > 0 && (
              <p className="text-[11px] text-white/60 mt-2">{punchCount} lần chấm công hôm nay</p>
            )}
          </div>
        </div>
      </Link>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4">
          <div className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center mb-2">
            <i className="ri-calendar-check-line text-lg text-accent-600"></i>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground-950">{remainingLeave}</p>
          <p className="text-xs text-foreground-500">Ngày phép còn lại</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4">
          <div className="w-9 h-9 bg-secondary-100 rounded-lg flex items-center justify-center mb-2">
            <i className="ri-file-list-3-line text-lg text-secondary-600"></i>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground-950">{pendingRequests}</p>
          <p className="text-xs text-foreground-500">Đơn đang chờ duyệt</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4">
          <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center mb-2">
            <i className="ri-notification-3-line text-lg text-primary-500"></i>
          </div>
          <p className="text-2xl font-heading font-bold text-foreground-950">{unreadNotifications}</p>
          <p className="text-xs text-foreground-500">Thông báo mới chưa đọc</p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">Thao tác nhanh</h2>
        <div className="grid grid-cols-5 gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex flex-col items-center gap-1.5 p-3 bg-background-50 border border-background-200/70 rounded-xl hover:border-primary-300 transition-colors duration-200 cursor-pointer"
            >
              <span className={`w-10 h-10 ${link.color} rounded-xl flex items-center justify-center`}>
                <i className={`${link.icon} text-lg text-white`}></i>
              </span>
              <span className="text-[11px] font-medium text-foreground-600 text-center whitespace-nowrap">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}