import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthService } from '@/services/auth.service';
import logoUrl from '@/assets/logo.png';

const registerFormSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function PhoneVerificationPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', phone: '' },
  });

  const requestCodeMutation = useMutation({
    mutationFn: (variables: { phone: string; name: string }) =>
      AuthService.requestCode({ phone: variables.phone }),
    onSuccess: (_, variables) => {
      toast.success('Verification code sent!');
      navigate('/verify-otp', {
        state: {
          name: variables.name,
          phone: variables.phone,
          purpose: 'register',
        },
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to send verification code.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    // Send raw phone — backend normalizePhoneNumber() handles 0→+213 conversion
    requestCodeMutation.mutate({ phone: data.phone, name: data.name });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Top half with Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16">
        <img
          src={logoUrl}
          alt="ZAXI VTC"
          className="w-52 h-auto object-contain mb-4"
        />
        <p className="text-slate-800 text-sm font-medium tracking-wide">
          Votre chauffeur, à votre service
        </p>
      </div>

      {/* Bottom Orange Card */}
      <div className="bg-zaxi-orange rounded-t-[40px] px-8 pt-10 pb-12 shadow-2xl">
        <h1 className="text-white text-3xl font-bold tracking-tight mb-8 text-left">
          creer un compte
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Input */}
          <div className="flex flex-col gap-1 text-left">
            <input
              type="text"
              placeholder="Entrez votre nom ..."
              disabled={requestCodeMutation.isPending}
              {...register('name')}
              className="w-full bg-white text-slate-800 placeholder-slate-400 py-3.5 px-5 rounded-2xl border-0 focus:ring-2 focus:ring-black outline-none font-medium transition-all shadow-inner"
            />
            {errors.name && (
              <span className="text-rose-200 text-xs font-semibold px-2">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Phone Input */}
          <div className="flex flex-col gap-1 text-left">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Entrez votre numero de telephone ..."
              disabled={requestCodeMutation.isPending}
              {...register('phone')}
              onChange={(e) => setValue('phone', e.target.value.replace(/\s+/g, ''))}
              className="w-full bg-white text-slate-800 placeholder-slate-400 py-3.5 px-5 rounded-2xl border-0 focus:ring-2 focus:ring-black outline-none font-medium transition-all shadow-inner"
            />
            {errors.phone && (
              <span className="text-rose-200 text-xs font-semibold px-2">
                {errors.phone.message}
              </span>
            )}
          </div>

          {/* Button Entrer (Centered Pill) */}
          <div className="pt-6 flex justify-center">
            <button
              type="submit"
              disabled={requestCodeMutation.isPending}
              className="bg-black text-white hover:bg-neutral-900 rounded-full py-3.5 px-16 font-bold text-sm tracking-widest transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestCodeMutation.isPending ? 'Envoi...' : 'Entrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
