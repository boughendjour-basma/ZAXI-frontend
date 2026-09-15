import { Globe } from 'lucide-react';
import { useTranslation } from '@/store/languageStore';
import { cn } from '@/utils/cn';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { language, toggleLanguage } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={language === 'fr' ? 'Passer en Arabe (العربية)' : 'Changer en Français'}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group cursor-pointer select-none',
        'bg-[#FFFBF0] text-slate-800 hover:bg-[#FFF3D6] border border-[#FFE0A0] hover:border-[#FF9900]/50 shadow-xs',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-xl bg-[#FF9900]/20 text-[#FF9900] group-hover:scale-105 transition-transform">
          <Globe className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold text-slate-900">
          {language === 'fr' ? 'Langue' : 'اللغة'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#FFE0A0] text-xs font-black text-slate-900 shadow-2xs">
        <span className="text-[11px]">
          {language === 'fr' ? '🇫🇷 FR' : '🇩🇿 AR'}
        </span>
        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
          {language === 'fr' ? 'العربية' : 'Français'}
        </span>
      </div>
    </button>
  );
}
