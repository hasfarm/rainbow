import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import {
  mockPayslips,
  payslipStatusLabels,
  payslipStatusColors,
  payslipStatusIcon,
  type PayslipStatus,
} from '@/mocks/payslips';

const statusTabs: { key: PayslipStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'disputed', label: 'Khiếu nại' },
];

function formatCurrency(n: number): string {
  return n.toLocaleString('vi-VN');
}

export default function PayslipPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<PayslipStatus | 'all'>('all');

  const userPayslips = mockPayslips.filter((p) => p.userId === user?.id);
  const filteredPayslips = activeTab === 'all'
    ? userPayslips
    : userPayslips.filter((p) => p.status === activeTab);

  const pendingCount = userPayslips.filter((p) => p.status === 'pending').length;
  const disputedCount = userPayslips.filter((p) => p.status === 'disputed').length;
  const latestNet = userPayslips.length > 0
    ? userPayslips.reduce((max, p) => (p.year > max.year || (p.year === max.year && p.month > max.month) ? p : max), userPayslips[0]).netIncome
    : 0;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Phiếu lương</h1>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-primary-600">{formatCurrency(latestNet)}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Tháng gần nhất</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-secondary-600">{pendingCount}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Chờ xác nhận</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-primary-600">{disputedCount}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Khiếu nại</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-background-100 text-foreground-600 hover:bg-background-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payslip list */}
      {filteredPayslips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-bank-card-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm text-foreground-500 mb-1">
            {activeTab === 'all' ? 'Chưa có phiếu lương nào' : `Không có phiếu lương ở trạng thái "${statusTabs.find(t => t.key === activeTab)?.label}"`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPayslips.map((item) => {
            const statusLabel = payslipStatusLabels[item.status];
            const statusColor = payslipStatusColors[item.status];
            const statusIcon = payslipStatusIcon[item.status];

            return (
              <Link
                key={item.id}
                to={`/payslip/${item.id}`}
                className="bg-background-50 border border-background-200/70 rounded-xl p-4 transition-all duration-200 hover:border-primary-300 cursor-pointer block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center shrink-0">
                      <i className="ri-bank-card-line text-base text-accent-600"></i>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground-950">
                        T{item.month.toString().padStart(2, '0')}/{item.year}
                      </p>
                      <p className="text-[11px] text-foreground-500">
                        {item.periodStart.split('-').reverse().join('/')} - {item.periodEnd.split('-').reverse().join('/')}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusColor} whitespace-nowrap`}>
                    <i className={`${statusIcon} text-[10px]`}></i>
                    {statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2.5">
                  <div>
                    <p className="text-[11px] text-foreground-500 mb-0.5">Tổng lương</p>
                    <p className="text-sm font-semibold text-foreground-950">{formatCurrency(item.grossSalary)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-foreground-500 mb-0.5">Thực nhận</p>
                    <p className="text-sm font-semibold text-accent-600">{formatCurrency(item.netIncome)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-foreground-500">
                  <span>Công chuẩn: {item.standardDays}</span>
                  <span>Công thực tế: {item.actualDays}</span>
                </div>

                {item.status === 'disputed' && item.disputedReason && (
                  <div className="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 mt-2.5">
                    <p className="text-[11px] text-primary-700">
                      <span className="font-semibold">Lý do khiếu nại: </span>
                      {item.disputedReason}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}