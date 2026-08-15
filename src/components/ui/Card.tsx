import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-white border border-[#FFE0A0]',
  glass: 'bg-white/80 backdrop-blur-md border border-[#FFE0A0]',
  elevated: 'bg-white shadow-xl shadow-amber-100/60',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
