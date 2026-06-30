import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/hooks/useAuth';

interface LeaveCardProps {
  id: string;
  typeIcon: string;
  typeLabel: string;
  typeColor: string;
  dateDisplay: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  statusLabel: string;
  statusColor: string;
  rejectedReason?: string | null;
}

export function LeaveCard({
  id,
  typeIcon,
  typeLabel,
  typeColor,
  dateDisplay,
  reason,
  status,
  statusLabel,
  statusColor,
  rejectedReason,
}: LeaveCardProps) {
  return (
    <Link
      to={`/leave/${id}`}
      className="block bg-background-50 border border-background-200/70 rounded-xl p-4 transition-all duration-200 hover:border-primary-300 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className={`w-10 h-10 ${typeColor} rounded-xl flex items-center justify-center shrink-0`}>
            <i className={`${typeIcon} text-lg`}></i>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-heading font-semibold text-foreground-950 truncate">{typeLabel}</h3>
              <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-foreground-500 mb-1.5">{dateDisplay}</p>
            <p className="text-xs text-foreground-600 line-clamp-2 leading-relaxed">{reason}</p>
            {status === 'rejected' && rejectedReason && (
              <div className="mt-2 bg-primary-50 border border-primary-200/50 rounded-lg px-3 py-1.5">
                <p className="text-[11px] text-primary-700">
                  <span className="font-semibold">Lý do từ chối:</span> {rejectedReason}
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