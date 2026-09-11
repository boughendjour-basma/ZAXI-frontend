import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import logoUrl from '@/assets/logo.png';
import { useTranslation } from '@/store/languageStore';

export default function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();
  const { language } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate(role === 'DRIVER' ? '/driver/dashboard' : '/', { replace: true });
      } else {
        navigate('/welcome', { replace: true });
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, role, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FF9900] via-amber-500 to-orange-600 relative overflow-hidden">
      {/* Animated rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0.4 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
          className="absolute w-32 h-32 rounded-full border-2 border-white/30"
        />
      ))}

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 0.2 }}
        className="flex flex-col items-center gap-2 relative z-10 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl"
      >
        {/* Logo image */}
        <motion.img
          src={logoUrl}
          alt="ZAXI"
          animate={{ scale: [0.95, 1.05, 1] }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="w-56 h-auto object-contain filter drop-shadow-xl"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/90 text-xs font-semibold tracking-widest uppercase mt-1"
        >
          {language === 'ar' ? 'سائقك الخاص، في خدمتك' : 'Votre chauffeur, à votre service'}
        </motion.p>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-1.5 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-white/60 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
