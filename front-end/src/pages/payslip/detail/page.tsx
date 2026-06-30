import { useContext, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockPayslips, payslipStatusLabels, payslipStatusColors } from '@/mocks/payslips';
import { PayslipBreakdown } from './components/PayslipBreakdown';

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);

  const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const payslip = useMemo(() => mockPayslips.find((p) => p.id === id), [id]);

  const currentStatus = status || payslip?.status || 'pending';

  if (!payslip) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/payslip" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Chi tiết phiếu lương</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-bank-card-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm text-foreground-500">Không tìm thấy phiếu lương</p>
        </div>
      </div>
    );
  }

  const monthLabel = `T${payslip.month.toString().padStart(2, '0')}/${payslip.year}`;
  const periodLabel = `${payslip.periodStart.split('-').reverse().join('/')} - ${payslip.periodEnd.split('-').reverse().join('/')}`;
  const statusLabel = payslipStatusLabels[currentStatus as keyof typeof payslipStatusLabels] || payslipStatusLabels.pending;
  const statusColor = payslipStatusColors[currentStatus as keyof typeof payslipStatusColors] || payslipStatusColors.pending;

  const handleConfirm = () => {
    setStatus('confirmed');
  };

  const handleDispute = () => {
    if (disputeReason.trim().length < 5) return;
    setStatus('disputed');
    setShowDisputeModal(false);
    setDisputeReason('');
  };

  const showActions = currentStatus === 'pending';

  return (
    <div className="px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link to="/payslip" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </Link>
        <h1 className="text-lg font-heading font-bold text-foreground-950">Chi tiết phiếu lương</h1>
      </div>

      {/* Month info */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <i className="ri-user-line text-lg text-primary-500"></i>
          )}
        </div>
        <div>
          <p className="text-base font-heading font-bold text-foreground-950">{monthLabel}</p>
          <p className="text-xs text-foreground-500">{periodLabel}</p>
        </div>
        <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusColor} whitespace-nowrap`}>
          {statusLabel}
        </span>
      </div>

      {/* Salary breakdown accordion */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl mb-3 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        >
          <span className="text-sm font-semibold text-foreground-950">Thành phần lương</span>
          <span className="w-5 h-5 flex items-center justify-center transition-transform duration-200">
            <i className={`ri-arrow-down-s-line text-foreground-500 ${isBreakdownOpen ? 'rotate-180' : ''}`}></i>
          </span>
        </button>
        {isBreakdownOpen && (
          <div className="px-4 pb-4">
            <PayslipBreakdown payslip={payslip} />
          </div>
        )}
      </div>

      {/* Note */}
      {payslip.note && (
        <div className="bg-background-50 border border-background-200/70 rounded-xl px-4 py-3 mb-3">
          <p className="text-xs text-foreground-500 mb-1">Ghi chú</p>
          <p className="text-sm text-foreground-800">{payslip.note}</p>
        </div>
      )}

      {/* Action buttons - only when pending */}
      {showActions && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-[60]">
          <div className="mobile-container">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <i className="ri-check-line"></i>
                  Xác nhận
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowDisputeModal(true)}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <i className="ri-error-warning-line"></i>
                  Khiếu nại
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDisputeModal(false)} />
          <div className="relative bg-background-50 rounded-t-2xl w-full mobile-container p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-heading font-bold text-foreground-950">Khiếu nại phiếu lương</h3>
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="w-8 h-8 flex items-center justify-center text-foreground-400 hover:text-foreground-600 cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-foreground-500 mb-3">
              Vui lòng mô tả chi tiết nội dung khiếu nại (ít nhất 5 ký tự).
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Ví dụ: Số giờ tăng ca không đúng..."
              maxLength={500}
              rows={4}
              className="w-full bg-background-100 rounded-xl px-3 py-2.5 text-sm text-foreground-950 placeholder:text-foreground-400 outline-none focus:ring-1 focus:ring-primary-300 resize-none mb-4"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-2.5 bg-background-100 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDispute}
                disabled={disputeReason.trim().length < 5}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                Gửi khiếu nại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}