import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/ui/OTPInput';
import { AuthService } from '@/services/auth.service';

export default function OTPVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { phone?: string; purpose?: 'register' | 'forgot-password' } | null;

  const phone = state?.phone ?? '';
  const purpose = state?.purpose ?? 'register';

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!phone) {
      navigate('/verify-phone', { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => AuthService.verifyCode({ phone, code }),
    onSuccess: (res) => {
      toast.success('Code verified successfully!');
      const otpToken = res.data.data?.otpToken ?? '';
      if (purpose === 'forgot-password') {
        navigate('/reset-password', { state: { phone, code: otp, otpToken } });
      } else {
        navigate('/create-account', { state: { phone, otpToken } });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Invalid or expired OTP code.';
      toast.error(msg);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      purpose === 'forgot-password'
        ? AuthService.forgotPasswordRequestCode({ phone })
        : AuthService.requestCode({ phone }),
    onSuccess: () => {
      toast.success('New code sent!');
      setCountdown(60);
      setOtp('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to resend code.';
      toast.error(msg);
    },
  });

  const handleVerify = () => {
    if (otp.length < 6) {
      toast.error('Please enter the complete 6-digit code.');
      return;
    }
    verifyMutation.mutate(otp);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-3">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enter OTP Code</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter the 6-digit code sent to <span className="font-bold text-slate-700 dark:text-slate-300">+213 {phone}</span>
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
          Verify Code
        </Button>

        <div className="text-center text-xs">
          {countdown > 0 ? (
            <p className="text-slate-400">
              Resend code in <span className="font-bold text-slate-600 dark:text-slate-300">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="font-bold text-teal-600 hover:underline dark:text-teal-400"
            >
              Resend verification code
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
