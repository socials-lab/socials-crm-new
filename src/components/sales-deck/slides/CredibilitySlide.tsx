import { OfferContentBlock } from '@/hooks/useOfferContent';

interface Props {
  data: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>>;
}

export function CredibilitySlide({ data }: Props) {
  const badges = data.credibility_badges?.content?.items as string[] || [];

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center px-40">
      <h2 className="text-[56px] font-bold text-white mb-20 text-center tracking-tight">
        Socials v číslech
      </h2>
      
      <div className="flex flex-wrap justify-center gap-10">
        {badges.map((badge, i) => {
          const emoji = badge.slice(0, 2);
          const text = badge.slice(2).trim();
          return (
            <div
              key={i}
              className="flex flex-col items-center justify-center w-[300px] h-[200px] rounded-2xl bg-white/5 border border-white/10 hover:border-[#94e700]/30 transition-colors"
            >
              <span className="text-[48px] mb-4">{emoji}</span>
              <span className="text-[22px] text-white/90 font-medium text-center px-4">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
