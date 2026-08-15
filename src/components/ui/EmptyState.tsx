import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#888] text-3xl">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#333]">{title}</h3>
      {description && (
        <p className="text-sm text-[#888] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
