import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useAuth } from '@/hooks/useAuth';

const driverLoginSchema = z.object({
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type DriverLoginFormValues = z.infer<typeof driverLoginSchema>;

export default function DriverLoginPage() {
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DriverLoginFormValues>({
    resolver: zodResolver(driverLoginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = (data: DriverLoginFormValues) => {
    const normalizedPhone = data.phone.replace(/^0/, '');
    login({ phone: normalizedPhone, password: data.password });
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-md">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Driver Portal</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Authorized ZAXI Driver Administration Sign In
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PhoneInput
          label="Driver Phone Number"
          placeholder="555 00 00 00"
          error={errors.phone?.message}
          disabled={isLoggingIn}
          {...register('phone')}
          onChange={(e) => setValue('phone', e.target.value)}
        />

        <Input
          label="Admin Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          disabled={isLoggingIn}
          {...register('password')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant="secondary"
          isLoading={isLoggingIn}
          leftIcon={<LogIn className="h-4 w-4" />}
          className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Access Dashboard
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <Link
          to="/login"
          className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ← Return to Customer Login
        </Link>
      </div>
    </AuthLayout>
  );
}
