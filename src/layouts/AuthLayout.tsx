import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-teal-950/20 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* ZAXI logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col items-center gap-2"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <span className="text-white font-black text-2xl tracking-tight">Z</span>
        </div>
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          ZAXI
        </span>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-slate-900 border border-slate-100 dark:border-slate-800 p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
