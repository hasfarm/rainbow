import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AuthContext } from '@/hooks/useAuth';
import { mockLeaves, leaveTypeLabels } from '@/mocks/leaves';
import { mockNotifications } from '@/mocks/notifications';
import { mockOvertimes } from '@/mocks/overtimes';
import { mockTimeOffs } from '@/mocks/timeoff';

interface PunchRecord {
  sequence: number;
  time: string;
  photo: string | null;
}

interface AttendanceRecordApi {
  date: string;
  punches: PunchRecord[];
  status: 'on_time' | 'late' | 'early_leave' | 'absent';
  statusLabel: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hrm_auth_token');

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function Home() {
  const { user } = useContext(AuthContext);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecordApi | null>(null);

  useEffect(() => {
    async function loadTodayAttendance() {
      if (!localStorage.getItem('hrm_auth_token')) {
        return;
      }

      try {
        const response = await fetch('/back-end/public/api/attendance/today', {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { data: AttendanceRecordApi | null };
        setTodayAttendance(payload.data);
      } catch {
        setTodayAttendance(null);
      }
    }

    void loadTodayAttendance();
  }, []);

  const todayText = format(new Date(), "EEEE, 'ngày' dd 'tháng' MM", { locale: vi });
  const firstName = (user?.name ?? 'Bạn').trim().split(' ').pop() ?? 'Bạn';
  const userId = user?.id ?? 'NV001';
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';

  const pendingSummary = useMemo(() => {
    const pendingLeave = mockLeaves.filter((item) => item.userId === userId && item.status === 'pending').length;
    const pendingOvertime = mockOvertimes.filter((item) => item.userId === userId && item.status === 'pending').length;
    const pendingTimeOff = mockTimeOffs.filter((item) => item.userId === userId && item.status === 'pending').length;

    return {
      pendingLeave,
      pendingOvertime,
      pendingTimeOff,
      total: pendingLeave + pendingOvertime + pendingTimeOff,
    };
  }, [userId]);

  const unreadNotifications = useMemo(() => {
    return mockNotifications.filter((item) => !item.isRead && (item.recipientId === null || item.recipientId === userId));
  }, [userId]);

  const nearestPendingLeave = useMemo(() => {
    return mockLeaves
      .filter((item) => item.userId === userId && item.status === 'pending')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  }, [userId]);

  const attendanceStatusLabel = todayAttendance?.statusLabel ?? 'Chưa chấm công';
  const punchCount = todayAttendance?.punches.length ?? 0;

  return (
    <div className="min-h-screen bg-background-50 px-4 pb-24 pt-5 md:bg-background-100 md:px-7 md:pb-8 md:pt-7">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <section className="rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 p-5 text-white shadow-[0_20px_45px_rgba(14,116,144,0.28)] md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/80">Trang chủ</p>
              <h1 className="mt-1 text-2xl font-bold">Chào {firstName}</h1>
              <p className="mt-1 text-sm text-white/85">{todayText}</p>
            </div>
            {isAdmin && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
              >
                <i className="ri-shield-star-line" />
                Admin
              </Link>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 md:gap-3">
            <MetricCard label="Chờ duyệt" value={String(pendingSummary.total)} icon="ri-time-line" />
            <MetricCard label="Thông báo mới" value={String(unreadNotifications.length)} icon="ri-notification-3-line" />
            <MetricCard label="Phép còn lại" value={String(user?.annualLeave ?? 0)} icon="ri-suitcase-line" />
          </div>
        </section>

        <section className="rounded-2xl border border-background-200 bg-background-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground-900">Tổng quan hôm nay</h2>
            <Link to="/attendance/history" className="text-xs font-semibold text-primary-600">
              Xem lịch sử
            </Link>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <InfoTile
              icon="ri-fingerprint-line"
              title="Chấm công"
              value={attendanceStatusLabel}
              hint={`Số lần chấm: ${punchCount}`}
            />
            <InfoTile
              icon="ri-calendar-event-line"
              title="Lịch nghỉ gần nhất"
              value={nearestPendingLeave ? leaveTypeLabels[nearestPendingLeave.type] : 'Không có'}
              hint={nearestPendingLeave ? `${nearestPendingLeave.startDate} đến ${nearestPendingLeave.endDate}` : 'Bạn chưa có đơn chờ duyệt'}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-background-200 bg-background-50 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground-900">Phê duyệt đang chờ</h2>
          <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
            <PendingPill label="Nghỉ phép" count={pendingSummary.pendingLeave} color="secondary" />
            <PendingPill label="Tăng ca" count={pendingSummary.pendingOvertime} color="accent" />
            <PendingPill label="Đi trễ/Về sớm" count={pendingSummary.pendingTimeOff} color="primary" />
          </div>
        </section>

        <section className="rounded-2xl border border-background-200 bg-background-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground-900">Thao tác nhanh</h2>
            <p className="text-xs text-foreground-500">Chọn để thao tác ngay</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <QuickAction to="/attendance" icon="ri-fingerprint-line" label="Chấm công" />
            <QuickAction to="/leave" icon="ri-calendar-check-line" label="Xin nghỉ" />
            <QuickAction to="/overtime/new" icon="ri-timer-flash-line" label="Tăng ca" />
            <QuickAction to="/timeoff/new" icon="ri-run-line" label="Đi trễ / Về sớm" />
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-white/90">
        <i className={`${icon} text-base`} />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold leading-none">{value}</p>
    </div>
  );
}

function InfoTile({ icon, title, value, hint }: { icon: string; title: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-background-200 bg-background-50 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground-500">
        <i className={`${icon} text-base text-primary-500`} />
        <span>{title}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-foreground-900">{value}</p>
      <p className="mt-1 text-xs text-foreground-500">{hint}</p>
    </div>
  );
}

function PendingPill({ label, count, color }: { label: string; count: number; color: 'primary' | 'secondary' | 'accent' }) {
  const colorMap = {
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-secondary-100 text-secondary-700',
    accent: 'bg-accent-100 text-accent-700',
  };

  return (
    <div className={`rounded-xl px-2 py-3 ${colorMap[color]}`}>
      <p className="text-2xl font-bold leading-none">{count}</p>
      <p className="mt-1 text-[11px] font-semibold">{label}</p>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link
      to={to}
      className="group flex min-h-[92px] flex-col items-center justify-center rounded-xl border border-background-200 bg-background-50 p-2 text-center transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200">
        <i className={`${icon} text-lg`} />
      </span>
      <span className="mt-2 text-[11px] font-semibold text-foreground-700">{label}</span>
    </Link>
  );
}

export default Home;