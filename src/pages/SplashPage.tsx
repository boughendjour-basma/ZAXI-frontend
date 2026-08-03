import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

export default function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 relative overflow-hidden">
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
        className="flex flex-col items-center gap-4 relative z-10"
      >
        {/* Logo mark */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, delay: 0.8, ease: 'easeInOut' }}
          className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30"
        >
          <span className="text-white font-black text-5xl tracking-tighter">Z</span>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black text-white tracking-tight">ZAXI</h1>
          <p className="text-white/70 text-sm font-medium mt-1 tracking-widest uppercase">
            Your ride, on demand
          </p>
        </motion.div>

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
