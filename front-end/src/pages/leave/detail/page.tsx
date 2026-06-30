import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockLeaves, leaveTypeLabels, leaveTypeIcons, leaveTypeColors, leaveStatusLabels, leaveStatusColors } from '@/mocks/leaves';
import { mockUsers } from '@/mocks/users';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getLunchDeductMinutes, getLunchBreakLabel, getDailyWorkMinutes, formatDaysFromMinutes } from '@/utils/workRules';

function calcDuration(startDate: string, endDate: string, startTime: string | null, endTime: string | null, department: string) {
  if (startTime && endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startTotalMin = sh * 60 + sm;
    const endTotalMin = eh * 60 + em;
    let totalMinutes = endTotalMin - startTotalMin;
    if (totalMinutes < 0) totalMinutes = 0;
    const lunchDeduct = getLunchDeductMinutes(department, startTotalMin, endTotalMin);
    if (totalMinutes > 0) totalMinutes = Math.max(0, totalMinutes - lunchDeduct);
    const hours = totalMinutes / 60;
    const daysFormatted = formatDaysFromMinutes(department, totalMinutes);
    return { hasLunchDeduct: lunchDeduct > 0, lunchLabel: lunchDeduct > 0 ? getLunchBreakLabel(department) : '', totalMinutes, hours, daysFormatted };
  }
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return { hasLunchDeduct: false, lunchLabel: '', totalMinutes: null, hours: null, daysFormatted: null, diffDays };
}

export default function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const leave = mockLeaves.find((l) => l.id === id);

  if (!leave) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-file-unknow-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm font-medium text-foreground-600 mb-2">Không tìm thấy đơn nghỉ phép</p>
          <Link to="/leave" className="text-xs text-primary-500 font-medium hover:text-primary-600 transition-colors cursor-pointer">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const requester = mockUsers.find((u) => u.id === leave.userId);
  const requesterDept = requester?.department ?? 'Kinh Doanh';
  const handoverPerson = leave.handoverTo ? mockUsers.find((u) => u.id === leave.handoverTo) : null;
  const approverPerson = leave.approver ? mockUsers.find((u) => u.id === leave.approver) : null;

  const startParsed = parseISO(leave.startDate);
  const endParsed = parseISO(leave.endDate);
  const duration = calcDuration(leave.startDate, leave.endDate, leave.startTime, leave.endTime, requesterDept);

  const isHourly = !!leave.startTime || !!leave.endTime;
  const typeColor = leaveTypeColors[leave.type];
  const typeIcon = leaveTypeIcons[leave.type];
  const typeLabel = leaveTypeLabels[leave.type];
  const statusColor = leaveStatusColors[leave.status];
  const statusLabel = leaveStatusLabels[leave.status];

  const isPending = leave.status === 'pending';

  const handleDelete = () => {
    const idx = mockLeaves.findIndex((l) => l.id === leave.id);
    if (idx !== -1) {
      mockLeaves.splice(idx, 1);
    }
    navigate('/leave');
  };

  return (
    <div className="px-4 pt-6 pb-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0"
        >
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </button>
        <h1 className="text-lg font-heading font-bold text-foreground-950 flex-1">Chi tiết đơn nghỉ</h1>
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 mb-5">
        <Link
          to={isPending ? `/leave/${id}/edit` : '#'}
          onClick={(e) => { if (!isPending) e.preventDefault(); }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
            isPending
              ? 'bg-background-50 border border-background-200/70 text-foreground-700 hover:border-primary-300 hover:text-primary-600 cursor-pointer'
              : 'bg-background-100 border border-background-100 text-foreground-300 cursor-not-allowed'
          }`}
          title={!isPending ? 'Chỉ có thể chỉnh sửa đơn đang chờ duyệt' : 'Chỉnh sửa đơn'}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-edit-line text-sm"></i>
          </span>
          Chỉnh sửa
        </Link>
        <button
          type="button"
          onClick={() => { if (isPending) setShowDeleteConfirm(true); }}
          disabled={!isPending}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
            isPending
              ? 'bg-background-50 border border-background-200/70 text-primary-500 hover:border-primary-300 hover:bg-primary-50 cursor-pointer'
              : 'bg-background-100 border border-background-100 text-foreground-300 cursor-not-allowed'
          }`}
          title={!isPending ? 'Chỉ có thể xoá đơn đang chờ duyệt' : 'Xoá đơn'}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-delete-bin-line text-sm"></i>
          </span>
          Xoá
        </button>
      </div>

      {/* Leave type + reason card */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className={`w-11 h-11 ${typeColor} rounded-xl flex items-center justify-center shrink-0`}>
            <i className={`${typeIcon} text-xl`}></i>
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-heading font-semibold text-foreground-950">{typeLabel}</h2>
            <p className="text-xs text-foreground-500 mt-0.5">
              Người tạo: <span className="text-foreground-700 font-medium">{requester?.name ?? leave.userId}</span>
              {requester && <span className="text-foreground-400"> — {requester.department}</span>}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div>
          <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-1.5">Lý do</p>
          <p className="text-sm text-foreground-700 leading-relaxed">{leave.reason}</p>
        </div>
      </div>

      {/* Date & Time card */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
        <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-3">Thời gian nghỉ</p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-background-100 rounded-lg p-3">
            <p className="text-[10px] font-medium text-foreground-400 uppercase tracking-wide mb-1">Từ</p>
            <p className="text-sm font-semibold text-foreground-900">
              {format(startParsed, 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
            {leave.startTime && (
              <p className="text-xs text-foreground-500 mt-0.5">Lúc {leave.startTime}</p>
            )}
          </div>

          <div className="w-8 flex items-center justify-center">
            <i className="ri-arrow-right-line text-foreground-300 text-lg"></i>
          </div>

          <div className="flex-1 bg-background-100 rounded-lg p-3">
            <p className="text-[10px] font-medium text-foreground-400 uppercase tracking-wide mb-1">Đến</p>
            <p className="text-sm font-semibold text-foreground-900">
              {format(endParsed, 'EEEE, dd/MM/yyyy', { locale: vi })}
            </p>
            {leave.endTime && (
              <p className="text-xs text-foreground-500 mt-0.5">Lúc {leave.endTime}</p>
            )}
          </div>
        </div>

        {/* Duration summary */}
        {isHourly && duration.totalMinutes !== null ? (
          <div className="bg-accent-50 border border-accent-200/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-5 h-5 flex items-center justify-center text-accent-600">
                <i className="ri-time-line"></i>
              </span>
              <span className="text-foreground-600">
                Tổng: <strong className="text-foreground-900">{duration.hours?.toFixed(1)} giờ</strong>
                {duration.hasLunchDeduct && (
                  <span className="text-foreground-400"> − <span className="font-semibold text-primary-500">{duration.lunchLabel}</span></span>
                )}
                {' '}≈ <strong className="text-accent-700">{duration.daysFormatted} ngày</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-accent-50 border border-accent-200/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-5 h-5 flex items-center justify-center text-accent-600">
                <i className="ri-calendar-check-line"></i>
              </span>
              <span className="text-foreground-600">
                Tổng: <strong className="text-accent-700">{duration.diffDays} ngày</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Handover card */}
      {leave.handoverTo && handoverPerson && (
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
          <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-3">Bàn giao công việc</p>
          <div className="flex items-center gap-3 mb-3">
            <img
              src={handoverPerson.avatar}
              alt={handoverPerson.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-background-100"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground-900">{handoverPerson.name}</p>
              <p className="text-xs text-foreground-500">{handoverPerson.position} — {handoverPerson.department}</p>
            </div>
          </div>
          {leave.handoverNote && (
            <div className="bg-secondary-50 border border-secondary-200/40 rounded-lg px-3 py-2.5">
              <p className="text-[11px] font-medium text-foreground-400 mb-1">Ghi chú bàn giao</p>
              <p className="text-xs text-foreground-700 leading-relaxed">{leave.handoverNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Approver card */}
      {approverPerson && (
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
          <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-3">
            {leave.status === 'pending' ? 'Gửi duyệt cho' : 'Người duyệt'}
          </p>
          <div className="flex items-center gap-3">
            <img
              src={approverPerson.avatar}
              alt={approverPerson.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-background-100"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground-900">{approverPerson.name}</p>
              <p className="text-xs text-foreground-500">{approverPerson.position} — {approverPerson.department}</p>
            </div>
            {leave.status !== 'pending' && (
              <span className={`ml-auto inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap ${leave.status === 'approved' ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'}`}>
                {leave.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
              </span>
            )}
          </div>
          {leave.approvedBy && (
            <p className="text-xs text-foreground-500 mt-2 ml-[52px]">
              {leave.status === 'approved' ? 'Được duyệt bởi' : 'Được xử lý bởi'}: <span className="font-medium text-foreground-700">{leave.approvedBy}</span>
            </p>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {leave.status === 'rejected' && leave.rejectedReason && (
        <div className="bg-primary-50 border border-primary-200/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <i className="ri-close-line text-sm text-primary-600"></i>
            </span>
            <div>
              <p className="text-xs font-semibold text-primary-700 mb-1">Lý do từ chối</p>
              <p className="text-sm text-primary-800 leading-relaxed">{leave.rejectedReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-4 text-[11px] text-foreground-400 mt-5">
        <span>Mã đơn: <span className="font-medium text-foreground-500">{leave.id}</span></span>
        <span className="w-1 h-1 rounded-full bg-foreground-300"></span>
        <span>Tạo lúc: {format(parseISO(leave.createdAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="relative bg-background-50 rounded-2xl w-full max-w-sm p-6 animate-[fadeInUp_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center mb-5">
              <span className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                <i className="ri-error-warning-line text-2xl text-primary-500"></i>
              </span>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-1">Xoá đơn nghỉ phép?</h3>
              <p className="text-sm text-foreground-500 leading-relaxed">
                Bạn có chắc muốn xoá đơn <strong className="text-foreground-700">{leaveTypeLabels[leave.type]}</strong> này? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-background-100 text-foreground-600 hover:bg-background-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}