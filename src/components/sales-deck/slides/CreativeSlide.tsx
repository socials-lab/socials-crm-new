import { OfferContentBlock } from '@/hooks/useOfferContent';
import { Palette, Sparkles, Zap } from 'lucide-react';

interface Props {
  data: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>>;
}

export function CreativeSlide({ data }: Props) {
  const block = data.creative_portfolio;

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center px-40">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight text-center">
        {block?.title || '🎨 Grafika, která prodává'}
      </h2>
      <p className="text-[22px] text-white/50 mb-20 text-center max-w-[1000px] leading-relaxed">
        {block?.subtitle}
      </p>

      <div className="flex gap-12">
        <div className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border border-white/10 w-[340px]">
          <Sparkles className="w-14 h-14 text-[#94e700] mb-6" />
          <h3 className="text-[22px] font-semibold text-white mb-3">AI-powered tvorba</h3>
          <p className="text-[17px] text-white/40 text-center">Využíváme AI nástroje pro rychlou tvorbu kreativ na míru</p>
        </div>
        <div className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border border-white/10 w-[340px]">
          <Palette className="w-14 h-14 text-[#94e700] mb-6" />
          <h3 className="text-[22px] font-semibold text-white mb-3">Bannery & videa</h3>
          <p className="text-[17px] text-white/40 text-center">Kompletní kreativy pro výkonnostní reklamy — stačí fotka produktu</p>
        </div>
        <div className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border border-white/10 w-[340px]">
          <Zap className="w-14 h-14 text-[#94e700] mb-6" />
          <h3 className="text-[22px] font-semibold text-white mb-3">Rychlé iterace</h3>
          <p className="text-[17px] text-white/40 text-center">Nové varianty kreativ během hodin, ne dní</p>
        </div>
      </div>
    </div>
  );
}
