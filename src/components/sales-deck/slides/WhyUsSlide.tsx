import { OfferContentBlock } from '@/hooks/useOfferContent';

interface Props {
  data: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>>;
}

export function WhyUsSlide({ data }: Props) {
  const block = data.why_us;
  const items = (block?.content?.items as any[]) || [];

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col px-32 py-24">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight">
        {block?.title || '💪 Proč právě my'}
      </h2>
      <p className="text-[24px] text-white/50 mb-16 max-w-[1200px]">
        {block?.subtitle}
      </p>

      <div className="grid grid-cols-3 gap-8 flex-1">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col p-8 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[42px] font-bold text-[#94e700] mb-2">{item.stat}</span>
            <span className="text-[20px] font-semibold text-white/80 mb-4">{item.label}</span>
            <p className="text-[18px] text-white/40 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
