import { useNavigate } from 'react-router-dom';
import logoUrl from '@/assets/logo.png';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Top half with Logo & Tagline */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-16">
        <img
          src={logoUrl}
          alt="ZAXI VTC"
          className="w-52 h-auto object-contain mb-4"
        />
        <p className="text-slate-800 text-sm font-medium tracking-wide">
          Votre chauffeur, à votre service
        </p>
      </div>

      {/* Bottom Orange Card */}
      <div className="bg-zaxi-orange rounded-t-[40px] px-8 pt-10 pb-12 shadow-2xl flex flex-col justify-between">
        <div>
          <h1 className="text-white font-serif-zaxi text-4xl font-normal leading-tight mb-4 tracking-wide text-left">
            Bienvenue
          </h1>
          <p className="text-white/90 text-sm font-light leading-relaxed max-w-[280px] mb-10 text-left">
            Réservez votre chauffeur en quelques secondes où que vous soyez
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => navigate('/login')}
            className="bg-black text-white hover:bg-neutral-900 rounded-full py-3.5 px-4 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 flex-1 cursor-pointer"
          >
            se connecter
          </button>
          <button
            onClick={() => navigate('/verify-phone')}
            className="bg-white text-black hover:bg-neutral-50 rounded-full py-3.5 px-4 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 flex-1 cursor-pointer"
          >
            créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}
