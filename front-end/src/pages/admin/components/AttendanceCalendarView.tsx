import { useState, useMemo } from 'react';
import { mockUsers } from '@/mocks/users';
import { mockAttendance, getCheckIn, getCheckOut } from '@/mocks/attendance';
import {
  generateJuly2026Attendance,
  getWorkingHours,
  vietnameseDayLabels,
} from '@/mocks/attendanceCalendar';
import { getWorkHoursLabel } from '@/utils/workRules';
import type { AttendanceRecord } from '@/mocks/attendance';

interface Props {
  userFilter: string;
  deptFilter: string;
  search: string;
}

const allAttendance = [...mockAttendance, ...generateJuly2026Attendance()];

function getMonthDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = new Date(year, month, d).getDay();
    days.push({ date, day: d, dow, isWeekend: dow === 0 || dow === 6 });
  }
  return days;
}

function getUserSummary(userId: string, monthRecords: AttendanceRecord[]) {
  const userRecords = monthRecords.filter((r) => r.userId === userId);
  const present = userRecords.filter((r) => r.status !== 'absent').length;
  const late = userRecords.filter((r) => r.status === 'late').length;
  const early = userRecords.filter((r) => r.status === 'early_leave').length;
  const absent = userRecords.filter((r) => r.status === 'absent').length;
  const totalHours = userRecords.reduce((sum, r) => sum + getWorkingHours(r), 0);
  return { present, late, early, absent, totalHours };
}

export default function AttendanceCalendarView({ userFilter, deptFilter, search }: Props) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July = 6

  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const todayStr = '2026-07-15';

  const users = useMemo(() => {
    let list = [...mockUsers];
    if (userFilter) list = list.filter((u) => u.id === userFilter);
    if (deptFilter) list = list.filter((u) => u.department === deptFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          u.position.toLowerCase().includes(q),
      );
    }
    return list;
  }, [userFilter, deptFilter, search]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of allAttendance) {
      if (r.date.startsWith(monthStr)) {
        map.set(`${r.userId}-${r.date}`, r);
      }
    }
    return map;
  }, [monthStr]);

  const getRecord = (userId: string, date: string) => recordsMap.get(`${userId}-${date}`);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthLabel = `Tháng ${currentMonth + 1}/${currentYear}`;

  return (
    <div className="space-y-3">
      {/* Header nav */}
      <div className="flex items-center justify-between bg-background-50 border border-background-200/70 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-background-200/70 hover:bg-background-100 text-foreground-600 cursor-pointer transition-colors"
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
          <h3 className="text-sm font-semibold text-foreground-900 min-w-[110px] text-center">
            {monthLabel}
          </h3>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-background-200/70 hover:bg-background-100 text-foreground-600 cursor-pointer transition-colors"
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-100 border border-accent-300"></span>
            Đúng giờ
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary-100 border border-primary-300"></span>
            Đi muộn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-secondary-100 border border-secondary-300"></span>
            Về sớm
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-foreground-100 border border-foreground-300"></span>
            Vắng
          </span>
        </div>
      </div>

      {/* Calendar table */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-background-100/50">
                {/* Sticky name column */}
                <th className="sticky left-0 z-20 bg-background-100/90 backdrop-blur-sm text-left text-xs font-semibold text-foreground-600 px-3 py-2.5 border-b border-r border-background-200/70 w-[200px] min-w-[200px]">
                  Nhân viên
                </th>
                <th className="text-center text-xs font-semibold text-foreground-600 px-2 py-2.5 border-b border-background-200/70 min-w-[70px]">
                  Tổng công
                </th>
                {monthDays.map((d) => {
                  const isToday = d.date === todayStr;
                  return (
                    <th
                      key={d.date}
                      className={`text-center text-[10px] font-semibold px-1 py-2 border-b border-r border-background-200/70 min-w-[52px] ${
                        d.isWeekend ? 'text-foreground-400 bg-background-100/30' : 'text-foreground-600'
                      } ${isToday ? 'bg-accent-50/60 text-accent-700' : ''}`}
                    >
                      <div className={`${isToday ? 'text-accent-700' : d.isWeekend ? 'text-foreground-400' : ''}`}>
                        {vietnameseDayLabels[d.dow]}
                      </div>
                      <div className={`${isToday ? 'font-bold text-accent-700' : ''}`}>
                        {String(d.day).padStart(2, '0')}/{String(currentMonth + 1).padStart(2, '0')}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const summary = getUserSummary(
                  user.id,
                  allAttendance.filter((r) => r.date.startsWith(monthStr)),
                );
                return (
                  <tr
                    key={user.id}
                    className={`${idx % 2 === 0 ? 'bg-background-50' : 'bg-background-100/20'} hover:bg-background-100/40 transition-colors`}
                  >
                    {/* Sticky user column */}
                    <td className="sticky left-0 z-10 bg-inherit backdrop-blur-sm px-3 py-2 border-b border-r border-background-200/70 w-[200px] min-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground-900 truncate">{user.name}</p>
                          <p className="text-[10px] text-foreground-500 truncate">{user.position}</p>
                          <p className="text-[9px] text-foreground-400 truncate mt-0.5 italic">
                            {getWorkHoursLabel(user.department)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center border-b border-background-200/70 px-2 py-2">
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-xs font-bold text-foreground-900">
                          D: {summary.present + summary.late + summary.early}
                        </span>
                        <span className="text-[10px] text-foreground-500">
                          H: {summary.totalHours.toFixed(1)}h
                        </span>
                      </div>
                    </td>
                    {monthDays.map((d) => {
                      const record = getRecord(user.id, d.date);
                      const isToday = d.date === todayStr;
                      const cellBg = d.isWeekend
                        ? 'bg-background-100/30'
                        : isToday
                          ? 'bg-accent-50/30'
                          : '';

                      if (!record) {
                        return (
                          <td
                            key={d.date}
                            className={`text-center border-b border-r border-background-200/70 px-0.5 py-1 ${cellBg}`}
                          >
                            <span className="text-[10px] text-foreground-300">-</span>
                          </td>
                        );
                      }

                      if (record.status === 'absent') {
                        return (
                          <td
                            key={d.date}
                            className={`text-center border-b border-r border-background-200/70 px-0.5 py-1 ${cellBg}`}
                          >
                            <span className="text-[10px] font-medium text-foreground-400">V</span>
                          </td>
                        );
                      }

                      const checkIn = getCheckIn(record);
                      const checkOut = getCheckOut(record);

                      return (
                        <td
                          key={d.date}
                          className={`text-center border-b border-r border-background-200/70 px-0.5 py-1 ${cellBg}`}
                        >
                          <div className="flex flex-col items-center leading-tight gap-[1px]">
                            {checkIn && (
                              <span className="text-[10px] font-medium text-accent-600">{checkIn}</span>
                            )}
                            {checkOut && (
                              <span className="text-[10px] font-medium text-primary-600">{checkOut}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-10 text-sm text-foreground-400">
            <i className="ri-calendar-line text-2xl block mb-2"></i>
            Không có nhân viên phù hợp với bộ lọc
          </div>
        )}
      </div>

      {/* Mobile fallback */}
      <div className="lg:hidden bg-background-50 border border-background-200/70 rounded-xl p-4 text-center text-sm text-foreground-500">
        <i className="ri-computer-line text-2xl block mb-2 text-foreground-400"></i>
        Bảng chấm công ma trận được tối ưu cho màn hình lớn. Vui lòng sử dụng thiết bị có màn hình rộng hơn 1024px để xem đầy đủ.
      </div>
    </div>
  );
}