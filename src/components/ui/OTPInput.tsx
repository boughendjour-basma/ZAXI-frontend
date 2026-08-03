import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from 'react';
import { cn } from '@/utils/cn';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
}: OTPInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const update = (index: number, char: string) => {
    const newDigits = [...digits];
    newDigits[index] = char;
    onChange(newDigits.join(''));
    if (char && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        update(index, '');
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        update(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  const [focused, setFocused] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(-1);
              update(i, val);
            }}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            className={cn(
              'w-12 h-14 text-center text-xl font-bold rounded-2xl border-2',
              'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
              'transition-all duration-200 outline-none caret-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-rose-400'
                : focused === i
                  ? 'border-teal-500 shadow-sm shadow-teal-500/30 scale-105'
                  : digit
                    ? 'border-teal-300 dark:border-teal-700'
                    : 'border-slate-200 dark:border-slate-700',
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}
