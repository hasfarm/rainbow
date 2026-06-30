import { Link } from 'react-router-dom';
import { overtimeTypeLabels, overtimeTypeColors, overtimeTypeIcons, type OvertimeType } from '@/mocks/overtimes';
import { formatDaysEquivalent } from '@/utils/workRules';

function getWeightMultiplier(type: OvertimeType): number {
  if (type === 'weekend') return 2;
  if (type === 'holiday') return 3;
  return 1;
}

interface OvertimeCardProps {
  id: string;
  dateDisplay: string;
  timeDisplay: string;
  hours: number;
  overtimeType: OvertimeType;
  reason: string;
  statusIcon: string;
  statusLabel: string;
  statusColor: string;
  rejectReason?: string | null;
  approverName?: string | null;
  approver2Name?: string | null;
  department?: string;
}

export function OvertimeCard({
  id,
  dateDisplay,
  timeDisplay,
  hours,
  overtimeType,
  reason,
  statusIcon,
  statusLabel,
  statusColor,
  rejectReason,
  approverName,
  approver2Name,
  department = 'Kinh Doanh',
}: OvertimeCardProps) {
  const multiplier = getWeightMultiplier(overtimeType);
  const weightedHours = hours * multiplier;
  const daysEquivalent = formatDaysEquivalent(department, weightedHours);
  const workHoursLabel = department === 'Kho Vận' ? '7.5' : '8';

  return (
    <Link
      to={`/overtime/${id}`}
      className="bg-background-50 border border-background-200/70 rounded-xl p-4 transition-all duration-200 hover:border-primary-300 cursor-pointer block"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center shrink-0">
            <i className="ri-time-line text-lg text-secondary-700"></i>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="text-sm font-heading font-semibold text-foreground-950">{dateDisplay}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap ${overtimeTypeColors[overtimeType]}`}>
                <span className="w-3 h-3 flex items-center justify-center">
                  <i className={`${overtimeTypeIcons[overtimeType]} text-[10px]`}></i>
                </span>
                {overtimeTypeLabels[overtimeType]}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap ${statusColor}`}>
                <span className="w-3 h-3 flex items-center justify-center">
                  <i className={`${statusIcon} text-[11px]`}></i>
                </span>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-foreground-500 mb-1">{timeDisplay} · <span className="font-semibold text-foreground-700">{hours}h thực tế</span></p>
            {multiplier > 1 && (
              <p className="text-[11px] text-foreground-600 mb-1">
                Quy đổi: <span className="font-semibold text-accent-600">{hours}h × {multiplier} = {weightedHours}h</span>
                <span className="text-foreground-400 ml-1">≈ {daysEquivalent} ngày công (÷ {workHoursLabel}h)</span>
              </p>
            )}
            {multiplier === 1 && (
              <p className="text-[11px] text-foreground-400 mb-1">≈ {daysEquivalent} ngày công (÷ {workHoursLabel}h/ngày)</p>
            )}
            <p className="text-xs text-foreground-600 line-clamp-2 leading-relaxed">{reason}</p>
            {approverName && (
              <p className="text-[11px] text-foreground-500 mt-1.5">
                Duyệt cấp 1: <span className="font-medium text-foreground-700">{approverName}</span>
                {approver2Name && <span className="text-foreground-400"> · Cấp 2: <span className="font-medium text-foreground-700">{approver2Name}</span></span>}
              </p>
            )}
            {rejectReason && (
              <div className="mt-2 bg-primary-50 border border-primary-200/50 rounded-lg px-3 py-1.5">
                <p className="text-[11px] text-primary-700">
                  <span className="font-semibold">Lý do từ chối:</span> {rejectReason}
                </p>
              </div>
            )}
          </div>
        </div>
        <span className="w-6 h-6 flex items-center justify-center shrink-0 text-foreground-400">
          <i className="ri-arrow-right-s-line text-lg"></i>
        </span>
      </div>
    </Link>
  );
}