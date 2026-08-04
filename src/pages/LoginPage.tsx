import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthService } from '@/services/auth.service';
import logoUrl from '@/assets/logo.png';

const loginSchema = z.object({
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(10, 'Phone number cannot exceed 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only numbers'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  const requestMutation = useMutation({
    mutationFn: (phone: string) => AuthService.loginRequestCode({ phone }),
    onSuccess: (_, phone) => {
      toast.success('Login code sent to your phone!');
      navigate('/verify-otp', { state: { phone, purpose: 'login' } });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to send login code.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    // Send raw phone — backend normalizePhoneNumber() handles 0→+213 conversion
    requestMutation.mutate(data.phone);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        maxWidth: '448px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Top area with Logo */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: '16px',
        }}
      >
        <img
          src={logoUrl}
          alt="ZAXI"
          style={{
            width: '200px',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Orange Card */}
      <div
        style={{
          backgroundColor: '#FF9900',
          borderRadius: '24px',
          padding: '28px 24px 32px 24px',
          margin: '0 20px 40px 20px',
        }}
      >
        {/* Title */}
        <h1
          style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 700,
            textAlign: 'center',
            margin: '0 0 20px 0',
            letterSpacing: '0.3px',
          }}
        >
          se connecter
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Phone input */}
          <div style={{ marginBottom: '6px' }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Entrez votre numero de telephone ..."
              disabled={requestMutation.isPending}
              {...register('phone')}
              onChange={(e) => setValue('phone', e.target.value.replace(/\s+/g, ''))}
              style={{
                width: '100%',
                backgroundColor: '#fff',
                color: '#333',
                padding: '14px 18px',
                borderRadius: '14px',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                fontWeight: 500,
                boxSizing: 'border-box',
              }}
            />
            {errors.phone && (
              <span
                style={{
                  color: '#fde2e2',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  display: 'block',
                }}
              >
                {errors.phone.message}
              </span>
            )}
          </div>

          {/* Entrer button */}
          <div style={{ paddingTop: '14px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={requestMutation.isPending}
              style={{
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                letterSpacing: '0.5px',
                opacity: requestMutation.isPending ? 0.5 : 1,
              }}
            >
              {requestMutation.isPending ? 'Envoi...' : 'Entrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
