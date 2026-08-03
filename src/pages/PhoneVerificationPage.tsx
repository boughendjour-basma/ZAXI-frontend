import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRight, Smartphone } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AuthService } from '@/services/auth.service';

const phoneSchema = z.object({
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export default function PhoneVerificationPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const requestCodeMutation = useMutation({
    mutationFn: (phone: string) => AuthService.requestCode({ phone }),
    onSuccess: (_, phone) => {
      toast.success('Verification code sent!');
      navigate('/verify-otp', { state: { phone, purpose: 'register' } });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to send verification code.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: PhoneFormValues) => {
    const normalizedPhone = data.phone.replace(/^0/, '');
    requestCodeMutation.mutate(normalizedPhone);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-3">
          <Smartphone className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Phone Number</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          We will send you a 6-digit verification code via SMS
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <PhoneInput
          label="Phone Number"
          placeholder="555 12 34 56"
          error={errors.phone?.message}
          disabled={requestCodeMutation.isPending}
          {...register('phone')}
          onChange={(e) => setValue('phone', e.target.value)}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={requestCodeMutation.isPending}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Send Code
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-teal-600 hover:underline dark:text-teal-400"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
