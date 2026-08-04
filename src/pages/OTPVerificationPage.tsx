import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { OTPInput } from '@/components/ui/OTPInput';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

export default function OTPVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth, redirectAfterLogin } = useAuth();

  const state = location.state as {
    phone?: string;
    name?: string;
    purpose?: 'register' | 'login';
  } | null;

  const phone = state?.phone ?? '';
  const name = state?.name ?? '';
  const purpose = state?.purpose ?? 'login';

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!phone) {
      toast.error('Session expirée. Veuillez recommencer.');
      navigate('/welcome', { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ─── Login OTP Verification ──────────────────────────────────────────────
  const loginVerifyMutation = useMutation({
    mutationFn: () => AuthService.loginVerify({ phone, code: otp }),
    onSuccess: (res) => {
      const { token, user } = res.data.data!;
      setAuth(token, user);
      redirectAfterLogin(user.role, user.name, user.phone);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Code invalide ou expiré.';
      toast.error(msg);
    },
  });

  // ─── Registration OTP Verification & Final Register ────────────────────────
  const registerMutation = useMutation({
    mutationFn: async () => {
      // Step 1: verify the code to get token
      const verifyRes = await AuthService.verifyCode({ phone, code: otp });
      const verificationToken = verifyRes.data.data?.verificationToken ?? '';
      if (!verificationToken) {
        throw new Error('Jeton de vérification introuvable.');
      }
      // Step 2: call register with name and verification token
      const registerRes = await AuthService.register({ name, verificationToken });
      return registerRes.data.data!;
    },
    onSuccess: (data) => {
      toast.success('Compte créé avec succès !');
      setAuth(data.token, data.user);
      navigate('/', { replace: true });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'La vérification a échoué.';
      toast.error(msg);
    },
  });

  // ─── Resend Code Mutation ──────────────────────────────────────────────────
  const resendMutation = useMutation({
    mutationFn: () => {
      if (purpose === 'register') {
        return AuthService.requestCode({ phone });
      } else {
        return AuthService.loginRequestCode({ phone });
      }
    },
    onSuccess: () => {
      toast.success('Nouveau code envoyé !');
      setCountdown(60);
      setOtp('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erreur lors du renvoi du code.';
      toast.error(msg);
    },
  });

  const handleVerify = () => {
    if (otp.length < 6) {
      toast.error('Veuillez entrer le code de 6 chiffres.');
      return;
    }
    if (purpose === 'register') {
      registerMutation.mutate();
    } else {
      loginVerifyMutation.mutate();
    }
  };

  const isPending = loginVerifyMutation.isPending || registerMutation.isPending;

  return (
    <div className="bg-zaxi-orange min-h-screen flex flex-col justify-between max-w-md mx-auto relative px-8 pt-20 pb-12 shadow-2xl">
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-slate-900 font-serif-zaxi text-3xl font-normal text-left leading-tight mb-2 tracking-wide">
          Entrez votre Code de Verification
        </h1>
        <p className="text-slate-800 text-sm font-medium text-left mb-10">
          Le code a été envoyé via SMS
        </p>

        <div className="space-y-6">
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={isPending}
          />

          {/* Button Entrer (Centered Pill) */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={handleVerify}
              disabled={otp.length < 6 || isPending}
              className="bg-black text-white hover:bg-neutral-900 rounded-full py-3.5 px-16 font-bold text-sm tracking-widest transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Vérification...' : 'Entrer'}
            </button>
          </div>
        </div>
      </div>

      {/* Resend footer */}
      <div className="text-center text-xs text-slate-800 font-semibold mt-8">
        {countdown > 0 ? (
          <p>
            Renvoyer le code dans <span className="font-bold text-black">{countdown}s</span>
          </p>
        ) : (
          <button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="font-bold text-black hover:underline cursor-pointer"
          >
            Renvoyer le code de vérification
          </button>
        )}
      </div>
    </div>
  );
}
