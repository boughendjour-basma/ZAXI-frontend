import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthService } from '@/services/auth.service';
import logoUrl from '@/assets/logo.png';
import { useTranslation } from '@/store/languageStore';

const schema = z.object({
  phone: z
    .string()
    .min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres')
    .max(15, 'Numéro invalide')
    .regex(/^[0-9+]+$/, 'Chiffres uniquement'),
  dateOfBirth: z.string().min(1, 'La date de naissance est requise'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', dateOfBirth: '' },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: FormValues) => AuthService.forgotPasswordVerify(data),
    onSuccess: (res) => {
      const { resetToken } = res.data.data!;
      navigate('/reset-password', { state: { resetToken }, replace: true });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        (language === 'ar'
          ? 'رقم الهاتف أو تاريخ الميلاد غير صحيح.'
          : 'Numéro de téléphone ou date de naissance invalide.');
      toast.error(msg);
    },
  });

  const onSubmit = (data: FormValues) => verifyMutation.mutate(data);

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
        <img src={logoUrl} alt="ZAXI" style={{ width: '200px', height: 'auto', objectFit: 'contain' }} />
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
            margin: '0 0 6px 0',
            letterSpacing: '0.3px',
          }}
        >
          {t.auth.forgotPasswordTitle}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textAlign: 'center', margin: '0 0 20px 0' }}>
          {t.auth.forgotPasswordSubtitle}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Phone */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '14px', padding: '0 14px' }}>
              <input
                type="text"
                inputMode="numeric"
                placeholder={t.auth.phonePlaceholder}
                disabled={verifyMutation.isPending}
                {...register('phone')}
                onChange={(e) => setValue('phone', e.target.value.replace(/\s+/g, ''))}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#333', padding: '14px 0', border: 'none', outline: 'none', fontSize: '13px', fontWeight: 500 }}
              />
            </div>
            {errors.phone && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.phone.message}
              </span>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: '14px', padding: '0 14px' }}>
              <input
                type="date"
                disabled={verifyMutation.isPending}
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

          {/* Submit */}
          <div style={{ paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={verifyMutation.isPending}
              style={{
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: 700,
                cursor: verifyMutation.isPending ? 'not-allowed' : 'pointer',
                width: '100%',
                letterSpacing: '0.5px',
                opacity: verifyMutation.isPending ? 0.5 : 1,
              }}
            >
              {verifyMutation.isPending
                ? t.common.loading
                : (language === 'ar' ? 'التحقق من الهوية' : 'Vérifier mon identité')}
            </button>
          </div>

          {/* Back to login */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link
              to="/login"
              style={{ color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'underline' }}
            >
              {t.common.back} — {t.auth.loginLink}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
