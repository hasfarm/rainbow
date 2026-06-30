import { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockAttendance, attendanceStatusLabels, getCheckIn, getCheckOut, type AttendanceRecord } from '@/mocks/attendance';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isWeekend, addMonths, subMonths, getYear, getMonth, getDate } from 'date-fns';
import { vi } from 'date-fns/locale';

type ViewMode = 'day' | 'month' | 'year';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const statusColors: Record<string, { dot: string; bg: string; text: string }> = {
  on_time: { dot: 'bg-accent-500', bg: 'bg-accent-100', text: 'text-accent-700' },
  late: { dot: 'bg-secondary-500', bg: 'bg-secondary-100', text: 'text-secondary-700' },
  early_leave: { dot: 'bg-primary-400', bg: 'bg-primary-100', text: 'text-primary-700' },
  absent: { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-600' },
};

function getPunchLabel(index: number, _total: number): { label: string; icon: string; isIn: boolean } {
  // Strict alternating: index 0 = check-in, 1 = check-out, 2 = check-in, 3 = check-out...
  return index % 2 === 0
    ? { label: 'Check-in', icon: 'ri-login-box-line', isIn: true }
    : { label: 'Check-out', icon: 'ri-logout-box-line', isIn: false };
}

function calcDuration(startTime: string, endTime: string): string {
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hrs}h${mins > 0 ? `${mins}p` : ''}`;
}

export default function AttendanceHistoryPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const userAttendance = useMemo(
    () => mockAttendance.filter((a) => a.userId === user?.id),
    [user?.id]
  );

  const attendanceByDate = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};
    userAttendance.forEach((a) => {
      map[a.date] = a;
    });
    return map;
  }, [userAttendance]);

  const prevMonth = () => setCurrentMonth((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1));
  const prevYear = () => setCurrentYear((d) => subMonths(d, 12));
  const nextYear = () => setCurrentYear((d) => addMonths(d, 12));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const dayRecord = useMemo(() => {
    if (!selectedDay) return null;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    return userAttendance.find((a) => a.date === dateStr) || null;
  }, [selectedDay, userAttendance]);

  const yearSummaries = useMemo(() => {
    const year = getYear(currentYear);
    return Array.from({ length: 12 }, (_, i) => {
      const month = i;
      const monthRecords = userAttendance.filter((a) => {
        const d = new Date(a.date);
        return getYear(d) === year && getMonth(d) === month;
      });
      const onTime = monthRecords.filter((r) => r.status === 'on_time').length;
      const late = monthRecords.filter((r) => r.status === 'late').length;
      const earlyLeave = monthRecords.filter((r) => r.status === 'early_leave').length;
      const absent = monthRecords.filter((r) => r.status === 'absent').length;
      return { month, total: monthRecords.length, onTime, late, earlyLeave, absent };
    });
  }, [currentYear, userAttendance]);

  const goToMonth = (monthIndex: number) => {
    setCurrentMonth(new Date(getYear(currentYear), monthIndex, 1));
    setViewMode('month');
  };

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: vi });

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/attendance')}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-background-100 border border-background-200/70 text-foreground-500 hover:text-foreground-700 hover:bg-background-200 transition-colors duration-150 cursor-pointer"
        >
          <i className="ri-arrow-left-line text-lg"></i>
        </button>
        <div>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Lịch sử chấm công</h1>
          <p className="text-xs text-foreground-500 mt-0.5">{user?.name}</p>
        </div>
      </div>

      {/* View mode tabs */}
      <div className="flex items-center gap-1 p-1 bg-background-100 rounded-full mb-5">
        {(['day', 'month', 'year'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
              viewMode === mode
                ? 'bg-white text-foreground-950 shadow-sm'
                : 'text-foreground-500 hover:text-foreground-700'
            }`}
          >
            {mode === 'day' ? 'Ngày' : mode === 'month' ? 'Tháng' : 'Năm'}
          </button>
        ))}
      </div>

      {/* === MONTH VIEW === */}
      {viewMode === 'month' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-foreground-700 transition-colors duration-150 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            <h2 className="text-base font-heading font-semibold text-foreground-950 capitalize">{monthLabel}</h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-foreground-700 transition-colors duration-150 cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-foreground-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const record = attendanceByDate[dateStr];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const isWeekendDay = isWeekend(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDay(day);
                    setViewMode('day');
                  }}
                  className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-150 cursor-pointer min-h-[44px] ${
                    !isCurrentMonth
                      ? 'text-foreground-300 opacity-40'
                      : isSelected
                        ? 'bg-primary-500 text-white'
                        : isTodayDate
                          ? 'bg-primary-100 text-primary-700 font-bold'
                          : isWeekendDay
                            ? 'text-foreground-400'
                            : 'text-foreground-700 hover:bg-background-100'
                  }`}
                >
                  <span className={`text-sm ${isTodayDate && !isSelected ? 'font-bold' : 'font-medium'}`}>
                    {getDate(day)}
                  </span>
                  {record && isCurrentMonth && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : statusColors[record.status]?.dot || 'bg-foreground-300'
                      }`}
                    ></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-background-200/70 flex-wrap">
            {Object.entries(statusColors).map(([key, colors]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></span>
                <span className="text-xs text-foreground-500">{attendanceStatusLabels[key]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* === DAY VIEW === */}
      {viewMode === 'day' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (selectedDay) {
                  const prev = new Date(selectedDay);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDay(prev);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-foreground-700 transition-colors duration-150 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            <h2 className="text-base font-heading font-semibold text-foreground-950 capitalize">
              {selectedDay ? format(selectedDay, 'EEEE, dd/MM/yyyy', { locale: vi }) : 'Chọn một ngày'}
            </h2>
            <button
              onClick={() => {
                if (selectedDay) {
                  const next = new Date(selectedDay);
                  next.setDate(next.getDate() + 1);
                  setSelectedDay(next);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-foreground-700 transition-colors duration-150 cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
          </div>

          {!dayRecord || dayRecord.punches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <span className="w-16 h-16 flex items-center justify-center mb-4 bg-background-100 rounded-full">
                <i className="ri-calendar-check-line text-3xl text-foreground-300"></i>
              </span>
              <p className="text-sm font-medium text-foreground-500 mb-1">Không có dữ liệu chấm công</p>
              <p className="text-xs text-foreground-400">
                {selectedDay && isWeekend(selectedDay)
                  ? 'Cuối tuần — không có bản ghi chấm công'
                  : selectedDay && selectedDay > new Date()
                    ? 'Ngày trong tương lai — chưa có dữ liệu'
                    : dayRecord?.status === 'absent'
                      ? 'Nhân viên vắng mặt ngày này'
                      : 'Không tìm thấy bản ghi cho ngày này'}
              </p>
            </div>
          ) : (
            <div>
              {/* Status badge & summary */}
              <div className="flex items-center justify-between mb-4 p-3.5 bg-background-50 border border-background-200/70 rounded-xl">
                <div>
                  <p className="text-xs text-foreground-400">{dayRecord.id}</p>
                  <p className="text-sm font-semibold text-foreground-950 mt-0.5">
                    {dayRecord.punches.length} lần chấm công
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    statusColors[dayRecord.status]?.bg
                  } ${statusColors[dayRecord.status]?.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusColors[dayRecord.status]?.dot}`}></span>
                  {attendanceStatusLabels[dayRecord.status]}
                </span>
              </div>

              {/* Punch timeline */}
              <div className="space-y-0">
                {dayRecord.punches.map((punch, idx) => {
                  const { label, icon, isIn } = getPunchLabel(idx, dayRecord.punches.length);
                  const checkInTime = getCheckIn(dayRecord);
                  const checkOutTime = getCheckOut(dayRecord);

                  return (
                    <div key={idx} className="relative flex items-start gap-3 pb-3">
                      {idx < dayRecord.punches.length - 1 && (
                        <div className="absolute left-[17px] top-9 w-0.5 h-[calc(100%_-_8px)] bg-background-200/70"></div>
                      )}
                      <span
                        className={`relative z-10 w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 ${
                          isIn ? 'bg-accent-100' : 'bg-secondary-100'
                        }`}
                      >
                        <i className={`${icon} ${isIn ? 'text-accent-600' : 'text-secondary-600'} text-sm`}></i>
                      </span>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground-950">{punch.time}</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              isIn ? 'bg-accent-100 text-accent-700' : 'bg-secondary-100 text-secondary-700'
                            }`}
                          >
                            {label}
                          </span>
                          <span className="text-[11px] text-foreground-400">#{idx + 1}</span>
                        </div>
                        {punch.photo && (
                          <div className="mt-1.5 rounded-lg overflow-hidden w-20 h-14">
                            <img src={punch.photo} alt={`Chấm công lần ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary: total working time */}
              {(() => {
                const checkInTime = getCheckIn(dayRecord);
                const checkOutTime = getCheckOut(dayRecord);
                if (!checkInTime || !checkOutTime) return null;
                return (
                  <div className="mt-4 p-3.5 bg-background-50 border border-background-200/70 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-foreground-500">
                      <span className="w-4 h-4 flex items-center justify-center">
                        <i className="ri-time-line text-xs"></i>
                      </span>
                      <span>Tổng thời gian làm việc (Check-in đầu → Check-out cuối): </span>
                      <span className="font-semibold text-foreground-700">{calcDuration(checkInTime, checkOutTime)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <button
            onClick={() => setViewMode('month')}
            className="mt-4 w-full py-2.5 rounded-xl bg-background-100 border border-background-200/70 text-sm font-medium text-foreground-600 hover:text-foreground-800 hover:bg-background-200 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-calendar-line text-sm"></i>
            </span>
            Xem lịch tháng
          </button>
        </>
      )}

      {/* === YEAR VIEW === */}
      {viewMode === 'year' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevYear}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-foreground-700 transition-colors duration-150 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            <h2 className="text-base font-heading font-semibold text-foreground-950">
              {getYear(currentYear)}
            </h2>
            <button
              onClick={nextYear}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-foreground-700 transition-colors duration-150 cursor-pointer"
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
          </div>

          {(() => {
            const totalOnTime = yearSummaries.reduce((s, m) => s + m.onTime, 0);
            const totalLate = yearSummaries.reduce((s, m) => s + m.late, 0);
            const totalEarlyLeave = yearSummaries.reduce((s, m) => s + m.earlyLeave, 0);
            const totalAbsent = yearSummaries.reduce((s, m) => s + m.absent, 0);

            return (
              <div className="grid grid-cols-4 gap-2 mb-5">
                <div className="p-3 bg-accent-100 rounded-xl text-center">
                  <p className="text-2xl font-heading font-bold text-accent-700">{totalOnTime}</p>
                  <p className="text-[11px] text-accent-600 mt-0.5 whitespace-nowrap">Đúng giờ</p>
                </div>
                <div className="p-3 bg-secondary-100 rounded-xl text-center">
                  <p className="text-2xl font-heading font-bold text-secondary-700">{totalLate}</p>
                  <p className="text-[11px] text-secondary-600 mt-0.5 whitespace-nowrap">Đi muộn</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl text-center">
                  <p className="text-2xl font-heading font-bold text-primary-700">{totalEarlyLeave}</p>
                  <p className="text-[11px] text-primary-600 mt-0.5 whitespace-nowrap">Về sớm</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <p className="text-2xl font-heading font-bold text-red-500">{totalAbsent}</p>
                  <p className="text-[11px] text-red-400 mt-0.5 whitespace-nowrap">Vắng mặt</p>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            {yearSummaries.map((sm) => {
              const monthName = format(new Date(getYear(currentYear), sm.month, 1), 'MMMM', { locale: vi });
              return (
                <button
                  key={sm.month}
                  onClick={() => goToMonth(sm.month)}
                  className="p-3.5 bg-background-50 border border-background-200/70 rounded-xl text-left hover:border-primary-300 hover:bg-background-100 transition-all duration-150 cursor-pointer"
                >
                  <p className="text-sm font-heading font-semibold text-foreground-950 capitalize mb-2">{monthName}</p>
                  {sm.total === 0 ? (
                    <p className="text-xs text-foreground-400">Chưa có dữ liệu</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      {sm.onTime > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-accent-700">
                          <span className="w-2 h-2 rounded-full bg-accent-500"></span>
                          {sm.onTime}
                        </span>
                      )}
                      {sm.late > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-secondary-700">
                          <span className="w-2 h-2 rounded-full bg-secondary-500"></span>
                          {sm.late}
                        </span>
                      )}
                      {sm.earlyLeave > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-primary-600">
                          <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                          {sm.earlyLeave}
                        </span>
                      )}
                      {sm.absent > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-500">
                          <span className="w-2 h-2 rounded-full bg-red-400"></span>
                          {sm.absent}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-foreground-400 mt-2">{sm.total} ngày công</p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}