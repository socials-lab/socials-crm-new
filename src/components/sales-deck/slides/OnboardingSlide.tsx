import { OfferContentBlock } from '@/hooks/useOfferContent';
import { FileSignature, ClipboardList, Phone, UserCheck, Rocket } from 'lucide-react';

interface Props {
  data: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>>;
}

const iconMap: Record<string, any> = {
  FileSignature, ClipboardList, Phone, UserCheck, Rocket,
};

export function OnboardingSlide({ data }: Props) {
  const block = data.onboarding;
  const steps = (block?.content?.steps as any[]) || [];

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col px-32 py-24">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight">
        {block?.title || '🚀 Jak to bude probíhat'}
      </h2>
      <p className="text-[24px] text-white/50 mb-16">
        {block?.subtitle}
      </p>

      <div className="flex items-start gap-6 flex-1">
        {steps.map((step, i) => {
          const Icon = iconMap[step.icon] || Rocket;
          return (
            <div key={i} className="flex-1 relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute top-[36px] left-[calc(50%+40px)] right-[-24px] h-[2px] bg-gradient-to-r from-[#94e700]/40 to-white/10" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="w-[72px] h-[72px] rounded-2xl bg-[#94e700]/10 border border-[#94e700]/30 flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-[#94e700]" />
                </div>
                <span className="text-[13px] font-mono text-[#94e700]/60 mb-3 uppercase tracking-widest">{step.timeline}</span>
                <h3 className="text-[20px] font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-[16px] text-white/40 leading-relaxed max-w-[280px]">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
