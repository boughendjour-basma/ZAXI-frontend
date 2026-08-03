import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    // Standardize phone format if user typed leading 0
    const normalizedPhone = data.phone.replace(/^0/, '');
    login({ phone: normalizedPhone, password: data.password });
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer Sign In</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your phone and password to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PhoneInput
          label="Phone Number"
          placeholder="555 12 34 56"
          error={errors.phone?.message}
          disabled={isLoggingIn}
          {...register('phone')}
          onChange={(e) => setValue('phone', e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          disabled={isLoggingIn}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoggingIn}
          leftIcon={<LogIn className="h-4 w-4" />}
        >
          Sign In
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

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <Link
          to="/driver/login"
          className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          Sign in as Driver →
        </Link>
      </div>
    </AuthLayout>
  );
}
