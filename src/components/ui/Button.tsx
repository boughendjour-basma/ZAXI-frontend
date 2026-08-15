import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FF9900] hover:brightness-105 active:brightness-95 text-black font-bold shadow-sm shadow-amber-200',
  secondary:
    'bg-[#1A1A1A] hover:bg-black active:bg-[#333] text-white',
  ghost:
    'bg-transparent hover:bg-[#FFF3D6] active:bg-[#FFE0A0] text-[#555]',
  danger:
    'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-sm shadow-rose-200',
  outline:
    'border border-[#FF9900] text-[#FF9900] hover:bg-[#FFF3D6] active:bg-[#FFE0A0]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-2xl',
  lg: 'h-14 px-6 text-base gap-2.5 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-semibold',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9900] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = 'Button';
