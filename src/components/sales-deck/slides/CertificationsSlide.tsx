export function CertificationsSlide() {
  const certifications = [
    { emoji: '🏅', name: 'Meta Business Partner', desc: 'Certifikovaný partner s přímou podporou od Meta' },
    { emoji: '🎯', name: 'Google Partner', desc: 'Certifikace Google Ads s prokazatelnými výsledky' },
    { emoji: '🛍️', name: 'Shoptet Zlatý Partner', desc: 'Nejvyšší úroveň partnerství se Shoptetem' },
    { emoji: '📱', name: 'TikTok Partner', desc: 'Oficiální reklamní partner TikToku' },
    { emoji: '📊', name: 'Sklik Partner', desc: 'Certifikovaný partner pro Seznam Sklik' },
    { emoji: '🤖', name: 'AI-first agentura', desc: 'Průkopníci v nasazení AI do výkonnostního marketingu' },
  ];

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center px-32">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight text-center">
        🏆 Certifikace & partnerství
      </h2>
      <p className="text-[22px] text-white/50 mb-16 text-center max-w-[900px]">
        Oficiálně certifikovaný tým s přístupem k nejnovějším nástrojům a beta funkcím
      </p>

      <div className="grid grid-cols-3 gap-8">
        {certifications.map((cert, i) => (
          <div
            key={i}
            className="flex items-start gap-6 p-8 rounded-2xl bg-white/[0.03] border border-white/10"
          >
            <span className="text-[48px] shrink-0">{cert.emoji}</span>
            <div>
              <h3 className="text-[22px] font-semibold text-white mb-2">{cert.name}</h3>
              <p className="text-[17px] text-white/40 leading-relaxed">{cert.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
