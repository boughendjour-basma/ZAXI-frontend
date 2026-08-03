import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'teal';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
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
