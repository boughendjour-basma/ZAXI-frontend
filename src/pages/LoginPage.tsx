import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Smartphone } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { OTPInput } from '@/components/ui/OTPInput';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

// ─── Step 1 schema: phone number ─────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { setAuth, redirectAfterLogin } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  // ─── Step 1: Request login OTP ──────────────────────────────────────────────

  const requestMutation = useMutation({
    mutationFn: (phone: string) => AuthService.loginRequestCode({ phone }),
    onSuccess: (_, phone) => {
      toast.success('Login code sent to your phone!');
      setNormalizedPhone(phone);
      setOtp('');
      setCountdown(60);
      startCountdown();
      setStep('otp');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to send login code.';
      toast.error(msg);
    },
  });

  const onPhoneSubmit = (data: PhoneFormValues) => {
    // Normalize: strip leading 0 to get 9-digit number, then prefix +213
    const normalized = data.phone.replace(/^0/, '');
    requestMutation.mutate(normalized);
  };

  // ─── Step 2: Verify login OTP ───────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: () => AuthService.loginVerify({ phone: normalizedPhone, code: otp }),
    onSuccess: (res) => {
      const { token, user } = res.data.data!;
      setAuth(token, user);
      redirectAfterLogin(user.role, user.name, user.phone);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Invalid or expired code.';
      toast.error(msg);
    },
  });

  const handleVerify = () => {
    if (otp.length < 6) {
      toast.error('Please enter the complete 6-digit code.');
      return;
    }
    verifyMutation.mutate();
  };

  // ─── Countdown timer for resend ─────────────────────────────────────────────

  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = () => {
    requestMutation.mutate(normalizedPhone);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (step === 'otp') {
    return (
      <AuthLayout>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enter Login Code</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter the 6-digit code sent to{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">+213 {normalizedPhone}</span>
          </p>
        </div>

        <div className="space-y-6">
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={verifyMutation.isPending}
          />

          <Button
            fullWidth
            size="lg"
            isLoading={verifyMutation.isPending}
            disabled={otp.length < 6}
            onClick={handleVerify}
          >
            Sign In
          </Button>

          <div className="text-center text-xs">
            {countdown > 0 ? (
              <p className="text-slate-400">
                Resend code in{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={requestMutation.isPending}
                className="font-bold text-teal-600 hover:underline dark:text-teal-400"
              >
                Resend code
              </button>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('phone')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ← Change phone number
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-3">
          <Smartphone className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign In to ZAXI</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your phone number to receive a login code
        </p>
      </div>

      <form onSubmit={handleSubmit(onPhoneSubmit)} className="space-y-4">
        <PhoneInput
          label="Phone Number"
          placeholder="555 12 34 56"
          error={errors.phone?.message}
          disabled={requestMutation.isPending}
          {...register('phone')}
          onChange={(e) => setValue('phone', e.target.value)}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={requestMutation.isPending}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Send Login Code
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link
          to="/verify-phone"
          className="font-bold text-teal-600 hover:underline dark:text-teal-400"
        >
          Create account
        </Link>
      </div>
    </AuthLayout>
  );
}
