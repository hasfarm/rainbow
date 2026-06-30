import { type Payslip } from '@/mocks/payslips';

interface RowProps {
  label: string;
  value: string | number;
  bold?: boolean;
  accent?: boolean;
  muted?: boolean;
  suffix?: string;
}

function Row({ label, value, bold, accent, muted, suffix }: RowProps) {
  const valueClass = accent
    ? 'font-heading font-bold text-accent-600'
    : bold
      ? 'font-semibold text-foreground-950'
      : muted
        ? 'text-foreground-500'
        : 'font-semibold text-foreground-900';

  const displayValue = typeof value === 'number'
    ? value.toLocaleString('vi-VN')
    : value;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-background-100 last:border-0">
      <span className="text-sm text-foreground-600">{label}</span>
      <span className={`text-sm ${valueClass}`}>
        {displayValue}{suffix ? ` ${suffix}` : ''}
      </span>
    </div>
  );
}

interface PayslipBreakdownProps {
  payslip: Payslip;
}

export function PayslipBreakdown({ payslip }: PayslipBreakdownProps) {
  return (
    <div className="space-y-0">
      <Row label="Lương thỏa thuận" value={payslip.agreedSalary} />
      <Row label="Số công chuẩn" value={payslip.standardDays} muted />
      <Row label="Số công ngày thực tế" value={payslip.actualDays} muted />
      <Row label="Lương tháng thực tế" value={payslip.monthlySalary} />
      <Row label="Số giờ OT ngày thường" value={payslip.otWeekdayHours} muted />
      <Row label="Số giờ tăng ca cuối tuần x2" value={payslip.otWeekend2xHours} muted />
      <Row label="Số giờ tăng ca cuối tuần x3" value={payslip.otWeekend3xHours} muted />
      <Row label="Số giờ OT ngày lễ" value={payslip.otHolidayHours} muted />
      <Row label="Nghỉ không lương" value={payslip.unpaidLeaveDays} muted />
      <Row label="Nghỉ phép năm" value={payslip.annualLeaveDays} muted />
      <Row label="Lương tăng ca" value={payslip.overtimePay} />
      <Row label="Hoa hồng" value={payslip.commission} />
      <Row label="KPI" value={payslip.kpi} />
      <Row label="Công tác" value={payslip.businessTrip} />
      <Row label="Hỗ trợ sự kiện" value={payslip.eventSupport} />
      <Row label="Phụ cấp cơm, xăng xe" value={payslip.mealTransportAllowance} />
      <Row label="Phụ cấp khác" value={payslip.otherAllowance} />

      <div className="py-1" />
      <div className="rounded-lg bg-background-100/50 px-3">
        <Row label="Tổng lương" value={payslip.grossSalary} bold />
        <Row label="Tổng tiền bảo hiểm" value={payslip.insuranceTotal} />
        <Row label="Thuế phải nộp" value={payslip.tax} />
        <Row label="Tạm ứng" value={payslip.advance} />
        <Row label="Số phút phạt đi trễ" value={payslip.latePenaltyMinutes} muted />
        <Row label="Trừ thưởng chuyên cần" value={payslip.attendanceBonusDeduct} />
        <Row label="Số lần quên chấm công" value={payslip.forgotPunchCount} muted />
        <Row label="Trừ quên chấm công" value={payslip.forgotPunchDeduct} />
        <Row label="Trừ khác" value={payslip.otherDeduction} />
      </div>

      <div className="py-2" />
      <div className="rounded-lg bg-accent-50/60 border border-accent-100 px-3">
        <Row label="Tổng thu nhập thực nhận" value={payslip.netIncome} accent />
      </div>
    </div>
  );
}