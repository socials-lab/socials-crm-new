import { OfferContentBlock } from '@/hooks/useOfferContent';
import { BarChart3, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';

interface Props {
  data: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>>;
}

export function ReportingSlide({ data }: Props) {
  const block = data.reporting;
  const demoUrl = block?.content?.demo_report_url;

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center px-40">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight text-center">
        {block?.title || '📊 Reporting až na úroveň zisku'}
      </h2>
      <p className="text-[24px] text-white/50 mb-16 text-center max-w-[1100px]">
        {block?.subtitle}
      </p>

      <div className="flex gap-12 mb-14">
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

      {demoUrl && (
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#94e700]/10 border border-[#94e700]/30 hover:bg-[#94e700]/20 transition-colors cursor-pointer mb-8"
        >
          <ExternalLink className="w-6 h-6 text-[#94e700]" />
          <span className="text-[22px] font-semibold text-[#94e700]">Prohlédnout ukázkový report</span>
        </a>
      )}

      <p className="text-[18px] text-white/30 italic">
        {block?.content?.note}
      </p>
    </div>
  );
}
