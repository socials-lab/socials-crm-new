import SocialsLogo from '@/assets/socials-logo.svg';

export function CtaSlide() {
  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#94e700]/8 blur-[180px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      <h2 className="text-[64px] font-bold text-white mb-6 relative z-10 tracking-tight">
        🚀 Pojďme do toho
      </h2>
      
      <p className="text-[28px] text-white/50 mb-16 relative z-10 max-w-[800px] text-center leading-relaxed">
        Celý onboarding zvládneme do 48 hodin — smlouvu pošleme k digitálnímu podpisu, nastavíme přístupy a spustíme kampaně.
      </p>

      <div className="flex gap-16 mb-20 relative z-10">
        <div className="text-center">
          <p className="text-[20px] text-white/60 mb-2">Web</p>
          <p className="text-[24px] font-semibold text-white">socials.cz</p>
        </div>
        <div className="w-px bg-white/20" />
        <div className="text-center">
          <p className="text-[20px] text-white/60 mb-2">E-mail</p>
          <p className="text-[24px] font-semibold text-white">hello@socials.cz</p>
        </div>
      </div>

      <img src={SocialsLogo} alt="Socials" className="w-[180px] relative z-10 opacity-50" />
      
      <p className="absolute bottom-12 text-[16px] text-white/20">
        ✅ Smlouva do 24 hodin · 📞 Osobní přístup · 🚀 7 let na trhu
      </p>
    </div>
  );
}
