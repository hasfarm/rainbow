import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { leaveTypeLabels, leaveTypeIcons, leaveTypeColors, type LeaveType, type LeaveRecord } from '@/mocks/leaves';
import { mockLeaves } from '@/mocks/leaves';
import { mockUsers } from '@/mocks/users';
import { format, differenceInDays } from 'date-fns';
import { getLunchDeductMinutes, getLunchBreakLabel, getDailyWorkMinutes, formatDaysFromMinutes } from '@/utils/workRules';

const allLeaveTypes: { type: LeaveType; description: string }[] = [
  { type: 'annual_leave', description: 'Nghỉ có lương, trừ vào ngày phép năm' },
  { type: 'unpaid_leave', description: 'Nghỉ không hưởng lương' },
  { type: 'marriage_leave', description: 'Nghỉ kết hôn theo chế độ' },
  { type: 'bereavement_leave', description: 'Nghỉ tang chế gia đình' },
  { type: 'business_trip', description: 'Đi công tác thị trường' },
  { type: 'women_policy', description: 'Nghỉ theo chế độ phụ nữ' },
  { type: 'late_arrival', description: 'Đi làm trễ hơn giờ quy định' },
  { type: 'early_departure', description: 'Về sớm hơn giờ quy định' },
];

type LeaveMode = 'full_day' | 'hourly';

export default function LeaveNewPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Leave type dropdown ---
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // --- Leave mode ---
  const [leaveMode, setLeaveMode] = useState<LeaveMode | null>(null);

  // --- Date / time ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // --- Handover ---
  const [needHandover, setNeedHandover] = useState(false);
  const [handoverTo, setHandoverTo] = useState<string | null>(null);
  const [handoverNote, setHandoverNote] = useState('');
  const [handoverDropdownOpen, setHandoverDropdownOpen] = useState(false);
  const handoverDropdownRef = useRef<HTMLDivElement>(null);

  // --- Approver ---
  const [approver, setApprover] = useState<string | null>(null);
  const [approverDropdownOpen, setApproverDropdownOpen] = useState(false);
  const approverDropdownRef = useRef<HTMLDivElement>(null);

  // --- Reason & submit ---
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const remainingLeave = user?.annualLeave ?? 0;

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd');

  // Unified click-outside for all dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (handoverDropdownRef.current && !handoverDropdownRef.current.contains(e.target as Node)) {
        setHandoverDropdownOpen(false);
      }
      if (approverDropdownRef.current && !approverDropdownRef.current.contains(e.target as Node)) {
        setApproverDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Derived lists ---
  const handoverColleagues = mockUsers.filter((u) => u.id !== user?.id);
  const approversList = mockUsers.filter((u) => ['manager', 'hr', 'accountant'].includes(u.role));

  // --- Validation ---
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedType) {
      newErrors.type = 'Vui lòng chọn loại nghỉ phép';
    }
    if (!leaveMode) {
      newErrors.mode = 'Vui lòng chọn hình thức nghỉ';
    }
    if (leaveMode === 'full_day') {
      if (!startDate) {
        newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
      }
      if (!endDate) {
        newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
      }
      if (startDate && endDate && endDate < startDate) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    if (leaveMode === 'hourly') {
      if (!singleDate) {
        newErrors.singleDate = 'Vui lòng chọn ngày';
      }
      if (!startTime) {
        newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
      }
      if (!endTime) {
        newErrors.endTime = 'Vui lòng chọn giờ kết thúc';
      }
      if (startTime && endTime && startTime >= endTime) {
        newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
      }
    }
    if (needHandover && !handoverTo) {
      newErrors.handoverTo = 'Vui lòng chọn người bàn giao';
    }
    if (!approver) {
      newErrors.approver = 'Vui lòng chọn người duyệt';
    }
    if (!reason.trim()) {
      newErrors.reason = 'Vui lòng nhập lý do';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Lý do cần ít nhất 10 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleTypeSelect = (type: LeaveType) => {
    setSelectedType(type);
    setLeaveMode(null);
    setStartDate('');
    setEndDate('');
    setSingleDate('');
    setStartTime('');
    setEndTime('');
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const handoverTarget = mockUsers.find((u) => u.id === handoverTo);
    const approverTarget = mockUsers.find((u) => u.id === approver);

    let newLeave: LeaveRecord;

    if (leaveMode === 'full_day') {
      newLeave = {
        id: `LEAVE-${String(mockLeaves.length + 1).padStart(3, '0')}`,
        userId: user.id,
        type: selectedType!,
        startDate,
        endDate,
        startTime: null,
        endTime: null,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvedBy: null,
        rejectedReason: null,
        handoverTo: needHandover ? (handoverTarget?.name ?? null) : null,
        handoverNote: needHandover ? (handoverNote.trim() || null) : null,
        approver: approverTarget?.name ?? null,
      };
    } else {
      newLeave = {
        id: `LEAVE-${String(mockLeaves.length + 1).padStart(3, '0')}`,
        userId: user.id,
        type: selectedType!,
        startDate: singleDate,
        endDate: singleDate,
        startTime,
        endTime,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvedBy: null,
        rejectedReason: null,
        handoverTo: needHandover ? (handoverTarget?.name ?? null) : null,
        handoverNote: needHandover ? (handoverNote.trim() || null) : null,
        approver: approverTarget?.name ?? null,
      };
    }

    mockLeaves.unshift(newLeave);
    setIsSubmitting(false);
    setShowSuccess(true);

    setTimeout(() => {
      navigate('/leave');
    }, 1500);
  };

  // --- Helpers ---
  const getSelectedHandoverName = () => {
    const u = mockUsers.find((u) => u.id === handoverTo);
    return u ? `${u.name} — ${u.position}` : null;
  };

  const getSelectedApproverName = () => {
    const u = mockUsers.find((u) => u.id === approver);
    return u ? `${u.name} — ${u.position}` : null;
  };

  // --- Success view ---
  if (showSuccess) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mb-5 animate-bounce">
            <i className="ri-check-line text-3xl text-accent-600"></i>
          </div>
          <h2 className="text-lg font-heading font-bold text-foreground-950 mb-1">Đã gửi đơn thành công!</h2>
          <p className="text-sm text-foreground-500 mb-1">Đơn xin nghỉ của bạn đã được gửi lên cấp trên.</p>
          <p className="text-xs text-foreground-400">Đang chuyển về danh sách...</p>
        </div>
      </div>
    );
  }

  // --- Main form ---
  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/leave" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </Link>
        <h1 className="text-lg font-heading font-bold text-foreground-950">Tạo đơn xin nghỉ</h1>
      </div>

      {/* Remaining leave info */}
      <div className="bg-accent-50 border border-accent-200/50 rounded-xl p-3.5 mb-5 flex items-center gap-3">
        <span className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center shrink-0">
          <i className="ri-calendar-check-line text-lg text-accent-600"></i>
        </span>
        <div>
          <p className="text-xs text-foreground-500">Ngày phép còn lại</p>
          <p className="text-lg font-heading font-bold text-accent-600">{remainingLeave} ngày</p>
        </div>
      </div>

      {/* ─────── 1. Loại nghỉ phép ─────── */}
      <div className="mb-5 relative" ref={typeDropdownRef}>
        <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
          Loại nghỉ phép <span className="text-primary-500">*</span>
        </h2>
        {errors.type && (
          <p className="text-xs text-primary-500 mb-2">{errors.type}</p>
        )}

        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full flex items-center gap-3 px-4 py-3 bg-background-50 border rounded-xl text-left transition-all duration-200 cursor-pointer ${
            dropdownOpen
              ? 'border-primary-400 ring-2 ring-primary-400/30'
              : errors.type
                ? 'border-primary-400'
                : 'border-background-200/70 hover:border-background-300'
          }`}
        >
          {selectedType ? (
            <>
              <span className={`w-9 h-9 ${leaveTypeColors[selectedType].split(' ')[0]} rounded-lg flex items-center justify-center shrink-0`}>
                <i className={`${leaveTypeIcons[selectedType]} text-base ${leaveTypeColors[selectedType].split(' ')[1]}`}></i>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground-950">{leaveTypeLabels[selectedType]}</p>
                <p className="text-[11px] text-foreground-500 truncate">{allLeaveTypes.find(i => i.type === selectedType)?.description}</p>
              </div>
            </>
          ) : (
            <>
              <span className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center shrink-0">
                <i className="ri-list-check text-base text-foreground-400"></i>
              </span>
              <span className="text-sm text-foreground-400 flex-1">Chọn loại nghỉ phép...</span>
            </>
          )}
          <span className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
            <i className="ri-arrow-down-s-line text-foreground-400"></i>
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute left-4 right-4 mt-1.5 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto animate-[fadeInUp_0.2s_ease-out]">
            {allLeaveTypes.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => { handleTypeSelect(item.type); setDropdownOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer mb-0.5 ${
                  selectedType === item.type
                    ? 'bg-primary-50'
                    : 'hover:bg-background-100'
                }`}
              >
                <span className={`w-8 h-8 ${leaveTypeColors[item.type].split(' ')[0]} rounded-lg flex items-center justify-center shrink-0`}>
                  <i className={`${leaveTypeIcons[item.type]} text-sm ${leaveTypeColors[item.type].split(' ')[1]}`}></i>
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-tight ${selectedType === item.type ? 'text-primary-700' : 'text-foreground-950'}`}>
                    {leaveTypeLabels[item.type]}
                  </p>
                  <p className="text-[10px] text-foreground-500 leading-tight truncate">{item.description}</p>
                </div>
                {selectedType === item.type && (
                  <span className="w-5 h-5 flex items-center justify-center shrink-0">
                    <i className="ri-check-line text-primary-500"></i>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─────── 2. Hình thức nghỉ ─────── */}
      {selectedType && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out]">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Hình thức nghỉ <span className="text-primary-500">*</span>
          </h2>
          {errors.mode && (
            <p className="text-xs text-primary-500 mb-2">{errors.mode}</p>
          )}
          <div className="flex items-center gap-2 bg-background-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setLeaveMode('full_day');
                setStartDate('');
                setEndDate('');
                setSingleDate('');
                setStartTime('');
                setEndTime('');
                setErrors((prev) => ({ ...prev, mode: '', startDate: '', endDate: '', singleDate: '', startTime: '', endTime: '' }));
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
                leaveMode === 'full_day'
                  ? 'bg-background-50 text-primary-700 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <span className="w-4 h-4 inline-flex items-center justify-center mr-1">
                <i className="ri-sun-line text-sm"></i>
              </span>
              Nghỉ cả ngày
            </button>
            <button
              type="button"
              onClick={() => {
                setLeaveMode('hourly');
                setStartDate('');
                setEndDate('');
                setSingleDate('');
                setStartTime('');
                setEndTime('');
                setErrors((prev) => ({ ...prev, mode: '', startDate: '', endDate: '', singleDate: '', startTime: '', endTime: '' }));
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
                leaveMode === 'hourly'
                  ? 'bg-background-50 text-primary-700 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <span className="w-4 h-4 inline-flex items-center justify-center mr-1">
                <i className="ri-time-line text-sm"></i>
              </span>
              Nghỉ theo giờ
            </button>
          </div>
        </div>
      )}

      {/* ─────── 3. Thời gian ─────── */}
      {selectedType && leaveMode && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out]">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">Thời gian</h2>

          {leaveMode === 'full_day' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-foreground-600 mb-1">
                    Ngày bắt đầu <span className="text-primary-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={getMinDate()}
                    onChange={(e) => { setStartDate(e.target.value); setErrors((prev) => ({ ...prev, startDate: '', endDate: '' })); }}
                    className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                      errors.startDate ? 'border-primary-400' : 'border-background-200/70'
                    }`}
                  />
                  {errors.startDate && <p className="text-[11px] text-primary-500 mt-1">{errors.startDate}</p>}
                </div>
                <span className="text-foreground-400 text-sm mt-5 shrink-0">→</span>
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-foreground-600 mb-1">
                    Ngày kết thúc <span className="text-primary-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || getMinDate()}
                    onChange={(e) => { setEndDate(e.target.value); setErrors((prev) => ({ ...prev, endDate: '' })); }}
                    className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                      errors.endDate ? 'border-primary-400' : 'border-background-200/70'
                    }`}
                  />
                  {errors.endDate && <p className="text-[11px] text-primary-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>

              {startDate && endDate && (
                <div className="bg-background-50 border border-background-200/70 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center">
                    <i className="ri-information-line text-sm text-foreground-400"></i>
                  </span>
                  <p className="text-xs text-foreground-600">
                    Tổng thời gian nghỉ: <span className="font-semibold text-foreground-950">{differenceInDays(new Date(endDate), new Date(startDate)) + 1} ngày</span>
                    {selectedType === 'annual_leave' && differenceInDays(new Date(endDate), new Date(startDate)) + 1 > remainingLeave && (
                      <span className="text-primary-500 ml-1">(vượt số ngày phép còn lại)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-foreground-600 mb-1">
                  Ngày nghỉ <span className="text-primary-500">*</span>
                </label>
                <input
                  type="date"
                  value={singleDate}
                  min={getMinDate()}
                  onChange={(e) => { setSingleDate(e.target.value); setErrors((prev) => ({ ...prev, singleDate: '' })); }}
                  className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                    errors.singleDate ? 'border-primary-400' : 'border-background-200/70'
                  }`}
                />
                {errors.singleDate && <p className="text-[11px] text-primary-500 mt-1">{errors.singleDate}</p>}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-foreground-600 mb-1">
                    Giờ bắt đầu <span className="text-primary-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={startTime ? startTime.split(':')[0] : ''}
                      onChange={(e) => {
                        const h = e.target.value;
                        const m = (startTime ? startTime.split(':')[1] : '00') || '00';
                        setStartTime(h ? `${h}:${m}` : '');
                        setErrors((prev) => ({ ...prev, startTime: '', endTime: '' }));
                      }}
                      className={`flex-1 px-2 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 cursor-pointer appearance-none ${
                        errors.startTime ? 'border-primary-400' : 'border-background-200/70'
                      }`}
                    >
                      <option value="" className="text-foreground-400">Giờ</option>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-foreground-400 text-sm">:</span>
                    <select
                      value={startTime ? startTime.split(':')[1] : ''}
                      onChange={(e) => {
                        const m = e.target.value;
                        const h = (startTime ? startTime.split(':')[0] : '00') || '00';
                        setStartTime(m ? `${h}:${m}` : h);
                        setErrors((prev) => ({ ...prev, startTime: '', endTime: '' }));
                      }}
                      className={`flex-1 px-2 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 cursor-pointer appearance-none ${
                        errors.startTime ? 'border-primary-400' : 'border-background-200/70'
                      }`}
                    >
                      <option value="" className="text-foreground-400">Phút</option>
                      {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  {errors.startTime && <p className="text-[11px] text-primary-500 mt-1">{errors.startTime}</p>}
                </div>
                <span className="text-foreground-400 text-sm mt-5 shrink-0">→</span>
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-foreground-600 mb-1">
                    Giờ kết thúc <span className="text-primary-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={endTime ? endTime.split(':')[0] : ''}
                      onChange={(e) => {
                        const h = e.target.value;
                        const m = (endTime ? endTime.split(':')[1] : '00') || '00';
                        setEndTime(h ? `${h}:${m}` : '');
                        setErrors((prev) => ({ ...prev, endTime: '' }));
                      }}
                      className={`flex-1 px-2 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 cursor-pointer appearance-none ${
                        errors.endTime ? 'border-primary-400' : 'border-background-200/70'
                      }`}
                    >
                      <option value="" className="text-foreground-400">Giờ</option>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-foreground-400 text-sm">:</span>
                    <select
                      value={endTime ? endTime.split(':')[1] : ''}
                      onChange={(e) => {
                        const m = e.target.value;
                        const h = (endTime ? endTime.split(':')[0] : '00') || '00';
                        setEndTime(m ? `${h}:${m}` : h);
                        setErrors((prev) => ({ ...prev, endTime: '' }));
                      }}
                      className={`flex-1 px-2 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 cursor-pointer appearance-none ${
                        errors.endTime ? 'border-primary-400' : 'border-background-200/70'
                      }`}
                    >
                      <option value="" className="text-foreground-400">Phút</option>
                      {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  {errors.endTime && <p className="text-[11px] text-primary-500 mt-1">{errors.endTime}</p>}
                </div>
              </div>

              {singleDate && startTime && endTime && (() => {
                const [sh, sm] = startTime.split(':').map(Number);
                const [eh, em] = endTime.split(':').map(Number);
                const startTotalMin = sh * 60 + sm;
                const endTotalMin = eh * 60 + em;
                const rawMin = endTotalMin - startTotalMin;
                const dept = user?.department ?? 'Kinh Doanh';
                const lunchDeduct = getLunchDeductMinutes(dept, startTotalMin, endTotalMin);
                const totalMin = Math.max(0, rawMin - lunchDeduct);
                const rawHours = rawMin / 60;
                const totalHours = totalMin / 60;
                const daysExact = formatDaysFromMinutes(dept, totalMin);
                const lunchLabel = lunchDeduct > 0 ? getLunchBreakLabel(dept) : '';
                const dailyMinutes = getDailyWorkMinutes(dept);
                return (
                <div className="bg-background-50 border border-background-200/70 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center shrink-0">
                    <i className="ri-information-line text-sm text-foreground-400"></i>
                  </span>
                  <div className="text-xs text-foreground-600">
                    <p>
                      Nghỉ ngày <span className="font-semibold text-foreground-950">{singleDate.split('-').reverse().join('/')}</span> từ <span className="font-semibold text-foreground-950">{startTime}</span> đến <span className="font-semibold text-foreground-950">{endTime}</span>
                    </p>
                    <p className="mt-0.5">
                      Tổng: <span className="font-semibold text-foreground-950">{rawHours.toFixed(1)} giờ</span>
                      {lunchDeduct > 0 && (
                        <span className="text-foreground-400"> − <span className="font-semibold text-primary-500">{lunchLabel}</span> = <span className="font-semibold text-foreground-950">{totalHours.toFixed(1)} giờ</span></span>
                      )}
                      {' '}≈ <span className="font-semibold text-accent-600">{daysExact} ngày (÷ {dailyMinutes / 60}h)</span>
                    </p>
                  </div>
                </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ─────── 4. Bàn giao công việc ─────── */}
      {selectedType && leaveMode && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out]">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Bàn giao công việc
          </h2>

          {/* Toggle */}
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div className="relative">
              <input
                type="checkbox"
                checked={needHandover}
                onChange={(e) => {
                  setNeedHandover(e.target.checked);
                  if (!e.target.checked) {
                    setHandoverTo(null);
                    setHandoverNote('');
                    setErrors((prev) => ({ ...prev, handoverTo: '' }));
                  }
                }}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200 ${needHandover ? 'bg-primary-500' : 'bg-foreground-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${needHandover ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </div>
            </div>
            <span className="text-sm text-foreground-800">Cần bàn giao công việc</span>
          </label>

          {needHandover && (
            <div className="space-y-3 pl-1 border-l-2 border-primary-200/60 ml-1 pl-4">
              {/* Colleague dropdown */}
              <div className="relative" ref={handoverDropdownRef}>
                <label className="block text-[11px] font-medium text-foreground-600 mb-1">
                  Người nhận bàn giao <span className="text-primary-500">*</span>
                </label>
                {errors.handoverTo && (
                  <p className="text-xs text-primary-500 mb-2">{errors.handoverTo}</p>
                )}
                <button
                  type="button"
                  onClick={() => setHandoverDropdownOpen(!handoverDropdownOpen)}
                  className={`w-full flex items-center gap-3 px-4 py-3 bg-background-50 border rounded-xl text-left transition-all duration-200 cursor-pointer ${
                    handoverDropdownOpen
                      ? 'border-primary-400 ring-2 ring-primary-400/30'
                      : errors.handoverTo
                        ? 'border-primary-400'
                        : 'border-background-200/70 hover:border-background-300'
                  }`}
                >
                  {handoverTo ? (
                    <>
                      <span className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center shrink-0">
                        <i className="ri-user-shared-line text-base text-accent-600"></i>
                      </span>
                      <span className="text-sm text-foreground-950 flex-1">{getSelectedHandoverName()}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center shrink-0">
                        <i className="ri-user-search-line text-base text-foreground-400"></i>
                      </span>
                      <span className="text-sm text-foreground-400 flex-1">Chọn đồng nghiệp...</span>
                    </>
                  )}
                  <span className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200 ${handoverDropdownOpen ? 'rotate-180' : ''}`}>
                    <i className="ri-arrow-down-s-line text-foreground-400"></i>
                  </span>
                </button>

                {handoverDropdownOpen && (
                  <div className="absolute left-4 right-4 mt-1.5 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-40 max-h-56 overflow-y-auto animate-[fadeInUp_0.2s_ease-out]">
                    {handoverColleagues.map((colleague) => (
                      <button
                        key={colleague.id}
                        type="button"
                        onClick={() => {
                          setHandoverTo(colleague.id);
                          setHandoverDropdownOpen(false);
                          setErrors((prev) => ({ ...prev, handoverTo: '' }));
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer mb-0.5 ${
                          handoverTo === colleague.id ? 'bg-accent-50' : 'hover:bg-background-100'
                        }`}
                      >
                        <span className="w-8 h-8 bg-background-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                          <img src={colleague.avatar} alt={colleague.name} className="w-full h-full object-cover" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold leading-tight ${handoverTo === colleague.id ? 'text-accent-700' : 'text-foreground-950'}`}>
                            {colleague.name}
                          </p>
                          <p className="text-[10px] text-foreground-500 leading-tight">{colleague.position} — {colleague.department}</p>
                        </div>
                        {handoverTo === colleague.id && (
                          <span className="w-5 h-5 flex items-center justify-center shrink-0">
                            <i className="ri-check-line text-accent-500"></i>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Handover note */}
              <div>
                <label className="block text-[11px] font-medium text-foreground-600 mb-1">
                  Ghi chú bàn giao
                </label>
                <textarea
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Mô tả công việc cần bàn giao, danh sách khách hàng, deadline..."
                  maxLength={300}
                  rows={3}
                  className="w-full px-3.5 py-3 text-sm bg-background-50 border border-background-200/70 rounded-xl outline-none resize-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50"
                />
                <p className="text-[11px] text-foreground-400 text-right mt-1">{handoverNote.length}/300</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────── 5. Người duyệt ─────── */}
      {selectedType && leaveMode && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out] relative" ref={approverDropdownRef}>
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Người duyệt <span className="text-primary-500">*</span>
          </h2>
          {errors.approver && (
            <p className="text-xs text-primary-500 mb-2">{errors.approver}</p>
          )}

          <button
            type="button"
            onClick={() => setApproverDropdownOpen(!approverDropdownOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-background-50 border rounded-xl text-left transition-all duration-200 cursor-pointer ${
              approverDropdownOpen
                ? 'border-primary-400 ring-2 ring-primary-400/30'
                : errors.approver
                  ? 'border-primary-400'
                  : 'border-background-200/70 hover:border-background-300'
            }`}
          >
            {approver ? (
              <>
                <span className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-user-star-line text-base text-primary-600"></i>
                </span>
                <span className="text-sm text-foreground-950 flex-1">{getSelectedApproverName()}</span>
              </>
            ) : (
              <>
                <span className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-user-received-line text-base text-foreground-400"></i>
                </span>
                <span className="text-sm text-foreground-400 flex-1">Chọn quản lý / admin duyệt...</span>
              </>
            )}
            <span className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200 ${approverDropdownOpen ? 'rotate-180' : ''}`}>
              <i className="ri-arrow-down-s-line text-foreground-400"></i>
            </span>
          </button>

          {approverDropdownOpen && (
            <div className="absolute left-4 right-4 mt-1.5 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-40 max-h-56 overflow-y-auto animate-[fadeInUp_0.2s_ease-out]">
              {approversList.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    setApprover(person.id);
                    setApproverDropdownOpen(false);
                    setErrors((prev) => ({ ...prev, approver: '' }));
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer mb-0.5 ${
                    approver === person.id ? 'bg-primary-50' : 'hover:bg-background-100'
                  }`}
                >
                  <span className="w-8 h-8 bg-background-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold leading-tight ${approver === person.id ? 'text-primary-700' : 'text-foreground-950'}`}>
                      {person.name}
                    </p>
                    <p className="text-[10px] text-foreground-500 leading-tight">{person.position} — {person.department}</p>
                  </div>
                  {approver === person.id && (
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      <i className="ri-check-line text-primary-500"></i>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────── 6. Lý do ─────── */}
      <div className="mb-6">
        <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
          Lý do <span className="text-primary-500">*</span>
        </h2>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setErrors((prev) => ({ ...prev, reason: '' })); }}
          placeholder="Nhập lý do xin nghỉ (ít nhất 10 ký tự)..."
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

      {/* ─────── Submit ─────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedType || !leaveMode}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
          !selectedType || !leaveMode || isSubmitting
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
            Gửi đơn xin nghỉ
          </>
        )}
      </button>
    </div>
  );
}