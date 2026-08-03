import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Car } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-teal-950/20 dark:to-slate-900 p-6 relative max-w-md mx-auto">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Top Header & Branding */}
      <div className="pt-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-teal-500/30 mb-6"
        >
          <span className="text-white font-black text-4xl tracking-tighter">Z</span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Welcome to ZAXI
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs"
        >
          Premium single-driver VTC experience. Safe, reliable, and effortless rides.
        </motion.p>
      </div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 my-8"
      >
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Personalized Service</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Direct dedicated driver for ultimate comfort.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Verified & Secure</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live GPS tracking and transparent trip rates.</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3 pb-6"
      >
        <Button
          fullWidth
          size="lg"
          rightIcon={<ArrowRight className="h-5 w-5" />}
          onClick={() => navigate('/verify-phone')}
        >
          Book a Ride (Sign Up)
        </Button>

        <Button
          fullWidth
          size="lg"
          variant="outline"
          onClick={() => navigate('/login')}
        >
          Sign In as Customer
        </Button>

        <div className="pt-2 text-center">
          <button
            onClick={() => navigate('/driver/login')}
            className="text-xs font-semibold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Are you the Driver? Sign in here →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
