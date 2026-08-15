import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AuthService } from '@/services/auth.service';
import { Eye, EyeOff, Lock } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

const schema = z
  .object({
    newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // resetToken lives only in router state (memory — never persisted)
  const resetToken: string | undefined = (location.state as any)?.resetToken;

  // If someone navigates here directly without a token, redirect them
  useEffect(() => {
    if (!resetToken) {
      toast.error('Session expirée. Veuillez recommencer.');
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const resetMutation = useMutation({
    mutationFn: (data: FormValues) =>
      AuthService.resetPassword({ resetToken: resetToken!, newPassword: data.newPassword }),
    onSuccess: () => {
      toast.success('Mot de passe mis à jour avec succès !');
      // Clear the state so the token is gone from memory
      navigate('/login', { replace: true, state: {} });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        'Lien de réinitialisation invalide ou expiré. Veuillez recommencer.';
      toast.error(msg);
      navigate('/forgot-password', { replace: true });
    },
  });

  const onSubmit = (data: FormValues) => resetMutation.mutate(data);

  if (!resetToken) return null;

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
          Nouveau mot de passe
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', textAlign: 'center', margin: '0 0 20px 0' }}>
          Choisissez un mot de passe sécurisé
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* New Password */}
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
              <Lock style={{ width: 18, height: 18, color: '#999', flexShrink: 0, marginRight: 8 }} />
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Nouveau mot de passe ..."
                disabled={resetMutation.isPending}
                {...register('newPassword')}
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
                onClick={() => setShowNew(!showNew)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#999' }}
              >
                {showNew ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
            {errors.newPassword && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.newPassword.message}
              </span>
            )}
          </div>

          {/* Confirm Password */}
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
              <Lock style={{ width: 18, height: 18, color: '#999', flexShrink: 0, marginRight: 8 }} />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe ..."
                disabled={resetMutation.isPending}
                {...register('confirmPassword')}
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
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#999' }}
              >
                {showConfirm ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span style={{ color: '#fde2e2', fontSize: '11px', fontWeight: 600, padding: '4px 8px', display: 'block' }}>
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Submit */}
          <div style={{ paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={resetMutation.isPending}
              style={{
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: 700,
                cursor: resetMutation.isPending ? 'not-allowed' : 'pointer',
                width: '100%',
                letterSpacing: '0.5px',
                opacity: resetMutation.isPending ? 0.5 : 1,
              }}
            >
              {resetMutation.isPending ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </div>

          {/* Back link */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link
              to="/forgot-password"
              style={{ color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'underline' }}
            >
              Recommencer
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
