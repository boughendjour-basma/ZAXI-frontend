import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  countryCode?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, countryCode = '+213', className, id, ...props }, ref) => {
    const inputId = id ?? 'phone-input';

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
        <div
          className={cn(
            'flex h-12 rounded-2xl border overflow-hidden transition-all duration-200',
            'focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent',
            error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700',
          )}
        >
          <div className="flex items-center px-3 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-w-fit">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              🇩🇿 {countryCode}
            </span>
          </div>
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            className={cn(
              'flex-1 h-full px-3 bg-white dark:bg-slate-900 outline-none',
              'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        )}
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';
