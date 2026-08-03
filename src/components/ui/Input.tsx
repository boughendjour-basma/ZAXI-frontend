import { forwardRef, type ReactNode, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-12 rounded-2xl border bg-white dark:bg-slate-900',
              'text-slate-900 dark:text-slate-100 placeholder:text-slate-400',
              'transition-all duration-200 outline-none',
              'focus:ring-2 focus:ring-teal-500 focus:border-transparent',
              error
                ? 'border-rose-400 focus:ring-rose-400'
                : 'border-slate-200 dark:border-slate-700',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-slate-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-400">{hint}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
