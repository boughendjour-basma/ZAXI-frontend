import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoUrl from '@/assets/logo.png';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 p-4 relative overflow-hidden">
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
        className="mb-8 flex flex-col items-center justify-center"
      >
        <img src={logoUrl} alt="ZAXI" className="w-48 h-auto object-contain" />
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-[#FFE0A0] p-8"
      >
        {children}
      </motion.div>
    </div>
  );
}
