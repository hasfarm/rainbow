import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  decideLeave,
  deleteLeave,
  fetchLeaveById,
  fetchLeaveEmployees,
  leaveStatusColors,
  leaveStatusLabels,
  leaveTypeColors,
  leaveTypeIcons,
  leaveTypeLabels,
  type EmployeeOption,
  type LeaveRecord,
} from '../api';
import { getLunchDeductMinutes, getLunchBreakLabel, getDailyWorkMinutes, formatDaysFromMinutes } from '@/utils/workRules';
import { AuthContext } from '@/hooks/useAuth';

function calcDuration(startDate: string, endDate: string, startTime: string | null, endTime: string | null, department: string) {
  if (startTime && endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startTotalMin = sh * 60 + sm;
    const endTotalMin = eh * 60 + em;
    let totalMinutes = Math.max(0, endTotalMin - startTotalMin);
    const lunchDeduct = getLunchDeductMinutes(department, startTotalMin, endTotalMin);
    totalMinutes = Math.max(0, totalMinutes - lunchDeduct);

    return {
      totalMinutes,
      hours: totalMinutes / 60,
      daysFormatted: formatDaysFromMinutes(department, totalMinutes),
      lunchLabel: lunchDeduct > 0 ? getLunchBreakLabel(department) : '',
      dailyHours: getDailyWorkMinutes(department) / 60,
      hasLunchDeduct: lunchDeduct > 0,
      diffDays: null,
    };
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    totalMinutes: null,
    hours: null,
    daysFormatted: null,
    lunchLabel: '',
    dailyHours: null,
    hasLunchDeduct: false,
    diffDays,
  };
}

export default function LeaveDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [leave, setLeave] = useState<LeaveRecord | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [decisionComment, setDecisionComment] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong the tai chi tiet don nghi');
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, [id]);

  const handoverPerson = useMemo(() => {
    if (!leave?.handoverTo) {
      return null;
    }
    return employees.find((item) => item.code === leave.handoverTo) ?? null;
  }, [employees, leave?.handoverTo]);

  const approverPerson = useMemo(() => {
    if (!leave?.approver) {
      return null;
    }
    return employees.find((item) => item.code === leave.approver) ?? null;
  }, [employees, leave?.approver]);

  async function handleDelete() {
    if (!leave || leave.status !== 'pending') {
      return;
    }

    const confirmed = window.confirm('Ban co chac muon xoa don nghi nay?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteLeave(leave.id);
      navigate('/leave');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the xoa don nghi');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-6 max-w-2xl">
        <div className="skeleton h-28"></div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="px-4 pt-6 pb-6 max-w-2xl">
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{error ?? 'Khong tim thay don nghi phep'}</div>
      </div>
    );
  }

  const startParsed = parseISO(leave.startDate);
  const endParsed = parseISO(leave.endDate);
  const duration = calcDuration(leave.startDate, leave.endDate, leave.startTime, leave.endTime, handoverPerson?.department || approverPerson?.department || 'Kinh Doanh');
  const isPending = leave.status === 'pending';
  const isApprovalMode = new URLSearchParams(location.search).get('mode') === 'approval';
  const isApprover = Boolean(user?.id && leave.approver && user.id === leave.approver);
  const canDecide = isPending && isApprover;
  const statusLabel = leaveStatusLabels[leave.status];
  const statusColor = leaveStatusColors[leave.status];

  async function handleDecision(decision: 'approved' | 'rejected') {
    if (!canDecide) {
      return;
    }

    if (decision === 'rejected' && decisionComment.trim() === '') {
      setError('Vui long nhap comment khi tu choi don.');
      return;
    }

    setIsDeciding(true);
    setError(null);

    try {
      const updated = await decideLeave(leave.id, {
        decision,
        comment: decisionComment.trim(),
      });
      setLeave(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the duyet don nghi');
    } finally {
      setIsDeciding(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0"
        >
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </button>
        <h1 className="text-lg font-heading font-bold text-foreground-950 flex-1">Chi tiet don nghi</h1>
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-2.5 mb-5">
        <Link
          to={isPending ? `/leave/${leave.id}/edit` : '#'}
          onClick={(event) => {
            if (!isPending) {
              event.preventDefault();
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
            isPending
              ? 'bg-background-50 border border-background-200/70 text-foreground-700 hover:border-primary-300 hover:text-primary-600 cursor-pointer'
              : 'bg-background-100 border border-background-100 text-foreground-300 cursor-not-allowed'
          }`}
        >
          <i className="ri-edit-line text-sm"></i>
          Chinh sua
        </Link>

        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={!isPending || isDeleting}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
            isPending
              ? 'bg-background-50 border border-background-200/70 text-primary-500 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
              : 'bg-background-100 border border-background-100 text-foreground-300 cursor-not-allowed'
          }`}
        >
          <i className="ri-delete-bin-line text-sm"></i>
          {isDeleting ? 'Dang xoa...' : 'Xoa'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700 mb-4">{error}</div>
      )}

      {canDecide && (
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
          <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-2">Duyet don</p>
          <p className="text-xs text-foreground-600 mb-3">Them comment de nguoi gui biet ly do phe duyet hoac tu choi.</p>

          <textarea
            value={decisionComment}
            onChange={(event) => setDecisionComment(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Nhap comment khi duyet/tu choi..."
            className="w-full px-3 py-2.5 rounded-lg border border-background-200/70 bg-background-100 text-sm text-foreground-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 resize-none"
          />

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => void handleDecision('approved')}
              disabled={isDeciding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className="ri-check-line text-sm"></i>
              {isDeciding ? 'Dang xu ly...' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => void handleDecision('rejected')}
              disabled={isDeciding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className="ri-close-line text-sm"></i>
              {isDeciding ? 'Dang xu ly...' : 'Reject'}
            </button>
          </div>
        </div>
      )}

      {isApprovalMode && !canDecide && (
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 mb-4 text-xs text-foreground-600">
          Don nay khong o trang thai cho duyet hoac ban khong phai nguoi duyet.
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className={`w-11 h-11 ${leaveTypeColors[leave.type]} rounded-xl flex items-center justify-center shrink-0`}>
            <i className={`${leaveTypeIcons[leave.type]} text-xl`}></i>
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-heading font-semibold text-foreground-950">{leaveTypeLabels[leave.type]}</h2>
            <p className="text-xs text-foreground-500 mt-0.5">Ma don: {leave.id}</p>
          </div>
        </div>

        <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-1.5">Ly do</p>
        <p className="text-sm text-foreground-700 leading-relaxed">{leave.reason}</p>
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
        <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-3">Thoi gian nghi</p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-background-100 rounded-lg p-3">
            <p className="text-[10px] font-medium text-foreground-400 uppercase tracking-wide mb-1">Tu</p>
            <p className="text-sm font-semibold text-foreground-900">{format(startParsed, 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
            {leave.startTime && <p className="text-xs text-foreground-500 mt-0.5">Luc {leave.startTime}</p>}
          </div>

          <div className="w-8 flex items-center justify-center">
            <i className="ri-arrow-right-line text-foreground-300 text-lg"></i>
          </div>

          <div className="flex-1 bg-background-100 rounded-lg p-3">
            <p className="text-[10px] font-medium text-foreground-400 uppercase tracking-wide mb-1">Den</p>
            <p className="text-sm font-semibold text-foreground-900">{format(endParsed, 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
            {leave.endTime && <p className="text-xs text-foreground-500 mt-0.5">Luc {leave.endTime}</p>}
          </div>
        </div>

        {duration.totalMinutes !== null ? (
          <div className="bg-accent-50 border border-accent-200/50 rounded-lg px-3 py-2.5 text-xs text-foreground-600">
            <p>
              Tong: <strong className="text-foreground-900">{duration.hours?.toFixed(1)} gio</strong>
              {duration.hasLunchDeduct && (
                <span className="text-foreground-400"> - <span className="font-semibold text-primary-500">{duration.lunchLabel}</span></span>
              )}
              {' '}~ <strong className="text-accent-700">{duration.daysFormatted} ngay</strong>
              {duration.dailyHours && <span className="text-foreground-400"> (/{duration.dailyHours}h)</span>}
            </p>
          </div>
        ) : (
          <div className="bg-accent-50 border border-accent-200/50 rounded-lg px-3 py-2.5 text-xs text-foreground-600">
            Tong: <strong className="text-accent-700">{duration.diffDays} ngay</strong>
          </div>
        )}
      </div>

      {handoverPerson && (
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
          <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-2">Nguoi ban giao</p>
          <p className="text-sm font-semibold text-foreground-900">{handoverPerson.name}</p>
          <p className="text-xs text-foreground-500">{handoverPerson.position} - {handoverPerson.department}</p>
          {leave.handoverNote && <p className="text-xs text-foreground-600 mt-2">{leave.handoverNote}</p>}
        </div>
      )}

      {approverPerson && (
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
          <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-2">Nguoi duyet</p>
          <p className="text-sm font-semibold text-foreground-900">{approverPerson.name}</p>
          <p className="text-xs text-foreground-500">{approverPerson.position} - {approverPerson.department}</p>
        </div>
      )}

      {leave.rejectedReason && (
        <div className="bg-primary-50 border border-primary-200/70 rounded-xl p-4 mb-4">
          <p className="text-[11px] font-medium text-primary-700 uppercase tracking-wide mb-1.5">Comment nguoi duyet</p>
          <p className="text-sm text-primary-800">{leave.rejectedReason}</p>
        </div>
      )}

      <div className="text-[11px] text-foreground-400">
        Tao luc: {format(parseISO(leave.createdAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}
      </div>
    </div>
  );
}
