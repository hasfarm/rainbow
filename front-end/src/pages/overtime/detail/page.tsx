import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockOvertimes, overtimeTypeLabels, overtimeTypeIcons, overtimeTypeColors, overtimeStatusLabels, overtimeStatusColors, overtimeStatusIcons, type OvertimeType } from '@/mocks/overtimes';
import { mockUsers } from '@/mocks/users';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatDaysEquivalent, getDailyWorkHours } from '@/utils/workRules';

function getWeightMultiplier(type: OvertimeType): number {
  if (type === 'weekend') return 2;
  if (type === 'holiday') return 3;
  return 1;
}

export default function OvertimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const overtime = mockOvertimes.find((o) => o.id === id);

  if (!overtime) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-file-unknow-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm font-medium text-foreground-600 mb-2">Không tìm thấy phiếu tăng ca</p>
          <Link to="/overtime" className="text-xs text-primary-500 font-medium hover:text-primary-600 transition-colors cursor-pointer">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const requester = mockUsers.find((u) => u.id === overtime.userId);
  const approverPerson = overtime.approverId ? mockUsers.find((u) => u.id === overtime.approverId) : null;
  const approver2Person = overtime.approver2Id ? mockUsers.find((u) => u.id === overtime.approver2Id) : null;

  const multiplier = getWeightMultiplier(overtime.overtimeType);
  const weightedHours = overtime.hours * multiplier;
  const dept = requester?.department ?? 'Kinh Doanh';
  const workHours = getDailyWorkHours(dept);
  const daysEquivalent = formatDaysEquivalent(dept, weightedHours);

  const typeColor = overtimeTypeColors[overtime.overtimeType];
  const typeIcon = overtimeTypeIcons[overtime.overtimeType];
  const typeLabel = overtimeTypeLabels[overtime.overtimeType];
  const statusColor = overtimeStatusColors[overtime.status];
  const statusLabel = overtimeStatusLabels[overtime.status];
  const statusIcon = overtimeStatusIcons[overtime.status];

  const isPending = overtime.status === 'pending';

  const dateParsed = parseISO(overtime.date);
  const dayOfWeek = format(dateParsed, 'EEEE', { locale: vi });
  const formattedDate = format(dateParsed, 'dd/MM/yyyy', { locale: vi });

  const handleDelete = () => {
    const idx = mockOvertimes.findIndex((o) => o.id === overtime.id);
    if (idx !== -1) {
      mockOvertimes.splice(idx, 1);
    }
    navigate('/overtime');
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
        <h1 className="text-lg font-heading font-bold text-foreground-950 flex-1">Chi tiết phiếu tăng ca</h1>
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColor}`}>
          <span className="w-3.5 h-3.5 flex items-center justify-center">
            <i className={`${statusIcon} text-[11px]`}></i>
          </span>
          {statusLabel}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 mb-5">
        <Link
          to={isPending ? `/overtime/${id}/edit` : '#'}
          onClick={(e) => { if (!isPending) e.preventDefault(); }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
            isPending
              ? 'bg-background-50 border border-background-200/70 text-foreground-700 hover:border-primary-300 hover:text-primary-600 cursor-pointer'
              : 'bg-background-100 border border-background-100 text-foreground-300 cursor-not-allowed'
          }`}
          title={!isPending ? 'Chỉ có thể chỉnh sửa phiếu đang chờ duyệt' : 'Chỉnh sửa phiếu'}
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
          title={!isPending ? 'Chỉ có thể xoá phiếu đang chờ duyệt' : 'Xoá phiếu'}
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-delete-bin-line text-sm"></i>
          </span>
          Xoá
        </button>
      </div>

      {/* Overtime type + reason card */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className={`w-11 h-11 ${typeColor} rounded-xl flex items-center justify-center shrink-0`}>
            <i className={`${typeIcon} text-xl`}></i>
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-heading font-semibold text-foreground-950">{typeLabel}</h2>
            <p className="text-xs text-foreground-500 mt-0.5">
              Người tạo: <span className="text-foreground-700 font-medium">{requester?.name ?? overtime.userId}</span>
              {requester && <span className="text-foreground-400"> — {requester.department}</span>}
            </p>
          </div>
        </div>

        {/* Reason */}
        <div>
          <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-1.5">Lý do</p>
          <p className="text-sm text-foreground-700 leading-relaxed">{overtime.reason}</p>
        </div>
      </div>

      {/* Date & Time card */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
        <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-3">Thời gian tăng ca</p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-background-100 rounded-lg p-3">
            <p className="text-[10px] font-medium text-foreground-400 uppercase tracking-wide mb-1">Ngày</p>
            <p className="text-sm font-semibold text-foreground-900">
              {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}, {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-background-100 rounded-lg p-3 text-center">
            <p className="text-[10px] font-medium text-foreground-400 uppercase tracking-wide mb-1">Bắt đầu</p>
            <p className="text-lg font-heading font-bold text-foreground-950">{overtime.startTime}</p>
          </div>

          <div className="w-8 flex items-center justify-center">
            <i className="ri-arrow-right-line text-foreground-300 text-lg"></i>
          </div>

          <div className="flex-1 bg-background-100 rounded-lg p-3 text-center">
            <p className="text-[10px] font-medium text-foreground-400 uppercase tracking-wide mb-1">Kết thúc</p>
            <p className="text-lg font-heading font-bold text-foreground-950">{overtime.endTime}</p>
          </div>
        </div>

        {/* Duration summary */}
        <div className="bg-accent-50 border border-accent-200/50 rounded-lg px-3 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-600">Thời gian thực tế</span>
            <span className="text-xs font-semibold text-foreground-950">{overtime.hours} giờ</span>
          </div>
          {multiplier > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-600">
                Hệ số
                <span className={`inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${typeColor}`}>
                  {typeLabel}
                </span>
              </span>
              <span className="text-xs font-semibold text-accent-600">×{multiplier}</span>
            </div>
          )}
          <div className="border-t border-accent-200/50"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-950">Tổng giờ quy đổi</span>
            <span className="text-sm font-heading font-bold text-foreground-950">{weightedHours} giờ</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-500">≈ Ngày công (÷ {workHours})</span>
            <span className="text-xs font-semibold text-accent-600">{daysEquivalent} ngày</span>
          </div>
        </div>
      </div>

      {/* Approvers card */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-4">
        <p className="text-[11px] font-medium text-foreground-400 uppercase tracking-wide mb-3">
          {overtime.status === 'pending' ? 'Gửi duyệt cho' : 'Người duyệt'}
        </p>

        {/* Level 1 */}
        {approverPerson && (
          <div className="flex items-center gap-3 mb-3">
            <img
              src={approverPerson.avatar}
              alt={approverPerson.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-background-100"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-foreground-400 bg-background-100 px-1.5 py-0.5 rounded">Cấp 1</span>
                <p className="text-sm font-semibold text-foreground-900">{approverPerson.name}</p>
              </div>
              <p className="text-xs text-foreground-500 ml-0">{approverPerson.position} — {approverPerson.department}</p>
            </div>
            {overtime.status === 'approved' && (
              <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full bg-accent-100 text-accent-700 whitespace-nowrap">
                Đã duyệt
              </span>
            )}
          </div>
        )}

        {/* Level 2 */}
        {approver2Person && (
          <div className="flex items-center gap-3">
            <img
              src={approver2Person.avatar}
              alt={approver2Person.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-background-100"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-foreground-400 bg-background-100 px-1.5 py-0.5 rounded">Cấp 2</span>
                <p className="text-sm font-semibold text-foreground-900">{approver2Person.name}</p>
              </div>
              <p className="text-xs text-foreground-500 ml-0">{approver2Person.position} — {approver2Person.department}</p>
            </div>
            {overtime.status === 'approved' && (
              <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full bg-accent-100 text-accent-700 whitespace-nowrap">
                Đã duyệt
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rejection reason */}
      {overtime.status === 'rejected' && overtime.rejectReason && (
        <div className="bg-primary-50 border border-primary-200/50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <i className="ri-close-line text-sm text-primary-600"></i>
            </span>
            <div>
              <p className="text-xs font-semibold text-primary-700 mb-1">Lý do từ chối</p>
              <p className="text-sm text-primary-800 leading-relaxed">{overtime.rejectReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-4 text-[11px] text-foreground-400 mt-5">
        <span>Mã phiếu: <span className="font-medium text-foreground-500">{overtime.id}</span></span>
        <span className="w-1 h-1 rounded-full bg-foreground-300"></span>
        <span>Tạo lúc: {format(parseISO(overtime.createdAt), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
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
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-1">Xoá phiếu tăng ca?</h3>
              <p className="text-sm text-foreground-500 leading-relaxed">
                Bạn có chắc muốn xoá phiếu <strong className="text-foreground-700">{overtimeTypeLabels[overtime.overtimeType]}</strong> này? Hành động này không thể hoàn tác.
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