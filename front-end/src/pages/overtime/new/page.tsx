import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockOvertimes, type OvertimeRecord, type OvertimeType, overtimeTypeLabels, overtimeTypeIcons } from '@/mocks/overtimes';
import { mockUsers } from '@/mocks/users';
import { format } from 'date-fns';
import { formatDaysEquivalent, getDailyWorkHours } from '@/utils/workRules';

function parseTimeToHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMinutes <= 0) return 0;
  return Math.round((totalMinutes / 60) * 2) / 2;
}

function getWeightMultiplier(type: OvertimeType): number {
  if (type === 'weekend') return 2;
  if (type === 'holiday') return 3;
  return 1;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const overtimeTypes: { key: OvertimeType; label: string; icon: string }[] = [
  { key: 'regular', label: 'Ngày thường', icon: 'ri-calendar-line' },
  { key: 'weekend', label: 'Cuối tuần', icon: 'ri-calendar-2-line' },
  { key: 'holiday', label: 'Ngày lễ', icon: 'ri-calendar-event-line' },
];

const approverUsers = mockUsers.filter(
  (u) => ['manager', 'deputy_warehouse', 'warehouse_manager'].includes(u.role)
);

export default function OvertimeNewPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [overtimeType, setOvertimeType] = useState<OvertimeType>('regular');
  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [reason, setReason] = useState('');
  const [selectedApproverId, setSelectedApproverId] = useState('');
  const [selectedApprover2Id, setSelectedApprover2Id] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdown2Ref = useRef<HTMLDivElement>(null);

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd');

  const startTime = startHour && startMinute ? `${startHour}:${startMinute}` : '';
  const endTime = endHour && endMinute ? `${endHour}:${endMinute}` : '';
  const rawHours = startTime && endTime ? parseTimeToHours(startTime, endTime) : 0;
  const multiplier = getWeightMultiplier(overtimeType);
  const weightedHours = rawHours * multiplier;
  const workHours = getDailyWorkHours(user?.department ?? 'Kinh Doanh');
  const daysEquivalent = formatDaysEquivalent(user?.department ?? 'Kinh Doanh', weightedHours);

  const selectedApprover = approverUsers.find((u) => u.id === selectedApproverId);
  const selectedApprover2 = approverUsers.find((u) => u.id === selectedApprover2Id);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (dropdown2Ref.current && !dropdown2Ref.current.contains(e.target as Node)) {
        setIsDropdown2Open(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = 'Vui lòng chọn ngày tăng ca';
    }
    if (!startHour || !startMinute) {
      newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    }
    if (!endHour || !endMinute) {
      newErrors.endTime = 'Vui lòng chọn giờ kết thúc';
    }
    if (startTime && endTime && endTime <= startTime) {
      newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
    }
    if (startTime && endTime && rawHours < 0.5) {
      newErrors.endTime = 'Thời gian tăng ca tối thiểu 30 phút';
    }
    if (!selectedApproverId) {
      newErrors.approver = 'Vui lòng chọn người duyệt cấp 1';
    }
    if (!selectedApprover2Id) {
      newErrors.approver2 = 'Vui lòng chọn người duyệt cấp 2';
    }
    if (selectedApproverId && selectedApprover2Id && selectedApproverId === selectedApprover2Id) {
      newErrors.approver2 = 'Người duyệt cấp 2 không được trùng cấp 1';
    }
    if (!reason.trim()) {
      newErrors.reason = 'Vui lòng nhập lý do tăng ca';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 800));

    const newOvertime: OvertimeRecord = {
      id: `OT-${String(mockOvertimes.length + 1).padStart(3, '0')}`,
      userId: user.id,
      date,
      startTime,
      endTime,
      hours: rawHours,
      overtimeType,
      reason: reason.trim(),
      status: 'pending',
      approverId: selectedApproverId,
      approverName: selectedApprover?.name ?? null,
      approver2Id: selectedApprover2Id,
      approver2Name: selectedApprover2?.name ?? null,
      createdAt: new Date().toISOString(),
      rejectReason: null,
    };

    mockOvertimes.unshift(newOvertime);
    setIsSubmitting(false);
    setShowSuccess(true);

    setTimeout(() => {
      navigate('/overtime');
    }, 1500);
  };

  if (showSuccess) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mb-5 animate-bounce">
            <i className="ri-check-line text-3xl text-accent-600"></i>
          </div>
          <h2 className="text-lg font-heading font-bold text-foreground-950 mb-1">Đã gửi phiếu thành công!</h2>
          <p className="text-sm text-foreground-500 mb-1">
            Phiếu tăng ca đã được gửi đến{' '}
            <span className="font-semibold text-foreground-700">{selectedApprover?.name}</span> và{' '}
            <span className="font-semibold text-foreground-700">{selectedApprover2?.name}</span> để duyệt.
          </p>
          <p className="text-xs text-foreground-400">Đang chuyển về danh sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/overtime" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </Link>
        <h1 className="text-lg font-heading font-bold text-foreground-950">Tạo phiếu tăng ca</h1>
      </div>

      {/* Overtime type selector */}
      <div className="mb-5">
        <label className="block text-sm font-heading font-semibold text-foreground-950 mb-2">
          Hình thức tăng ca <span className="text-primary-500">*</span>
        </label>
        <div className="flex items-center gap-1.5 bg-background-100 rounded-full p-1">
          {overtimeTypes.map((ot) => (
            <button
              key={ot.key}
              type="button"
              onClick={() => setOvertimeType(ot.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                overtimeType === ot.key
                  ? 'bg-background-50 text-foreground-950'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <i className={`${ot.icon} text-xs`}></i>
              </span>
              {ot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Approver selection - Level 1 */}
      <div className="mb-5">
        <label className="block text-sm font-heading font-semibold text-foreground-950 mb-2">
          Người duyệt cấp 1 <span className="text-primary-500">*</span>
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => { setIsDropdownOpen((prev) => !prev); setIsDropdown2Open(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 cursor-pointer ${
              errors.approver ? 'border-primary-400' : 'border-background-200/70'
            }`}
          >
            {selectedApprover ? (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center shrink-0">
                  <i className="ri-user-line text-xs text-secondary-600"></i>
                </span>
                <span className="text-foreground-950 font-medium">{selectedApprover.name}</span>
                <span className="text-foreground-400 text-xs">· {selectedApprover.position}</span>
              </span>
            ) : (
              <span className="text-foreground-400">Chọn người duyệt cấp 1...</span>
            )}
            <span className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
              <i className="ri-arrow-down-s-line text-foreground-400"></i>
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-background-50 border border-background-200/70 rounded-xl shadow-sm overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              {approverUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={u.id === selectedApprover2Id}
                  onClick={() => {
                    setSelectedApproverId(u.id);
                    setIsDropdownOpen(false);
                    setErrors((prev) => ({ ...prev, approver: '', approver2: '' }));
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer ${
                    u.id === selectedApprover2Id ? 'opacity-40 cursor-not-allowed bg-background-50' : 'hover:bg-background-100'
                  } ${selectedApproverId === u.id ? 'bg-secondary-50' : ''}`}
                >
                  <span className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center shrink-0">
                    <i className="ri-user-line text-sm text-secondary-600"></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground-950">{u.name}</p>
                    <p className="text-[11px] text-foreground-500">{u.position} · {u.department}</p>
                  </div>
                  {selectedApproverId === u.id && (
                    <span className="w-5 h-5 flex items-center justify-center ml-auto shrink-0">
                      <i className="ri-check-line text-accent-600"></i>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.approver && <p className="text-[11px] text-primary-500 mt-1">{errors.approver}</p>}
      </div>

      {/* Approver selection - Level 2 */}
      <div className="mb-5">
        <label className="block text-sm font-heading font-semibold text-foreground-950 mb-2">
          Người duyệt cấp 2 <span className="text-primary-500">*</span>
        </label>
        <div className="relative" ref={dropdown2Ref}>
          <button
            type="button"
            onClick={() => { setIsDropdown2Open((prev) => !prev); setIsDropdownOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 cursor-pointer ${
              errors.approver2 ? 'border-primary-400' : 'border-background-200/70'
            }`}
          >
            {selectedApprover2 ? (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center shrink-0">
                  <i className="ri-user-line text-xs text-secondary-600"></i>
                </span>
                <span className="text-foreground-950 font-medium">{selectedApprover2.name}</span>
                <span className="text-foreground-400 text-xs">· {selectedApprover2.position}</span>
              </span>
            ) : (
              <span className="text-foreground-400">Chọn người duyệt cấp 2...</span>
            )}
            <span className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 ${isDropdown2Open ? 'rotate-180' : ''}`}>
              <i className="ri-arrow-down-s-line text-foreground-400"></i>
            </span>
          </button>

          {isDropdown2Open && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-background-50 border border-background-200/70 rounded-xl shadow-sm overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              {approverUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={u.id === selectedApproverId}
                  onClick={() => {
                    setSelectedApprover2Id(u.id);
                    setIsDropdown2Open(false);
                    setErrors((prev) => ({ ...prev, approver2: '' }));
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer ${
                    u.id === selectedApproverId ? 'opacity-40 cursor-not-allowed bg-background-50' : 'hover:bg-background-100'
                  } ${selectedApprover2Id === u.id ? 'bg-secondary-50' : ''}`}
                >
                  <span className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center shrink-0">
                    <i className="ri-user-line text-sm text-secondary-600"></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground-950">{u.name}</p>
                    <p className="text-[11px] text-foreground-500">{u.position} · {u.department}</p>
                  </div>
                  {selectedApprover2Id === u.id && (
                    <span className="w-5 h-5 flex items-center justify-center ml-auto shrink-0">
                      <i className="ri-check-line text-accent-600"></i>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.approver2 && <p className="text-[11px] text-primary-500 mt-1">{errors.approver2}</p>}
      </div>

      {/* Date */}
      <div className="mb-4">
        <label className="block text-sm font-heading font-semibold text-foreground-950 mb-2">
          Ngày tăng ca <span className="text-primary-500">*</span>
        </label>
        <input
          type="date"
          value={date}
          min={getMinDate()}
          onChange={(e) => { setDate(e.target.value); setErrors((prev) => ({ ...prev, date: '' })); }}
          className={`w-full px-3.5 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
            errors.date ? 'border-primary-400' : 'border-background-200/70'
          }`}
        />
        {errors.date && <p className="text-[11px] text-primary-500 mt-1">{errors.date}</p>}
      </div>

      {/* Time range - 24h selectors */}
      <div className="mb-4">
        <label className="block text-sm font-heading font-semibold text-foreground-950 mb-2">
          Thời gian <span className="text-primary-500">*</span>
        </label>

        {/* Start time */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-foreground-600 mb-1.5">Giờ bắt đầu</label>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                value={startHour}
                onChange={(e) => { setStartHour(e.target.value); setErrors((prev) => ({ ...prev, startTime: '', endTime: '' })); }}
                className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none appearance-none cursor-pointer transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                  errors.startTime && !startHour ? 'border-primary-400' : 'border-background-200/70'
                }`}
              >
                <option value="">Giờ</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-foreground-400 text-xs"></i>
              </span>
            </div>
            <span className="text-foreground-400 text-sm font-medium">:</span>
            <div className="relative flex-1">
              <select
                value={startMinute}
                onChange={(e) => { setStartMinute(e.target.value); setErrors((prev) => ({ ...prev, startTime: '', endTime: '' })); }}
                className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none appearance-none cursor-pointer transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                  errors.startTime && !startMinute ? 'border-primary-400' : 'border-background-200/70'
                }`}
              >
                <option value="">Phút</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-foreground-400 text-xs"></i>
              </span>
            </div>
          </div>
          {errors.startTime && <p className="text-[11px] text-primary-500 mt-1">{errors.startTime}</p>}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 border-t border-dashed border-background-200/70"></div>
          <span className="w-6 h-6 flex items-center justify-center">
            <i className="ri-arrow-down-line text-foreground-300 text-sm"></i>
          </span>
          <div className="flex-1 border-t border-dashed border-background-200/70"></div>
        </div>

        {/* End time */}
        <div>
          <label className="block text-[11px] font-medium text-foreground-600 mb-1.5">Giờ kết thúc</label>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                value={endHour}
                onChange={(e) => { setEndHour(e.target.value); setErrors((prev) => ({ ...prev, endTime: '' })); }}
                className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none appearance-none cursor-pointer transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                  errors.endTime && !endHour ? 'border-primary-400' : 'border-background-200/70'
                }`}
              >
                <option value="">Giờ</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-foreground-400 text-xs"></i>
              </span>
            </div>
            <span className="text-foreground-400 text-sm font-medium">:</span>
            <div className="relative flex-1">
              <select
                value={endMinute}
                onChange={(e) => { setEndMinute(e.target.value); setErrors((prev) => ({ ...prev, endTime: '' })); }}
                className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none appearance-none cursor-pointer transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                  errors.endTime && !endMinute ? 'border-primary-400' : 'border-background-200/70'
                }`}
              >
                <option value="">Phút</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-foreground-400 text-xs"></i>
              </span>
            </div>
          </div>
          {errors.endTime && <p className="text-[11px] text-primary-500 mt-1">{errors.endTime}</p>}
        </div>

        {/* Time summary */}
        {rawHours > 0 && (
          <div className="mt-3 bg-background-50 border border-background-200/70 rounded-xl px-3.5 py-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-600">Thời gian thực tế</span>
              <span className="text-xs font-semibold text-foreground-950">{rawHours} giờ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-600">
                Hệ số
                <span className={`inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${overtimeType === 'regular' ? 'bg-secondary-100 text-secondary-700' : overtimeType === 'weekend' ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'}`}>
                  {overtimeTypeLabels[overtimeType]}
                </span>
              </span>
              <span className="text-xs font-semibold text-accent-600">×{multiplier}</span>
            </div>
            <div className="border-t border-background-200/70"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-950">Tổng giờ quy đổi</span>
              <span className="text-sm font-heading font-bold text-foreground-950">{weightedHours} giờ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-500">≈ Ngày công (÷ {workHours})</span>
              <span className="text-xs font-semibold text-accent-600">{daysEquivalent} ngày</span>
            </div>
          </div>
        )}
      </div>

      {/* Reason */}
      <div className="mb-6">
        <label className="block text-sm font-heading font-semibold text-foreground-950 mb-2">
          Lý do tăng ca <span className="text-primary-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setErrors((prev) => ({ ...prev, reason: '' })); }}
          placeholder="Nhập lý do tăng ca..."
          maxLength={500}
          rows={4}
          className={`w-full px-3.5 py-3 text-sm bg-background-50 border rounded-xl outline-none resize-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
            errors.reason ? 'border-primary-400' : 'border-background-200/70'
          }`}
        />
        <div className="flex items-center justify-between mt-1.5">
          {errors.reason ? (
            <p className="text-[11px] text-primary-500">{errors.reason}</p>
          ) : (
            <span />
          )}
          <p className="text-[11px] text-foreground-400">{reason.length}/500</p>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
          isSubmitting
            ? 'bg-foreground-200 text-foreground-400 cursor-not-allowed'
            : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]'
        }`}
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Đang gửi...
          </>
        ) : (
          <>
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-send-plane-line text-sm"></i>
            </span>
            Gửi phiếu tăng ca
          </>
        )}
      </button>
    </div>
  );
}