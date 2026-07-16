import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationAsRead, type NotificationItem } from './api';
import { NotificationCard } from './components/NotificationCard';
import { fetchOvertimeApprovalById, decideOvertimeApproval, type OvertimeApprovalItem } from './api';
import {
  decideLeave,
  fetchLeaveById,
  fetchLeaveEmployees,
  fetchLeaves,
  leaveStatusLabels,
  leaveTypeLabels,
  type EmployeeOption,
  type LeaveRecord,
} from '../leave/api';
import { AuthContext } from '@/hooks/useAuth';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

type TabKey = 'announcement' | 'private';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'announcement', label: 'Thông báo chung', icon: 'ri-megaphone-line' },
  { key: 'private', label: 'Tin nhắn riêng', icon: 'ri-chat-3-line' },
];

const overtimeStageLabels: Record<number, string> = {
  1: 'Chờ cấp 1 duyệt',
  2: 'Chờ cấp 2 duyệt',
};

export default function RequestsPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('announcement');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalLeave, setApprovalLeave] = useState<LeaveRecord | null>(null);
  const [approvalOvertime, setApprovalOvertime] = useState<OvertimeApprovalItem | null>(null);
  const [leaveEmployees, setLeaveEmployees] = useState<EmployeeOption[]>([]);
  const [approvalComment, setApprovalComment] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

  const approvalRequester = approvalLeave
    ? leaveEmployees.find((item) => item.code === approvalLeave.userId) ?? null
    : null;
  const approvalHandover = approvalLeave?.handoverTo
    ? leaveEmployees.find((item) => item.code === approvalLeave.handoverTo) ?? null
    : null;
  const overtimeRequester = approvalOvertime
    ? leaveEmployees.find((item) => item.code === approvalOvertime.userId) ?? null
    : null;
  const overtimeCurrentApprover = approvalOvertime?.currentApproverId
    ? leaveEmployees.find((item) => item.code === approvalOvertime.currentApproverId) ?? null
    : null;
  const leaveModeLabel = approvalLeave?.startTime && approvalLeave?.endTime ? 'Theo gio' : 'Ca ngay';
  const totalDays = approvalLeave
    ? differenceInCalendarDays(parseISO(approvalLeave.endDate), parseISO(approvalLeave.startDate)) + 1
    : 0;

  const totalHours = (() => {
    if (!approvalLeave?.startTime || !approvalLeave?.endTime) {
      return null;
    }

    const [startHour, startMinute] = approvalLeave.startTime.split(':').map(Number);
    const [endHour, endMinute] = approvalLeave.endTime.split(':').map(Number);
    const minutes = Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
    const hours = minutes / 60;

    return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  })();

  async function ensureLeaveEmployeesLoaded() {
    if (leaveEmployees.length > 0) {
      return;
    }

    const records = await fetchLeaveEmployees();
    setLeaveEmployees(records);
  }

  useEffect(() => {
    async function loadNotifications() {
      try {
        const records = await fetchNotifications();
        setNotifications(records);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    void loadNotifications();
  }, []);

  const userAnnouncements = notifications.filter((n) => n.type === 'announcement');
  const userPrivateMessages = notifications.filter((n) => n.type === 'private');

  const unreadAnnouncements = userAnnouncements.filter((n) => !n.isRead).length;
  const unreadPrivate = userPrivateMessages.filter((n) => !n.isRead).length;

  const activeNotifications: NotificationItem[] =
    activeTab === 'announcement' ? userAnnouncements : userPrivateMessages;

  const canApproveLeave =
    approvalLeave !== null &&
    approvalLeave.status === 'pending' &&
    approvalLeave.approver !== null &&
    user?.id === approvalLeave.approver;

  const canApproveOvertime =
    approvalOvertime !== null &&
    approvalOvertime.status === 'pending' &&
    approvalOvertime.currentApproverId !== null &&
    user?.id === approvalOvertime.currentApproverId;

  const overtimeStageText = approvalOvertime?.approvalStage
    ? overtimeStageLabels[approvalOvertime.approvalStage]
    : approvalOvertime?.status === 'approved'
      ? 'Đã duyệt'
      : approvalOvertime?.status === 'rejected'
        ? 'Đã từ chối'
        : 'Chờ xử lý';

  async function openLeaveApprovalModal(leaveId: string) {
    setApprovalModalOpen(true);
    setApprovalLoading(true);
    setApprovalError(null);
    setApprovalComment('');
    setApprovalOvertime(null);

    try {
      const [leave] = await Promise.all([
        fetchLeaveById(leaveId),
        ensureLeaveEmployeesLoaded(),
      ]);
      setApprovalLeave(leave);
    } catch (error) {
      setApprovalLeave(null);
      setApprovalError(error instanceof Error ? error.message : 'Khong the tai thong tin don nghi');
    } finally {
      setApprovalLoading(false);
    }
  }

  async function openPendingApproverLeaveModal() {
    setApprovalModalOpen(true);
    setApprovalLoading(true);
    setApprovalError(null);
    setApprovalComment('');
    setApprovalOvertime(null);

    try {
      const [pendingApproverLeaves] = await Promise.all([
        fetchLeaves('pending', 'approver'),
        ensureLeaveEmployeesLoaded(),
      ]);
      if (pendingApproverLeaves.length === 0) {
        setApprovalLeave(null);
        setApprovalError('Khong co don nghi phep nao dang cho ban duyet.');
        return;
      }

      setApprovalLeave(pendingApproverLeaves[0]);
    } catch (error) {
      setApprovalLeave(null);
      setApprovalError(error instanceof Error ? error.message : 'Khong the tai don nghi can duyet');
    } finally {
      setApprovalLoading(false);
    }
  }

  async function openOvertimeApprovalModal(overtimeId: string) {
    setApprovalModalOpen(true);
    setApprovalLoading(true);
    setApprovalError(null);
    setApprovalComment('');
    setApprovalLeave(null);

    try {
      const [overtime] = await Promise.all([
        fetchOvertimeApprovalById(overtimeId),
        ensureLeaveEmployeesLoaded(),
      ]);
      setApprovalOvertime(overtime);
    } catch (error) {
      setApprovalOvertime(null);
      setApprovalError(error instanceof Error ? error.message : 'Khong the tai thong tin phiếu tang ca');
    } finally {
      setApprovalLoading(false);
    }
  }

  async function handleLeaveDecision(decision: 'approved' | 'rejected') {
    if (!approvalLeave || !canApproveLeave) {
      return;
    }

    if (decision === 'rejected' && approvalComment.trim() === '') {
      setApprovalError('Vui long nhap comment khi tu choi don.');
      return;
    }

    setIsDeciding(true);
    setApprovalError(null);

    try {
      const updated = await decideLeave(approvalLeave.id, {
        decision,
        comment: approvalComment.trim(),
      });
      setApprovalLeave(updated);
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Khong the duyet don nghi');
    } finally {
      setIsDeciding(false);
    }
  }

  async function handleOvertimeDecision(decision: 'approved' | 'rejected') {
    if (!approvalOvertime || !canApproveOvertime) {
      return;
    }

    if (decision === 'rejected' && approvalComment.trim() === '') {
      setApprovalError('Vui long nhap comment khi tu choi don.');
      return;
    }

    setIsDeciding(true);
    setApprovalError(null);

    try {
      const updated = await decideOvertimeApproval(approvalOvertime.id, {
        decision,
        comment: approvalComment.trim(),
      });
      setApprovalOvertime(updated);
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Khong the duyet phieu tang ca');
    } finally {
      setIsDeciding(false);
    }
  }

  const handleCardClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
      } catch {
        // no-op
      }

      setNotifications((prev) => prev.map((item) => (item.id === notif.id ? { ...item, isRead: true } : item)));
    }

    if (notif.type === 'private' && notif.actionUrl) {
      const match = notif.actionUrl.match(/\/leave\/([^/?#]+)/i);
      if (match?.[1]) {
        await openLeaveApprovalModal(match[1]);
        return;
      }

      const overtimeMatch = notif.actionUrl.match(/\/overtime\/([^/?#]+)/i);
      if (overtimeMatch?.[1]) {
        await openOvertimeApprovalModal(overtimeMatch[1]);
        return;
      }

      if (/^\/leave(?:\?.*)?$/i.test(notif.actionUrl)) {
        await openPendingApproverLeaveModal();
        return;
      }
    }

    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Thông báo</h1>
        </div>
        <button
          type="button"
          className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0"
          title="Đánh dấu tất cả đã đọc"
        >
          <i className="ri-check-double-line text-foreground-500"></i>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-background-100 rounded-full p-1 mb-5">
        {tabs.map((tab) => {
          const unreadCount = tab.key === 'announcement' ? unreadAnnouncements : unreadPrivate;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-background-50 text-foreground-950'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <i className={tab.icon}></i>
              </span>
              {tab.label}
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state header info */}
      {activeTab === 'announcement' && (
        <div className="bg-accent-50 border border-accent-200/60 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2.5">
            <span className="w-7 h-7 bg-accent-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <i className="ri-information-line text-sm text-accent-600"></i>
            </span>
            <div>
              <p className="text-xs font-semibold text-accent-800 mb-0.5">Thông báo từ Ban Giám đốc</p>
              <p className="text-[11px] text-accent-700/80 leading-relaxed">
                Các thông báo quan trọng từ Ban Giám đốc và các phòng ban gửi đến toàn thể nhân viên công ty.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-loader-4-line text-2xl text-foreground-300 animate-spin"></i>
          </span>
          <p className="text-sm text-foreground-500">Đang tải thông báo...</p>
        </div>
      ) : activeNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className={`${activeTab === 'announcement' ? 'ri-megaphone-line' : 'ri-chat-3-line'} text-2xl text-foreground-300`}></i>
          </span>
          <p className="text-sm text-foreground-500 mb-1">
            {activeTab === 'announcement'
              ? 'Không có thông báo chung nào'
              : 'Không có tin nhắn riêng nào'}
          </p>
          <p className="text-xs text-foreground-400">
            {activeTab === 'announcement'
              ? 'Các thông báo mới từ BGD sẽ hiển thị ở đây'
              : 'Tin nhắn riêng từ quản lý và đồng nghiệp sẽ hiển thị ở đây'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeNotifications.map((notif) => (
            <div key={notif.id} onClick={() => handleCardClick(notif)}>
              <NotificationCard notification={notif} />
            </div>
          ))}
        </div>
      )}

      {approvalModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-foreground-950/45 p-3 md:p-4">
          <div className="w-full max-w-lg max-h-[85vh] md:max-h-[90vh] rounded-2xl bg-background-50 border border-background-200/70 shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-background-200/70">
              <h3 className="text-sm font-heading font-semibold text-foreground-950">
                {approvalLeave ? 'Duyệt đơn nghỉ phép' : 'Duyệt phiếu tăng ca'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setApprovalModalOpen(false);
                  setApprovalLeave(null);
                  setApprovalOvertime(null);
                  setApprovalError(null);
                  setApprovalComment('');
                }}
                className="w-8 h-8 rounded-lg bg-background-100 hover:bg-background-200 text-foreground-600"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto overscroll-contain flex-1">
              {approvalLoading && (
                <p className="text-sm text-foreground-500">Dang tai thong tin don...</p>
              )}

              {!approvalLoading && approvalError && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">{approvalError}</div>
              )}

              {!approvalLoading && approvalLeave && (
                <>
                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-full overflow-hidden bg-background-200 flex items-center justify-center shrink-0">
                        {approvalRequester?.avatar ? (
                          <img src={approvalRequester.avatar} alt={approvalRequester.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="ri-user-line text-foreground-400"></i>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground-900 truncate">{approvalRequester?.name ?? '-'}</p>
                        <p className="text-[11px] text-foreground-500">{approvalLeave.userId} · {approvalRequester?.department ?? '-'} · {approvalRequester?.position ?? '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-xs text-foreground-500">Loai don</p>
                      <p className="text-sm font-semibold text-foreground-900">{leaveTypeLabels[approvalLeave.type]}</p>
                    </div>
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-xs text-foreground-500">Hinh thuc</p>
                      <p className="text-sm font-semibold text-foreground-900">{leaveModeLabel}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-xs text-foreground-500">Tu ngay</p>
                      <p className="text-sm text-foreground-900">{format(parseISO(approvalLeave.startDate), 'dd/MM/yyyy', { locale: vi })}</p>
                    </div>
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-xs text-foreground-500">Den ngay</p>
                      <p className="text-sm text-foreground-900">{format(parseISO(approvalLeave.endDate), 'dd/MM/yyyy', { locale: vi })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {!(approvalLeave.startTime && approvalLeave.endTime) && (
                      <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                        <p className="text-xs text-foreground-500">Tong ngay</p>
                        <p className="text-sm font-semibold text-foreground-900">{totalDays} ngay</p>
                      </div>
                    )}
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-xs text-foreground-500">Tong gio</p>
                      <p className="text-sm font-semibold text-foreground-900">{totalHours ? `${totalHours} gio` : '-'}</p>
                    </div>
                  </div>

                  {approvalLeave.startTime && approvalLeave.endTime && (
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-xs text-foreground-500">Khung gio nghi</p>
                      <p className="text-sm text-foreground-900">{approvalLeave.startTime} - {approvalLeave.endTime}</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                    <p className="text-xs text-foreground-500">Ly do</p>
                    <p className="text-sm text-foreground-800">{approvalLeave.reason}</p>
                  </div>

                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                    <p className="text-xs text-foreground-500">Ban giao</p>
                    <p className="text-sm text-foreground-900">{approvalHandover?.name ?? '-'}</p>
                    <p className="text-xs text-foreground-500">{approvalHandover ? `${approvalHandover.department} - ${approvalHandover.position}` : '-'}</p>
                    <p className="text-xs text-foreground-600 mt-1">{approvalLeave.handoverNote || 'Khong co ghi chu ban giao'}</p>
                  </div>

                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                    <p className="text-xs text-foreground-500">Trang thai</p>
                    <p className="text-sm font-semibold text-foreground-900">{leaveStatusLabels[approvalLeave.status]}</p>
                  </div>

                  {canApproveLeave && (
                    <>
                      <textarea
                        value={approvalComment}
                        onChange={(event) => setApprovalComment(event.target.value)}
                        rows={3}
                        placeholder="Nhap comment khi phe duyet/tu choi..."
                        className="w-full rounded-lg border border-background-200/70 bg-background-100 px-3 py-2 text-sm outline-none focus:border-primary-400"
                      />
                      <div className="sticky bottom-0 bg-background-50 pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => void handleLeaveDecision('approved')}
                          className="flex-1 rounded-lg bg-accent-600 py-2 text-xs font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
                        >
                          {isDeciding ? 'Dang xu ly...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => void handleLeaveDecision('rejected')}
                          className="flex-1 rounded-lg bg-primary-500 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
                        >
                          {isDeciding ? 'Dang xu ly...' : 'Reject'}
                        </button>
                      </div>
                    </>
                  )}

                  {!canApproveLeave && approvalLeave.status === 'approved' && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                      <i className="ri-checkbox-circle-fill text-green-500 text-base"></i>
                      <p className="text-sm font-medium text-green-700">Đơn này đã được phê duyệt.</p>
                    </div>
                  )}
                  {!canApproveLeave && approvalLeave.status === 'rejected' && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                      <i className="ri-close-circle-fill text-red-500 text-base"></i>
                      <p className="text-sm font-medium text-red-700">Đơn này đã bị từ chối.</p>
                    </div>
                  )}
                  {!canApproveLeave && approvalLeave.status !== 'approved' && approvalLeave.status !== 'rejected' && (
                    <p className="text-xs text-foreground-500">Bạn không có quyền phê duyệt đơn này.</p>
                  )}
                </>
              )}

              {!approvalLoading && approvalOvertime && (
                <>
                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-full overflow-hidden bg-background-200 flex items-center justify-center shrink-0">
                        {overtimeRequester?.avatar ? (
                          <img src={overtimeRequester.avatar} alt={overtimeRequester.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="ri-user-line text-foreground-400"></i>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground-900 truncate">{overtimeRequester?.name ?? '-'}</p>
                          <span className="inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-semibold text-secondary-700">
                            {overtimeStageText}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground-500 truncate">
                          {approvalOvertime.userId} · {overtimeRequester?.department ?? '-'} · {overtimeRequester?.position ?? '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-[11px] text-foreground-500">Ngày tăng ca</p>
                      <p className="text-sm font-semibold text-foreground-900">{format(parseISO(approvalOvertime.date), 'dd/MM/yyyy', { locale: vi })}</p>
                    </div>
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-[11px] text-foreground-500">Khung giờ</p>
                      <p className="text-sm font-semibold text-foreground-900">{approvalOvertime.startTime} - {approvalOvertime.endTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-[11px] text-foreground-500">Tổng giờ</p>
                      <p className="text-sm font-semibold text-foreground-900">{approvalOvertime.hours} giờ</p>
                    </div>
                    <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                      <p className="text-[11px] text-foreground-500">Cấp duyệt</p>
                      <p className="text-sm font-semibold text-foreground-900">{overtimeStageText}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                    <p className="text-[11px] text-foreground-500">Người duyệt hiện tại</p>
                    <p className="text-sm text-foreground-900">{overtimeCurrentApprover?.name ?? approvalOvertime.currentApproverId ?? '-'}</p>
                  </div>

                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                    <p className="text-[11px] text-foreground-500">Lý do</p>
                    <p className="text-sm text-foreground-800 leading-relaxed line-clamp-3">{approvalOvertime.reason}</p>
                  </div>

                  <div className="rounded-lg border border-background-200/70 bg-background-100 px-3 py-2">
                    <p className="text-[11px] text-foreground-500">Trạng thái</p>
                    <p className="text-sm font-semibold text-foreground-900">
                      {approvalOvertime.status === 'approved'
                        ? 'Đã duyệt'
                        : approvalOvertime.status === 'rejected'
                          ? 'Đã từ chối'
                          : overtimeStageText}
                    </p>
                  </div>

                  {canApproveOvertime && (
                    <>
                      <textarea
                        value={approvalComment}
                        onChange={(event) => setApprovalComment(event.target.value)}
                        rows={3}
                        placeholder="Nhap comment khi phe duyet/tu choi..."
                        className="w-full rounded-lg border border-background-200/70 bg-background-100 px-3 py-2 text-sm outline-none focus:border-primary-400 resize-none"
                      />
                      <div className="sticky bottom-0 bg-background-50 pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => void handleOvertimeDecision('approved')}
                          className="flex-1 rounded-lg bg-accent-600 py-2 text-xs font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
                        >
                          {isDeciding ? 'Dang xu ly...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isDeciding}
                          onClick={() => void handleOvertimeDecision('rejected')}
                          className="flex-1 rounded-lg bg-primary-500 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
                        >
                          {isDeciding ? 'Dang xu ly...' : 'Reject'}
                        </button>
                      </div>
                    </>
                  )}

                  {!canApproveOvertime && approvalOvertime.status === 'approved' && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                      <i className="ri-checkbox-circle-fill text-green-500 text-base"></i>
                      <p className="text-sm font-medium text-green-700">Đơn này đã được phê duyệt.</p>
                    </div>
                  )}
                  {!canApproveOvertime && approvalOvertime.status === 'rejected' && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                      <i className="ri-close-circle-fill text-red-500 text-base"></i>
                      <p className="text-sm font-medium text-red-700">Đơn này đã bị từ chối.</p>
                    </div>
                  )}
                  {!canApproveOvertime && approvalOvertime.status !== 'approved' && approvalOvertime.status !== 'rejected' && (
                    <p className="text-xs text-foreground-500">Bạn không có quyền phê duyệt đơn này.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}