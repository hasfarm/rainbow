import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import {
  createLeave,
  fetchLeaveEmployees,
  leaveTypeLabels,
  type EmployeeOption,
  type LeaveFormPayload,
  type LeaveType,
} from '../api';

type LeaveMode = 'full_day' | 'hourly';

const leaveTypes: LeaveType[] = [
  'annual_leave',
  'unpaid_leave',
  'marriage_leave',
  'bereavement_leave',
  'business_trip',
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

function getNextDate(dateValue: string): string {
  if (!dateValue) {
    return '';
  }

  const [yearText, monthText, dayText] = dateValue.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return '';
  }

  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextYear = String(nextDate.getUTCFullYear());
  const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(nextDate.getUTCDate()).padStart(2, '0');

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export default function LeaveNewPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [selectedType, setSelectedType] = useState<LeaveType>('annual_leave');
  const [leaveMode, setLeaveMode] = useState<LeaveMode>('full_day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [reason, setReason] = useState('');
  const [handoverTo, setHandoverTo] = useState('');
  const [handoverNote, setHandoverNote] = useState('');
  const [approver, setApprover] = useState('');
  const [handoverQuery, setHandoverQuery] = useState('');
  const [approverQuery, setApproverQuery] = useState('');
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isApproverOpen, setIsApproverOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handoverDropdownRef = useRef<HTMLDivElement>(null);
  const approverDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const records = await fetchLeaveEmployees();
        setEmployees(records);
      } catch {
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    }

    void loadEmployees();
  }, []);

  const approvers = useMemo(() => {
    return employees;
  }, [employees]);

  const handoverCandidates = useMemo(() => {
    const selfCode = (user?.id ?? '').trim().toLowerCase();
    const selfName = (user?.name ?? '').trim().toLowerCase();

    return employees.filter((item) => {
      const candidateCode = item.code.trim().toLowerCase();
      const candidateName = item.name.trim().toLowerCase();

      if (selfCode !== '' && candidateCode === selfCode) {
        return false;
      }

      return !(selfName !== '' && candidateName === selfName);
    });
  }, [employees, user?.id, user?.name]);

  const selectedHandover = useMemo(
    () => handoverCandidates.find((item) => item.code === handoverTo) ?? null,
    [handoverCandidates, handoverTo]
  );

  const selectedApprover = useMemo(
    () => approvers.find((item) => item.code === approver) ?? null,
    [approvers, approver]
  );

  const filteredHandoverCandidates = useMemo(() => {
    const keyword = handoverQuery.trim().toLowerCase();

    if (!keyword) {
      return handoverCandidates;
    }

    return handoverCandidates.filter((item) => {
      const haystack = `${item.name} ${item.position} ${item.department}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [handoverCandidates, handoverQuery]);

  const filteredApprovers = useMemo(() => {
    const keyword = approverQuery.trim().toLowerCase();

    if (!keyword) {
      return approvers;
    }

    return approvers.filter((item) => {
      const haystack = `${item.name} ${item.position} ${item.department}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [approverQuery, approvers]);

  const startHourNumber = startHour === '' ? null : Number(startHour);
  const startMinuteNumber = startMinute === '' ? null : Number(startMinute);
  const endHourNumber = endHour === '' ? null : Number(endHour);

  const isEndHourDisabled = (hour: string): boolean => {
    if (startHourNumber === null) {
      return false;
    }

    return Number(hour) < startHourNumber;
  };

  const isEndMinuteDisabled = (minute: string): boolean => {
    if (startHourNumber === null || startMinuteNumber === null || endHourNumber === null) {
      return false;
    }

    if (endHourNumber < startHourNumber) {
      return true;
    }

    if (endHourNumber > startHourNumber) {
      return false;
    }

    return Number(minute) < startMinuteNumber;
  };

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (handoverDropdownRef.current && !handoverDropdownRef.current.contains(target)) {
        setIsHandoverOpen(false);
      }

      if (approverDropdownRef.current && !approverDropdownRef.current.contains(target)) {
        setIsApproverOpen(false);
      }
    }

    window.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (leaveMode === 'full_day') {
      if (!startDate) nextErrors.startDate = 'Vui long chon ngay bat dau';
      if (!endDate) nextErrors.endDate = 'Vui long chon ngay ket thuc';
      if (startDate && endDate && endDate <= startDate) {
        nextErrors.endDate = 'Ngay ket thuc phai sau ngay bat dau';
      }
    } else {
      if (!singleDate) nextErrors.singleDate = 'Vui long chon ngay nghi';
      if (!startHour || !startMinute) nextErrors.startTime = 'Vui long chon gio bat dau';
      if (!endHour || !endMinute) nextErrors.endTime = 'Vui long chon gio ket thuc';

      const startTimeValue = startHour && startMinute ? `${startHour}:${startMinute}` : '';
      const endTimeValue = endHour && endMinute ? `${endHour}:${endMinute}` : '';

      if (startTimeValue && endTimeValue && endTimeValue < startTimeValue) {
        nextErrors.endTime = 'Den gio phai bang hoac sau Tu gio';
      }
    }

    if (!reason.trim()) {
      nextErrors.reason = 'Vui long nhap ly do';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const payload: LeaveFormPayload = {
      type: selectedType,
      startDate: leaveMode === 'full_day' ? startDate : singleDate,
      endDate: leaveMode === 'full_day' ? endDate : singleDate,
      startTime: leaveMode === 'hourly' ? `${startHour}:${startMinute}` : null,
      endTime: leaveMode === 'hourly' ? `${endHour}:${endMinute}` : null,
      reason: reason.trim(),
      handoverTo: handoverTo || null,
      handoverNote: handoverNote.trim() || null,
      approver: approver || null,
    };

    setIsSubmitting(true);

    try {
      await createLeave(payload);
      navigate('/leave');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Khong the tao don nghi phep');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/leave" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </Link>
        <h1 className="text-lg font-heading font-bold text-foreground-950">Tao don xin nghi</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-accent-50 border border-accent-200/50 rounded-xl p-3.5 flex items-center gap-3">
          <span className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center shrink-0">
            <i className="ri-calendar-check-line text-lg text-accent-600"></i>
          </span>
          <div>
            <p className="text-xs text-foreground-500">Ngay phep con lai</p>
            <p className="text-lg font-heading font-bold text-accent-600">{user?.annualLeave ?? 0} ngay</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Loai nghi phep</label>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as LeaveType)}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
          >
            {leaveTypes.map((item) => (
              <option key={item} value={item}>{leaveTypeLabels[item]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Hinh thuc nghi</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLeaveMode('full_day')}
              className={`rounded-xl px-3 py-2 text-sm ${leaveMode === 'full_day' ? 'bg-primary-500 text-white' : 'bg-background-100 text-foreground-700'}`}
            >
              Ca ngay
            </button>
            <button
              type="button"
              onClick={() => setLeaveMode('hourly')}
              className={`rounded-xl px-3 py-2 text-sm ${leaveMode === 'hourly' ? 'bg-primary-500 text-white' : 'bg-background-100 text-foreground-700'}`}
            >
              Theo gio
            </button>
          </div>
        </div>

        {leaveMode === 'full_day' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Ngay bat dau</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  const nextStartDate = event.target.value;
                  setStartDate(nextStartDate);
                  if (endDate && endDate <= nextStartDate) {
                    setEndDate('');
                  }
                }}
                className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
              />
              {errors.startDate && <p className="text-xs text-primary-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Ngay ket thuc</label>
              <input
                type="date"
                value={endDate}
                min={getNextDate(startDate) || undefined}
                onChange={(event) => {
                  const selectedEndDate = event.target.value;

                  if (startDate && selectedEndDate && selectedEndDate <= startDate) {
                    setErrors((prev) => ({
                      ...prev,
                      endDate: 'Ngay ket thuc phai sau ngay bat dau',
                    }));
                    return;
                  }

                  setErrors((prev) => ({ ...prev, endDate: '' }));
                  setEndDate(selectedEndDate);
                }}
                className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
              />
              {errors.endDate && <p className="text-xs text-primary-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Ngay nghi</label>
              <input type="date" value={singleDate} onChange={(event) => setSingleDate(event.target.value)} className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm" />
              {errors.singleDate && <p className="text-xs text-primary-500 mt-1">{errors.singleDate}</p>}
            </div>
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Tu gio</label>
              <div className="flex items-center gap-2">
                <select
                  value={startHour}
                  onChange={(event) => {
                    const nextStartHour = event.target.value;
                    setStartHour(nextStartHour);

                    if (endHour && nextStartHour && Number(endHour) < Number(nextStartHour)) {
                      setEndHour('');
                      setEndMinute('');
                    }

                    setErrors((prev) => ({ ...prev, startTime: '', endTime: '' }));
                  }}
                  className="w-full rounded-xl border border-background-200 bg-background-50 px-2.5 py-2.5 text-sm"
                >
                  <option value="">Gio</option>
                  {HOUR_OPTIONS.map((hour) => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
                <span className="text-sm text-foreground-500">:</span>
                <select
                  value={startMinute}
                  onChange={(event) => {
                    const nextStartMinute = event.target.value;
                    setStartMinute(nextStartMinute);

                    if (
                      endHour &&
                      startHour &&
                      endMinute &&
                      endHour === startHour &&
                      nextStartMinute !== '' &&
                      Number(endMinute) < Number(nextStartMinute)
                    ) {
                      setEndMinute('');
                    }

                    setErrors((prev) => ({ ...prev, startTime: '', endTime: '' }));
                  }}
                  className="w-full rounded-xl border border-background-200 bg-background-50 px-2.5 py-2.5 text-sm"
                >
                  <option value="">Phut</option>
                  {MINUTE_OPTIONS.map((minute) => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>
              {errors.startTime && <p className="text-xs text-primary-500 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Den gio</label>
              <div className="flex items-center gap-2">
                <select
                  value={endHour}
                  onChange={(event) => {
                    const nextEndHour = event.target.value;
                    setEndHour(nextEndHour);

                    if (
                      nextEndHour &&
                      startHour &&
                      endMinute &&
                      startMinute &&
                      Number(nextEndHour) === Number(startHour) &&
                      Number(endMinute) < Number(startMinute)
                    ) {
                      setEndMinute('');
                    }

                    setErrors((prev) => ({ ...prev, endTime: '' }));
                  }}
                  className="w-full rounded-xl border border-background-200 bg-background-50 px-2.5 py-2.5 text-sm"
                >
                  <option value="">Gio</option>
                  {HOUR_OPTIONS.map((hour) => (
                    <option key={hour} value={hour} disabled={isEndHourDisabled(hour)}>
                      {hour}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-foreground-500">:</span>
                <select
                  value={endMinute}
                  onChange={(event) => {
                    setEndMinute(event.target.value);
                    setErrors((prev) => ({ ...prev, endTime: '' }));
                  }}
                  className="w-full rounded-xl border border-background-200 bg-background-50 px-2.5 py-2.5 text-sm"
                >
                  <option value="">Phut</option>
                  {MINUTE_OPTIONS.map((minute) => (
                    <option key={minute} value={minute} disabled={isEndMinuteDisabled(minute)}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
              {errors.endTime && <p className="text-xs text-primary-500 mt-1">{errors.endTime}</p>}
            </div>
          </div>
        )}

        <div ref={handoverDropdownRef} className="relative">
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Nguoi ban giao</label>
          <button
            type="button"
            disabled={loadingEmployees}
            onClick={() => {
              setIsHandoverOpen((prev) => !prev);
              setIsApproverOpen(false);
            }}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm text-left flex items-center justify-between disabled:opacity-60"
          >
            <span className={selectedHandover ? 'text-foreground-900' : 'text-foreground-400'}>
              {selectedHandover ? `${selectedHandover.name} - ${selectedHandover.position}` : 'Khong chon'}
            </span>
            <i className={`ri-arrow-down-s-line text-base text-foreground-500 transition-transform ${isHandoverOpen ? 'rotate-180' : ''}`}></i>
          </button>

          {isHandoverOpen && !loadingEmployees && (
            <div className="absolute z-30 mt-1 w-full rounded-xl border border-background-200 bg-background-50 shadow-lg p-2">
              <input
                value={handoverQuery}
                onChange={(event) => setHandoverQuery(event.target.value)}
                placeholder="Tim nguoi ban giao..."
                className="w-full rounded-lg border border-background-200 bg-background-50 px-3 py-2 text-sm mb-2"
              />
              <div className="max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setHandoverTo('');
                    setHandoverQuery('');
                    setIsHandoverOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-background-100"
                >
                  Khong chon
                </button>
                {filteredHandoverCandidates.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setHandoverTo(item.code);
                      setHandoverQuery('');
                      setIsHandoverOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-background-100 ${
                      handoverTo === item.code ? 'bg-accent-50 text-accent-700' : ''
                    }`}
                  >
                    <p className="font-medium text-foreground-900">{item.name}</p>
                    <p className="text-xs text-foreground-500">{item.position} - {item.department}</p>
                  </button>
                ))}
                {filteredHandoverCandidates.length === 0 && (
                  <p className="px-3 py-2 text-xs text-foreground-500">Khong tim thay nguoi ban giao phu hop</p>
                )}
              </div>
            </div>
          )}
          <p className="mt-1 text-[11px] text-foreground-500">Nguoi ban giao khong duoc trung ten voi nguoi lam phieu.</p>
        </div>

        <div ref={approverDropdownRef} className="relative">
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Nguoi duyet</label>
          <button
            type="button"
            disabled={loadingEmployees}
            onClick={() => {
              setIsApproverOpen((prev) => !prev);
              setIsHandoverOpen(false);
            }}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm text-left flex items-center justify-between disabled:opacity-60"
          >
            <span className={selectedApprover ? 'text-foreground-900' : 'text-foreground-400'}>
              {selectedApprover ? `${selectedApprover.name} - ${selectedApprover.position}` : 'Khong chon'}
            </span>
            <i className={`ri-arrow-down-s-line text-base text-foreground-500 transition-transform ${isApproverOpen ? 'rotate-180' : ''}`}></i>
          </button>

          {isApproverOpen && !loadingEmployees && (
            <div className="absolute z-30 mt-1 w-full rounded-xl border border-background-200 bg-background-50 shadow-lg p-2">
              <input
                value={approverQuery}
                onChange={(event) => setApproverQuery(event.target.value)}
                placeholder="Tim nguoi duyet..."
                className="w-full rounded-lg border border-background-200 bg-background-50 px-3 py-2 text-sm mb-2"
              />
              <div className="max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setApprover('');
                    setApproverQuery('');
                    setIsApproverOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-background-100"
                >
                  Khong chon
                </button>
                {filteredApprovers.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setApprover(item.code);
                      setApproverQuery('');
                      setIsApproverOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-background-100 ${
                      approver === item.code ? 'bg-accent-50 text-accent-700' : ''
                    }`}
                  >
                    <p className="font-medium text-foreground-900">{item.name}</p>
                    <p className="text-xs text-foreground-500">{item.position} - {item.department}</p>
                  </button>
                ))}
                {filteredApprovers.length === 0 && (
                  <p className="px-3 py-2 text-xs text-foreground-500">Khong tim thay nguoi duyet phu hop</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Ghi chu ban giao</label>
          <textarea
            value={handoverNote}
            onChange={(event) => setHandoverNote(event.target.value)}
            rows={2}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Ly do</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
          />
          {errors.reason && <p className="text-xs text-primary-500 mt-1">{errors.reason}</p>}
        </div>

        {submitError && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{submitError}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Dang gui...' : 'Gui don nghi phep'}
        </button>
      </form>
    </div>
  );
}
