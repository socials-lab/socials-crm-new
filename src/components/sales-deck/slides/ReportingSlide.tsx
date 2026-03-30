import { OfferContentBlock } from '@/hooks/useOfferContent';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

interface Props {
  data: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>>;
}

export function ReportingSlide({ data }: Props) {
  const block = data.reporting;

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center px-40">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight text-center">
        {block?.title || '📊 Reporting až na úroveň zisku'}
      </h2>
      <p className="text-[24px] text-white/50 mb-20 text-center max-w-[1100px]">
        {block?.subtitle}
      </p>

      <div className="flex gap-12 mb-16">
        <div className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border border-white/10 w-[360px]">
          <BarChart3 className="w-16 h-16 text-[#94e700] mb-6" />
          <h3 className="text-[24px] font-semibold text-white mb-3">Revenue tracking</h3>
          <p className="text-[18px] text-white/40 text-center">Přesný přehled o tržbách z jednotlivých kanálů v reálném čase</p>
        </div>
        <div className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border border-white/10 w-[360px]">
          <TrendingUp className="w-16 h-16 text-[#94e700] mb-6" />
          <h3 className="text-[24px] font-semibold text-white mb-3">Contribution margin</h3>
          <p className="text-[18px] text-white/40 text-center">Měříme skutečný zisk na úrovni produktu, ne jen revenue</p>
        </div>
        <div className="flex flex-col items-center p-10 rounded-2xl bg-white/[0.03] border border-white/10 w-[360px]">
          <DollarSign className="w-16 h-16 text-[#94e700] mb-6" />
          <h3 className="text-[24px] font-semibold text-white mb-3">24/7 přístup</h3>
          <p className="text-[18px] text-white/40 text-center">Živý report s aktuálními daty kdykoli potřebujete</p>
        </div>
      </div>

      <p className="text-[18px] text-white/30 italic">
        {block?.content?.note}
      </p>
    </div>
  );
}
