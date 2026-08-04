import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import logoUrl from '@/assets/logo.png';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function CreateAccountPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const state = location.state as { phone?: string; otpToken?: string } | null;
  const phone = state?.phone ?? '';
  const verificationToken = state?.otpToken ?? '';

  useEffect(() => {
    if (!phone || !verificationToken) {
      toast.error('Session expired. Please restart registration.');
      navigate('/verify-phone', { replace: true });
    }
  }, [phone, verificationToken, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: phone,
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      AuthService.register({
        name: data.name,
        verificationToken,
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
    registerMutation.mutate({ name: data.name });
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
          creer un compte
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Name input */}
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Entrez votre nom ..."
              disabled={registerMutation.isPending}
              {...register('name')}
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
            {errors.name && (
              <span
                style={{
                  color: '#fde2e2',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  display: 'block',
                }}
              >
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Phone input (pre-filled, read-only) */}
          <div style={{ marginBottom: '6px' }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Entrez votre numero de telephone ..."
              value={phone}
              readOnly
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
                opacity: 0.8,
              }}
            />
          </div>

          {/* Entrer button */}
          <div style={{ paddingTop: '14px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={registerMutation.isPending}
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
                opacity: registerMutation.isPending ? 0.5 : 1,
              }}
            >
              {registerMutation.isPending ? 'Création...' : 'Entrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
