import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchLeaveById,
  fetchLeaveEmployees,
  leaveTypeLabels,
  updateLeave,
  type EmployeeOption,
  type LeaveFormPayload,
  type LeaveRecord,
  type LeaveType,
} from '../api';

type LeaveMode = 'full_day' | 'hourly';

const leaveTypes: LeaveType[] = [
  'annual_leave',
  'unpaid_leave',
  'marriage_leave',
  'bereavement_leave',
  'business_trip',
  'women_policy',
  'late_arrival',
  'early_departure',
];

export default function LeaveEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leave, setLeave] = useState<LeaveRecord | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [selectedType, setSelectedType] = useState<LeaveType>('annual_leave');
  const [leaveMode, setLeaveMode] = useState<LeaveMode>('full_day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [handoverTo, setHandoverTo] = useState('');
  const [handoverNote, setHandoverNote] = useState('');
  const [approver, setApprover] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError(null);

      try {
        const [loadedLeave, loadedEmployees] = await Promise.all([
          fetchLeaveById(id),
          fetchLeaveEmployees(),
        ]);

        setLeave(loadedLeave);
        setEmployees(loadedEmployees);

        setSelectedType(loadedLeave.type);
        if (loadedLeave.startTime || loadedLeave.endTime) {
          setLeaveMode('hourly');
          setSingleDate(loadedLeave.startDate);
          setStartTime(loadedLeave.startTime ?? '');
          setEndTime(loadedLeave.endTime ?? '');
        } else {
          setLeaveMode('full_day');
          setStartDate(loadedLeave.startDate);
          setEndDate(loadedLeave.endDate);
        }

        setReason(loadedLeave.reason);
        setHandoverTo(loadedLeave.handoverTo ?? '');
        setHandoverNote(loadedLeave.handoverNote ?? '');
        setApprover(loadedLeave.approver ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong the tai du lieu don nghi phep');
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, [id]);

  const approvers = useMemo(() => {
    return employees.filter((item) => ['admin', 'manager', 'hr', 'accountant'].includes(item.role.toLowerCase()));
  }, [employees]);

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (leaveMode === 'full_day') {
      if (!startDate) nextErrors.startDate = 'Vui long chon ngay bat dau';
      if (!endDate) nextErrors.endDate = 'Vui long chon ngay ket thuc';
      if (startDate && endDate && endDate < startDate) {
        nextErrors.endDate = 'Ngay ket thuc phai sau ngay bat dau';
      }
    } else {
      if (!singleDate) nextErrors.singleDate = 'Vui long chon ngay nghi';
      if (!startTime) nextErrors.startTime = 'Vui long chon gio bat dau';
      if (!endTime) nextErrors.endTime = 'Vui long chon gio ket thuc';
      if (startTime && endTime && startTime >= endTime) {
        nextErrors.endTime = 'Gio ket thuc phai sau gio bat dau';
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

    if (!leave) {
      return;
    }

    if (leave.status !== 'pending') {
      setError('Chi don cho duyet moi duoc chinh sua');
      return;
    }

    if (!validate()) {
      return;
    }

    const payload: LeaveFormPayload = {
      type: selectedType,
      startDate: leaveMode === 'full_day' ? startDate : singleDate,
      endDate: leaveMode === 'full_day' ? endDate : singleDate,
      startTime: leaveMode === 'hourly' ? startTime : null,
      endTime: leaveMode === 'hourly' ? endTime : null,
      reason: reason.trim(),
      handoverTo: handoverTo || null,
      handoverNote: handoverNote.trim() || null,
      approver: approver || null,
    };

    setSaving(true);
    setError(null);

    try {
      await updateLeave(leave.id, payload);
      navigate(`/leave/${leave.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the cap nhat don nghi phep');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-8">
        <div className="skeleton h-24"></div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="px-4 pt-6 pb-8">
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">Khong tim thay don nghi phep</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/leave/${leave.id}`} className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </Link>
        <h1 className="text-lg font-heading font-bold text-foreground-950">Chinh sua don nghi</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Loai nghi phep</label>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as LeaveType)}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
            disabled={leave.status !== 'pending'}
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
              disabled={leave.status !== 'pending'}
            >
              Ca ngay
            </button>
            <button
              type="button"
              onClick={() => setLeaveMode('hourly')}
              className={`rounded-xl px-3 py-2 text-sm ${leaveMode === 'hourly' ? 'bg-primary-500 text-white' : 'bg-background-100 text-foreground-700'}`}
              disabled={leave.status !== 'pending'}
            >
              Theo gio
            </button>
          </div>
        </div>

        {leaveMode === 'full_day' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Ngay bat dau</label>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm" disabled={leave.status !== 'pending'} />
              {errors.startDate && <p className="text-xs text-primary-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Ngay ket thuc</label>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm" disabled={leave.status !== 'pending'} />
              {errors.endDate && <p className="text-xs text-primary-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Ngay nghi</label>
              <input type="date" value={singleDate} onChange={(event) => setSingleDate(event.target.value)} className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm" disabled={leave.status !== 'pending'} />
              {errors.singleDate && <p className="text-xs text-primary-500 mt-1">{errors.singleDate}</p>}
            </div>
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Tu gio</label>
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm" disabled={leave.status !== 'pending'} />
              {errors.startTime && <p className="text-xs text-primary-500 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm text-foreground-700 mb-1">Den gio</label>
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm" disabled={leave.status !== 'pending'} />
              {errors.endTime && <p className="text-xs text-primary-500 mt-1">{errors.endTime}</p>}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Nguoi ban giao</label>
          <select
            value={handoverTo}
            onChange={(event) => setHandoverTo(event.target.value)}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
            disabled={leave.status !== 'pending'}
          >
            <option value="">Khong chon</option>
            {employees.filter((item) => item.code !== leave.userId).map((item) => (
              <option key={item.code} value={item.code}>{item.name} - {item.position}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Nguoi duyet</label>
          <select
            value={approver}
            onChange={(event) => setApprover(event.target.value)}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
            disabled={leave.status !== 'pending'}
          >
            <option value="">Khong chon</option>
            {approvers.map((item) => (
              <option key={item.code} value={item.code}>{item.name} - {item.position}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Ghi chu ban giao</label>
          <textarea
            value={handoverNote}
            onChange={(event) => setHandoverNote(event.target.value)}
            rows={2}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
            disabled={leave.status !== 'pending'}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground-900 mb-1">Ly do</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-background-200 bg-background-50 px-3 py-2.5 text-sm"
            disabled={leave.status !== 'pending'}
          />
          {errors.reason && <p className="text-xs text-primary-500 mt-1">{errors.reason}</p>}
        </div>

        {error && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving || leave.status !== 'pending'}
          className="w-full rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {saving ? 'Dang cap nhat...' : 'Cap nhat don nghi'}
        </button>
      </form>
    </div>
  );
}
