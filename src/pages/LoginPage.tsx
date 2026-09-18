import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Phone } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import { useTranslation } from '@/store/languageStore';

const loginSchema = z.object({
  phone: z
    .string()
    .min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres')
    .max(15, 'Numéro invalide')
    .regex(/^[0-9+]+$/, 'Chiffres uniquement'),
  password: z.string().min(1, 'Veuillez entrer votre mot de passe'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const { t, language } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormValues) => AuthService.login(data),
    onSuccess: (res) => {
      const { token, user } = res.data.data!;
      setAuth(token, user);
      toast.success(`${t.header.welcome}, ${user.name || (language === 'ar' ? 'مستخدم' : 'Utilisateur')} !`);
      if (user.role === 'DRIVER') {
        navigate('/driver/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        (language === 'ar' ? 'بيانات الدخول غير صحيحة.' : 'Identifiants incorrects.');
      toast.error(msg);
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
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
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {/* Top Logo */}
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
          {t.auth.loginTitle}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Phone input */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: '14px',
                padding: '0 14px',
              }}
            >
              <Phone style={{ width: 18, height: 18, color: '#999', flexShrink: 0, marginRight: language === 'ar' ? 0 : 8, marginLeft: language === 'ar' ? 8 : 0 }} />
              <input
                type="text"
                inputMode="numeric"
                placeholder={language === 'ar' ? 'رقم الهاتف' : 'Numéro de téléphone'}
                disabled={loginMutation.isPending}
                {...register('phone', {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\s+/g, '');
                  },
                })}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#333',
                  padding: '14px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: language === 'ar' ? 'right' : 'left',
                }}
              />
            </div>
            {errors.phone && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.phone.message}
              </span>
            )}
          </div>

          {/* Password input */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: '14px',
                padding: '0 14px',
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={language === 'ar' ? 'كلمة المرور' : 'Mot de passe'}
                disabled={loginMutation.isPending}
                {...register('password')}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#333',
                  padding: '14px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#999' }}
              >
                {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit button */}
          <div style={{ paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              style={{
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loginMutation.isPending ? 'not-allowed' : 'pointer',
                width: '100%',
                letterSpacing: '0.5px',
                opacity: loginMutation.isPending ? 0.5 : 1,
              }}
            >
              {loginMutation.isPending ? t.common.loading : t.auth.loginBtn}
            </button>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <Link
              to="/forgot-password"
              style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {t.auth.forgotPasswordLink}
            </Link>
            <Link
              to="/create-account"
              style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {t.auth.noAccount} {t.auth.registerLink}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
