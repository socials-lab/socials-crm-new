import SocialsLogo from '@/assets/socials-logo.svg';

export function TitleSlide() {
  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute w-[900px] h-[900px] rounded-full bg-[#94e700]/5 blur-[250px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#94e700]/8 blur-[120px] top-[30%] left-[60%]" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      <img src={SocialsLogo} alt="Socials" className="w-[320px] mb-20 relative z-10" />
      
      <h1 className="text-[76px] font-bold text-white leading-[1.1] text-center relative z-10 tracking-tight">
        Výkonnostní marketing,
        <br />
        <span className="text-[#94e700]">který měříme až na zisk</span>
      </h1>
      
      <p className="text-[26px] text-white/40 mt-12 relative z-10 font-light tracking-wide">
        Meta · Google · TikTok · Sklik · Creative · Analytics
      </p>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#94e700]/40 to-transparent" />
    </div>
  );
}
