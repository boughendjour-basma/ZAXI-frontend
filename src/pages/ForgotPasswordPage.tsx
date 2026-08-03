import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound, ArrowRight } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AuthService } from '@/services/auth.service';

const forgotSchema = z.object({
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const requestMutation = useMutation({
    mutationFn: (phone: string) => AuthService.forgotPasswordRequestCode({ phone }),
    onSuccess: (_, phone) => {
      toast.success('Reset code sent to your phone!');
      navigate('/verify-otp', { state: { phone, purpose: 'forgot-password' } });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to request reset code.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: ForgotFormValues) => {
    const normalizedPhone = data.phone.replace(/^0/, '');
    requestMutation.mutate(normalizedPhone);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Forgot Password</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your phone number to receive a password reset verification code
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          Send Reset Code
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Remembered your password?{' '}
        <Link
          to="/login"
          className="font-bold text-teal-600 hover:underline dark:text-teal-400"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
