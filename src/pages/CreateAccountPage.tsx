import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, Phone } from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import { useTranslation } from '@/store/languageStore';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z
    .string()
    .min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres')
    .max(15, 'Numéro invalide')
    .regex(/^[0-9+]+$/, 'Chiffres uniquement'),
  dateOfBirth: z.string().min(1, 'La date de naissance est requise'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const { t, language } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: '',
      dateOfBirth: '',
      password: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormValues) => AuthService.register(data),
    onSuccess: (res) => {
      const { token, user } = res.data.data!;
      setAuth(token, user);
      toast.success(
        language === 'ar'
          ? 'تم إنشاء الحساب بنجاح ! مرحباً بك في ZAXI.'
          : 'Compte créé avec succès ! Bienvenue sur ZAXI.'
      );
      navigate('/', { replace: true });
    },
    onError: (err: any) => {
      let msg = language === 'ar' ? 'حدث خطأ أثناء التسجيل.' : "Erreur lors de l'inscription.";
      const resData = err.response?.data;
      if (resData) {
        if (resData.message === 'Account already exists for this phone number') {
          msg = language === 'ar'
            ? 'يوجد حساب مسجل بهذا الرقم من قبل.'
            : 'Un compte existe déjà avec ce numéro de téléphone.';
        } else if (resData.message === 'Invalid phone number format') {
          msg = language === 'ar'
            ? 'صيغة رقم الهاتف غير صحيحة. (مثال: 0555123456)'
            : 'Format de numéro de téléphone invalide. (ex: 0555123456)';
        } else if (resData.message === 'Invalid date of birth format') {
          msg = language === 'ar'
            ? 'صيغة تاريخ الميلاد غير صحيحة.'
            : 'Format de date de naissance invalide.';
        } else if (resData.errors && Array.isArray(resData.errors) && resData.errors.length > 0) {
          msg = resData.errors[0].message || resData.message || msg;
        } else if (resData.message) {
          msg = resData.message;
        }
      } else if (err.message) {
        msg = err.message;
      }
      toast.error(msg);
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
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
          style={{ width: '200px', height: 'auto', objectFit: 'contain' }}
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
          {t.auth.registerTitle}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '14px', padding: '0 14px' }}>
              <input
                type="text"
                placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                disabled={registerMutation.isPending}
                {...register('name')}
                className="placeholder:text-[#999] placeholder:text-gray-400"
                style={{ width: '100%', backgroundColor: 'transparent', color: '#333', padding: '14px 0', border: 'none', outline: 'none', fontSize: '13px', fontWeight: 500, textAlign: language === 'ar' ? 'right' : 'left' }}
              />
            </div>
            {errors.name && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Phone input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '14px', padding: '0 14px' }}>
              <Phone style={{ width: 18, height: 18, color: '#999', flexShrink: 0, marginRight: language === 'ar' ? 0 : 8, marginLeft: language === 'ar' ? 8 : 0 }} />
              <input
                type="text"
                inputMode="numeric"
                placeholder=""
                disabled={registerMutation.isPending}
                {...register('phone', {
                  onChange: (e) => { e.target.value = e.target.value.replace(/\s+/g, ''); },
                })}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#333', padding: '14px 0', border: 'none', outline: 'none', fontSize: '13px', fontWeight: 500 }}
              />
            </div>
            {errors.phone && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.phone.message}
              </span>
            )}
          </div>

          {/* Date of Birth input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '14px', padding: '0 14px' }}>
              <input
                type="date"
                placeholder=""
                disabled={registerMutation.isPending}
                {...register('dateOfBirth')}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#333', padding: '14px 0', border: 'none', outline: 'none', fontSize: '13px', fontWeight: 500 }}
              />
            </div>
            {errors.dateOfBirth && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.dateOfBirth.message}
              </span>
            )}
          </div>

          {/* Password input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '14px', padding: '0 14px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder=""
                disabled={registerMutation.isPending}
                {...register('password')}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#333', padding: '14px 0', border: 'none', outline: 'none', fontSize: '13px', fontWeight: 500 }}
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
              disabled={registerMutation.isPending}
              style={{
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: 700,
                cursor: registerMutation.isPending ? 'not-allowed' : 'pointer',
                width: '100%',
                letterSpacing: '0.5px',
                opacity: registerMutation.isPending ? 0.5 : 1,
              }}
            >
              {registerMutation.isPending ? t.common.loading : t.auth.registerBtn}
            </button>
          </div>

          {/* Login Link */}
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Link
              to="/login"
              style={{ color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'underline' }}
            >
              {t.auth.alreadyHaveAccount} {t.auth.loginLink}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
