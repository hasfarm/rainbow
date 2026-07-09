import { AuthContext } from '@/hooks/useAuth';
import { mockAttendance } from '@/mocks/attendance';
import { mockLeaves } from '@/mocks/leaves';
import { mockNotifications } from '@/mocks/notifications';
import { mockOvertimes } from '@/mocks/overtimes';
import { AdminSidebar } from '@/components/feature/AdminSidebar';
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const totalEmployees = 26;
  const userAttendance = mockAttendance.filter((item) => item.userId === user?.id);
  const totalPresents = userAttendance.filter((item) => item.status === 'on_time').length;
  const totalAbsents = userAttendance.filter((item) => item.status === 'absent').length;
  const totalLeave = mockLeaves.filter((item) => item.userId === user?.id).length;
  const recentLeaves = mockLeaves.slice(0, 4);
  const notifyCount = mockNotifications.filter((item) => !item.isRead).length;
  const overtimeHours = mockOvertimes.reduce((sum, item) => sum + item.hours, 0);

  const attendanceBars = [68, 74, 66, 82, 79, 88, 72];
  const absentBars = [32, 26, 34, 18, 21, 12, 28];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-background-100 p-0 md:p-6">
      <div className="mx-auto max-w-[1320px] rounded-none md:rounded-3xl border-0 md:border md:border-background-200 bg-background-50 shadow-none md:shadow-[0_24px_60px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="grid md:grid-cols-[240px_1fr] min-h-[760px]">
          {isSidebarOpen && (
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-foreground-950/35 backdrop-blur-[1px] md:hidden"
            />
          )}

          <AdminSidebar
            className={`fixed z-40 top-0 left-0 h-full w-[280px] max-w-[86vw] transform transition-transform duration-300 md:static md:w-auto md:h-auto md:transform-none ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
            onClose={() => setIsSidebarOpen(false)}
            onItemClick={() => setIsSidebarOpen(false)}
          />

          <section className="p-3.5 sm:p-4 md:p-6 lg:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden h-10 w-10 rounded-xl border border-background-200 text-foreground-700 bg-background-50"
                  aria-label="Open menu"
                >
                  <i className="ri-menu-line text-xl"></i>
                </button>

                <div className="relative w-full md:w-[360px]">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
                <input
                  type="text"
                  placeholder="Search your data"
                  className="w-full rounded-xl border border-background-200 bg-background-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-300"
                />
              </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-end">
                <button className="h-10 w-10 rounded-xl border border-background-200 text-foreground-500 hover:bg-background-100">
                  <i className="ri-notification-3-line"></i>
                </button>
                <Link to="/profile" className="flex items-center gap-2 rounded-xl border border-background-200 bg-background-50 px-2.5 sm:px-3 py-1.5 max-w-[230px]">
                  <span className="h-9 w-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <i className="ri-user-line text-lg"></i>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground-900 truncate">{user?.name ?? 'Staff User'}</span>
                    <span className="block text-[11px] text-foreground-500 truncate">{user?.position ?? 'HR'}</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] mb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard title="Total Employee" value={totalEmployees} trend="+15%" icon="ri-team-line" accent="primary" />
                <StatCard title="Total Presents" value={totalPresents} trend="+6%" icon="ri-user-smile-line" accent="accent" />
                <StatCard title="Total Absents" value={totalAbsents} trend="-3%" icon="ri-user-unfollow-line" accent="secondary" />
                <StatCard title="Total Leave" value={totalLeave} trend="+2%" icon="ri-calendar-check-line" accent="foreground" />
              </div>

              <div className="rounded-2xl border border-background-200 bg-background-50 p-3.5 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground-900">Daily attendance statistic</h3>
                  <p className="text-xs text-foreground-400">This week</p>
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end h-[160px] sm:h-[170px] mt-3">
                  {weekDays.map((day, idx) => (
                    <div key={day} className="flex flex-col items-center gap-2">
                      <div className="w-5 sm:w-6 rounded-full bg-background-100 p-1 flex flex-col justify-end h-[118px] sm:h-[130px] gap-1">
                        <span className="rounded-full bg-primary-500" style={{ height: `${attendanceBars[idx]}%` }}></span>
                        <span className="rounded-full bg-accent-400" style={{ height: `${absentBars[idx]}%` }}></span>
                      </div>
                      <span className="text-[10px] text-foreground-500">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3 mb-4">
              <div className="rounded-2xl border border-background-200 bg-background-50 p-3.5 sm:p-4 xl:col-span-1">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground-900">Recruitment</h3>
                  <span className="text-xs text-foreground-500">Yearly</span>
                </div>
                <div className="space-y-3 text-xs text-foreground-500">
                  <ProgressRow label="IT Student" value={82} color="bg-primary-500" />
                  <ProgressRow label="Software" value={66} color="bg-accent-500" />
                  <ProgressRow label="Data Analyst" value={91} color="bg-secondary-500" />
                </div>
              </div>

              <div className="rounded-2xl border border-background-200 bg-background-50 p-3.5 sm:p-4 xl:col-span-1">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground-900">Overtime Summary</h3>
                  <span className="text-xs text-red-400">-31%</span>
                </div>
                <div className="h-[124px] w-[124px] mx-auto rounded-full border-[12px] border-accent-200 border-t-primary-500 border-r-secondary-400 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary-600">{overtimeHours.toFixed(1)}h</p>
                    <p className="text-[11px] text-foreground-500">Total overtime</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-background-200 bg-background-50 p-3.5 sm:p-4 xl:col-span-1">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground-900">Leave Application</h3>
                  <span className="text-xs text-foreground-500">See all</span>
                </div>
                <div className="space-y-2.5">
                  {recentLeaves.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground-900">{item.type}</p>
                        <p className="text-xs text-foreground-500">{item.reason}</p>
                      </div>
                      <StatusChip status={item.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-background-200 bg-background-50 p-3.5 sm:p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground-900">Employee list</h3>
                <button className="rounded-xl bg-primary-500 text-white px-3.5 py-2 text-sm font-medium hover:bg-primary-600 transition-colors">
                  Add new employee
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="text-left text-foreground-500 border-b border-background-200">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Id</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Department</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(userAttendance.slice(0, 5))].map((item, idx) => (
                      <tr key={item.id} className="border-b border-background-100 last:border-0">
                        <td className="py-2.5 text-foreground-900">{user?.name ?? `Employee ${idx + 1}`}</td>
                        <td className="py-2.5 text-foreground-500">#{item.id}</td>
                        <td className="py-2.5 text-foreground-500">{user?.email ?? 'staff@rainbow.test'}</td>
                        <td className="py-2.5 text-foreground-500">{user?.department ?? 'Operations'}</td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-700">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-foreground-500">{notifyCount} thông báo chưa đọc cần xử lý hôm nay.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  icon,
  accent,
}: {
  title: string;
  value: number;
  trend: string;
  icon: string;
  accent: 'primary' | 'accent' | 'secondary' | 'foreground';
}) {
  const accentStyles = {
    primary: 'bg-primary-500 text-white',
    accent: 'bg-accent-500 text-white',
    secondary: 'bg-secondary-500 text-white',
    foreground: 'bg-foreground-800 text-white',
  };

  return (
    <div className="rounded-2xl border border-background-200 bg-background-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-foreground-500">{title}</p>
        <span className={`h-8 w-8 rounded-xl flex items-center justify-center ${accentStyles[accent]}`}>
          <i className={icon}></i>
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground-900">{value}</p>
      <p className="mt-1 text-[11px] text-foreground-400">{trend} since last week</p>
    </div>
  );
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-background-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: 'approved' | 'rejected' | 'pending' }) {
  if (status === 'approved') {
    return <span className="rounded-full bg-accent-100 px-2 py-1 text-[11px] font-semibold text-accent-700">Approved</span>;
  }

  if (status === 'rejected') {
    return <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-600">Rejected</span>;
  }

  return <span className="rounded-full bg-secondary-100 px-2 py-1 text-[11px] font-semibold text-secondary-700">Pending</span>;
}