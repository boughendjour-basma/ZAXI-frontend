import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'teal';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#FFF3D6] text-[#1A1A1A]',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-[#FFF3D6] text-[#1A1A1A] border border-[#FFE0A0]',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  info: 'bg-[#FFF3D6] text-[#FF9900] border border-[#FFE0A0]',
  teal: 'bg-[#FFF3D6] text-[#FF9900] border border-[#FFE0A0]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Map booking statuses to badge variants */
export function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    ACCEPTED: 'info',
    IN_PROGRESS: 'teal',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REJECTED: 'danger',
  };

  return <Badge variant={map[status] ?? 'default'}>{status.replace('_', ' ')}</Badge>;
}
