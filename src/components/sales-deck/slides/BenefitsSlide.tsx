import { OfferContentBlock } from '@/hooks/useOfferContent';

interface Props {
  data: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>>;
}

export function BenefitsSlide({ data }: Props) {
  const block = data.benefits;
  const items = (block?.content?.items as any[]) || [];

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col px-32 py-24">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight">
        {block?.title || '🎁 Co od nás dostanete'}
      </h2>
      <p className="text-[24px] text-white/50 mb-14 max-w-[1200px]">
        {block?.subtitle}
      </p>

      <div className="grid grid-cols-3 gap-6 flex-1">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col p-7 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[40px] mb-3">{item.icon}</span>
            <h3 className="text-[22px] font-semibold text-white mb-3">{item.title}</h3>
            <p className="text-[17px] text-white/40 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
