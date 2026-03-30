import creative1 from '@/assets/sales-deck/creative-example-1.jpg';
import creative2 from '@/assets/sales-deck/creative-example-2.jpg';
import creative3 from '@/assets/sales-deck/creative-example-3.jpg';
import creative4 from '@/assets/sales-deck/creative-example-4.jpg';
import creative5 from '@/assets/sales-deck/creative-example-5.jpg';
import creative6 from '@/assets/sales-deck/creative-example-6.jpg';

const examples = [
  { src: creative1, label: 'Meta Ads — Fashion', aspect: 'square' },
  { src: creative2, label: 'Meta Ads — Kosmetika', aspect: 'square' },
  { src: creative3, label: 'Google Shopping — Nábytek', aspect: 'square' },
  { src: creative4, label: 'Meta Ads — Sport', aspect: 'square' },
  { src: creative5, label: 'Stories — Šperky', aspect: 'vertical' },
  { src: creative6, label: 'Stories — Káva', aspect: 'vertical' },
];

export function CreativeExamplesSlide() {
  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col px-32 py-20">
      <h2 className="text-[48px] font-bold text-white mb-3 tracking-tight text-center">
        🖼️ Ukázky našich kreativ
      </h2>
      <p className="text-[22px] text-white/50 mb-14 text-center">
        Příklady bannerů a stories, které tvoříme pro naše klienty
      </p>

      <div className="flex gap-6 justify-center items-end flex-1">
        {/* 4 square creatives */}
        {examples.filter(e => e.aspect === 'square').map((ex, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-[300px] h-[300px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              <img src={ex.src} alt={ex.label} className="w-full h-full object-cover" />
            </div>
            <span className="text-[15px] text-white/40 mt-4 font-medium">{ex.label}</span>
          </div>
        ))}

        {/* 2 vertical story creatives */}
        {examples.filter(e => e.aspect === 'vertical').map((ex, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-[180px] h-[320px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              <img src={ex.src} alt={ex.label} className="w-full h-full object-cover" />
            </div>
            <span className="text-[15px] text-white/40 mt-4 font-medium">{ex.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
