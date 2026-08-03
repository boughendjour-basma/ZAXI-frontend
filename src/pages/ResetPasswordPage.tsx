import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthService } from '@/services/auth.service';

const resetSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { phone?: string; code?: string } | null;
  const phone = state?.phone ?? '';
  const code = state?.code ?? '';

  useEffect(() => {
    if (!phone || !code) {
      toast.error('Session expired. Please request a new reset code.');
      navigate('/forgot-password', { replace: true });
    }
  }, [phone, code, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) =>
      AuthService.resetPassword({ phone, code, newPassword }),
    onSuccess: () => {
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/login', { replace: true });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Password reset failed.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: ResetFormValues) => {
    resetMutation.mutate(data.newPassword);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Set a new password for <span className="font-bold text-slate-700 dark:text-slate-300">+213 {phone}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.newPassword?.message}
          disabled={resetMutation.isPending}
          {...register('newPassword')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          disabled={resetMutation.isPending}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={resetMutation.isPending}
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
        >
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
