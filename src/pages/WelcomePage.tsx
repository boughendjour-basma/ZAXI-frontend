import { useNavigate } from 'react-router-dom';
import logoUrl from '@/assets/logo.png';
import { useTranslation } from '@/store/languageStore';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-white max-w-md mx-auto relative overflow-hidden shadow-2xl"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top half with Logo & Tagline */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16">
        <img
          src={logoUrl}
          alt="ZAXI VTC"
          className="w-52 h-auto object-contain mb-4"
        />
        <p className="text-[#1A1A1A] text-sm font-medium tracking-wide">
          {language === 'ar' ? 'سائقك الخاص، في خدمتك' : 'Votre chauffeur, à votre service'}
        </p>
      </div>

      {/* Bottom Orange Card */}
      <div className="bg-zaxi-orange rounded-t-[40px] px-8 pt-10 pb-12 shadow-2xl flex flex-col justify-between">
        <div>
          <h1 className="text-white font-serif-zaxi text-4xl font-normal leading-tight mb-4 tracking-wide text-start">
            {t.auth.welcomeTitle.replace('sur ZAXI', '').replace('في ZAXI', '').replace('في منصة ZAXI', '').replace('في', '').trim() || t.header.welcome}
          </h1>
          <p className="text-white/90 text-sm font-light leading-relaxed max-w-[280px] mb-10 text-start">
            {t.auth.welcomeSubtitle}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => navigate('/login')}
            className="bg-black text-white hover:bg-neutral-900 rounded-full py-3.5 px-4 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 flex-1 cursor-pointer"
          >
            {t.auth.loginBtn}
          </button>
          <button
            onClick={() => navigate('/create-account')}
            className="bg-white text-black hover:bg-neutral-50 rounded-full py-3.5 px-4 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 flex-1 cursor-pointer"
          >
            {t.auth.registerBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
