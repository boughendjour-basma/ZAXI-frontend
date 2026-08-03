import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Lock, UserPlus } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function CreateAccountPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const state = location.state as { phone?: string; otpToken?: string } | null;
  const phone = state?.phone ?? '';
  const otpToken = state?.otpToken ?? '';

  useEffect(() => {
    if (!phone || !otpToken) {
      toast.error('Session expired. Please restart registration.');
      navigate('/verify-phone', { replace: true });
    }
  }, [phone, otpToken, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: (data: { name: string; password: string }) =>
      AuthService.register({
        phone,
        name: data.name,
        password: data.password,
        otpToken,
      }),
    onSuccess: (res) => {
      const { token, user } = res.data.data!;
      setAuth(token, user);
      toast.success('Account created successfully! Welcome to ZAXI.');
      navigate('/', { replace: true });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ name: data.name, password: data.password });
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-3">
          <UserPlus className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Account</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete your details for phone <span className="font-bold text-slate-700 dark:text-slate-300">+213 {phone}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="John Doe"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.name?.message}
          disabled={registerMutation.isPending}
          {...register('name')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          disabled={registerMutation.isPending}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          disabled={registerMutation.isPending}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={registerMutation.isPending}
        >
          Create Account & Start Ride
        </Button>
      </form>
    </AuthLayout>
  );
}
