import SocialsLogo from '@/assets/socials-logo.svg';

export function TitleSlide() {
  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#94e700]/5 blur-[200px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      
      <img src={SocialsLogo} alt="Socials" className="w-[280px] mb-16 relative z-10" />
      
      <h1 className="text-[72px] font-bold text-white leading-tight text-center relative z-10 tracking-tight">
        Výkonnostní marketing,
        <br />
        <span className="text-[#94e700]">který měříme až na zisk</span>
      </h1>
      
      <p className="text-[28px] text-white/50 mt-10 relative z-10 font-light">
        Úvodní prezentace pro potenciální klienty
      </p>
    </div>
  );
}
