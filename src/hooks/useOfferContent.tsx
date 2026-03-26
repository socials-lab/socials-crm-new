import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OfferContentBlock {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
}

// Default content used as fallback when DB has no data
export const DEFAULT_OFFER_CONTENT: Record<string, Omit<OfferContentBlock, 'id' | 'updated_at' | 'updated_by'>> = {
  why_us: {
    section_key: 'why_us',
    title: '💪 Proč právě my',
    subtitle: 'Ne sliby, ale skutečný business dopad. Podobnou agenturu na trhu nenajdete.',
    content: {
      items: [
        { stat: '30+ mil. Kč', label: 'měsíčně ve správě', description: 'Spravujeme reklamní rozpočty přes 30 milionů Kč měsíčně. Máme zkušenosti s velkými i středními e-shopy.' },
        { stat: 'AI-first', label: 'přístup ke správě', description: 'Využíváme AI ve všem — od tvorby grafik na míru, přes analýzu dat, až po optimalizaci kampaní. Díky tomu jsme rychlejší a efektivnější.' },
        { stat: 'Zisk', label: 'ne jen revenue', description: 'Neřešíme jen revenue a PNO. Díky naší unikátní technologii měříme váš skutečný zisk na úrovni produktu a contribution margin (náhled níže).' },
        { stat: 'Unikátní', label: 'interní nástroje', description: 'Máme vlastní interní nástroje na správu kampaní, které jsou na trhu zcela unikátní. Nonstop monitoring, grafika na míru a efektivní škálování.' },
        { stat: '5+ let', label: 'zkušeností na specialistu', description: 'Každý náš specialista má 5+ let zkušeností. Žádní junioři. Každý ví, jak z kampaní vytěžit maximum.' },
        { stat: '7 let', label: 'na trhu', description: 'Od roku 2018 pomáháme e-shopům růst. Meta, Google, TikTok, Sklik a zlatý Shoptet partner s přímými kontakty na platformy.' },
      ],
      links: [
        { label: '📈 Případové studie', description: 'Prohlédněte si reálné dopady na tržby klientů', url: 'https://www.socials.cz/pripadove-studie' },
        { label: '🎙️ Socials Podcast', description: 'Otevřeně mluvíme o marketingu, výkonu a vedení agentury', url: 'https://www.socials.cz/socials-podcast' },
        { label: '⭐ Recenze klientů', description: 'Co o nás říkají naši klienti na Shoptet Partner Portálu', url: 'https://partneri.shoptet.cz/profesionalove/socials-advertising/' },
      ],
    },
  },
  benefits: {
    section_key: 'benefits',
    title: '🎁 Co od nás dostanete ke každé spolupráci',
    subtitle: 'Nejde jen o reklamu — stavíme partnerství, které vám pomůže růst',
    content: {
      items: [
        { icon: '📞', title: '1× měsíčně vyhodnocovací call + konzultace', desc: 'Pravidelně spolu procházíme výsledky a hledáme nové příležitosti pro růst vašeho businessu. Žádné překvapení — vždy víte, co se děje a proč.' },
        { icon: '📊', title: '24/7 přístup k reportu výsledků', desc: 'Živý report s aktuálními daty kdykoli potřebujete. Nemusíte čekat na měsíční PDF — vidíte výkon kampaní v reálném čase.' },
        { icon: '💬', title: 'Komunikace v projektovém nástroji Freelo', desc: 'Veškerá komunikace na jednom místě, přehledně a dohledatelně. Žádné ztracené e-maily nebo zapomenuté požadavky.' },
        { icon: '👤', title: 'Komunikujete přímo se specialistou', desc: 'Žádný prostředník ani account manager — mluvíte rovnou s člověkem, který vaše kampaně denně spravuje a zná je do detailu.' },
        { icon: '🏠', title: 'Celý výkonnostní marketing pod jednou střechou', desc: 'Meta, Google, Shoptet, analytika — vše řešíme my. Ušetříte čas i nervy s koordinací více dodavatelů a máte jednoho partnera pro vše.' },
        { icon: '🧠', title: 'Strategická podpora rozvoje vašeho businessu', desc: 'Nejsme jen specialisté na reklamu — rozumíme e-commerce, maržím a obchodním modelům. Pomůžeme vám najít nové příležitosti, optimalizovat nabídku a škálovat byznys, nejen kampaně.' },
      ],
    },
  },
  onboarding: {
    section_key: 'onboarding',
    title: '🚀 Jak to bude probíhat',
    subtitle: 'Celý proces zvládneme obvykle do 48 hodin od vašeho rozhodnutí.',
    content: {
      steps: [
        { icon: 'FileSignature', title: 'Digitální podpis smlouvy', description: 'Pošleme vám k digitálnímu podpisu smlouvu o propagaci a zpracování osobních údajů přes nástroj DigiSign.', timeline: 'Do 24 hodin' },
        { icon: 'ClipboardList', title: 'Přístupy do Freela', description: 'Pošleme vám přístupy do Freela – nástroje na projektové řízení, kde budete mít přehled o všem, co děláme.', timeline: 'Do 24 h od podpisu' },
        { icon: 'Phone', title: 'Onboardingový telefonát', description: 'Spojí se s vámi projektový manažer ohledně onboardingového telefonátu, kde si projdete všechny potřebné další kroky.', timeline: 'Do 24 hodin' },
        { icon: 'UserCheck', title: 'Navýšení přístupů', description: 'Navýšíte nám přístupy do reklamních platforem – zašleme vám přesné instrukce s potřebnými úrovněmi oprávnění.', timeline: 'Cca 24 hodin' },
        { icon: 'Rocket', title: 'Pustíme se do práce!', description: 'Začneme s optimalizací stávajících kampaní a následně spustíme vlastní strategie šité na míru vašemu byznysu.', timeline: "Let's go 🚀" },
      ],
    },
  },
  reporting: {
    section_key: 'reporting',
    title: '📊 Reporting až na úroveň zisku',
    subtitle: 'Pro Shoptet klienty dodáváme reporting až na úroveň contribution margin. Budete přesně vědět, kolik peněz vám vydělá jaký produkt.',
    content: {
      note: '(Na implementaci dalších platforem jako Shopify a Upgates nyní pracujeme.)',
      demo_report_url: 'https://id-preview--68bb7487-e1f5-44d2-a8a4-9044e8cf5438.lovable.app/shared-report/376158d883246f2ecfec54891d03e0a3c0ae4090e0c5dda9',
    },
  },
  creative_portfolio: {
    section_key: 'creative_portfolio',
    title: '🎨 Grafika, která prodává',
    subtitle: 'Všem klientům doporučujeme nechat si kreativy tvořit u nás. Specializujeme se na grafiku pro výkonnostní reklamy — díky AI nástrojům nám stačí fotka produktu na bílém pozadí a vytvoříme kompletní bannery i videa.',
    content: {},
  },
  cta: {
    section_key: 'cta',
    title: '🚀 Pojďme do toho',
    subtitle: 'Stačí vyplnit krátký formulář a můžeme začít.',
    content: {
      extended_subtitle: 'Celý onboarding zvládneme do 48 hodin — smlouvu pošleme k digitálnímu podpisu, nastavíme přístupy a spustíme kampaně.',
      button_text: 'Začít spolupráci',
      footer_note: '✅ Smlouva do 24 hodin',
    },
  },
  clients_logos: {
    section_key: 'clients_logos',
    title: '❤️ Značky, které jsme pomohli posunout',
    subtitle: 'Pomáháme růst firmám napříč odvětvími',
    content: {},
  },
  certifications: {
    section_key: 'certifications',
    title: '🏆 Certifikace & partnerství',
    subtitle: 'Oficiálně certifikovaný tým s přístupem k nejnovějším nástrojům a beta funkcím',
    content: {},
  },
  credibility_badges: {
    section_key: 'credibility_badges',
    title: null,
    subtitle: null,
    content: {
      items: ['✅ 13 seniorních specialistů', '🤖 Enhanced by AI', '📈 30 mil. Kč/měsíc v reklamách', '⭐ 5/5 hodnocení', '🚀 7 let na trhu'],
    },
  },
};

export function useOfferContent() {
  const [blocks, setBlocks] = useState<Record<string, OfferContentBlock>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('offer_content_blocks' as any)
        .select('*');

      if (error) {
        console.warn('offer_content_blocks table not available, using defaults:', error.message);
        setBlocks({});
        setIsLoading(false);
        return;
      }

      const map: Record<string, OfferContentBlock> = {};
      (data as any[])?.forEach((row: any) => {
        map[row.section_key] = row;
      });
      setBlocks(map);
    } catch {
      setBlocks({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const getBlock = useCallback(
    (key: string) => {
      const dbBlock = blocks[key];
      const defaultBlock = DEFAULT_OFFER_CONTENT[key];
      if (dbBlock) return dbBlock;
      if (defaultBlock) return { ...defaultBlock, id: key, updated_at: '', updated_by: null } as OfferContentBlock;
      return null;
    },
    [blocks]
  );

  const updateBlock = useCallback(
    async (sectionKey: string, updates: { title?: string | null; subtitle?: string | null; content?: Record<string, any> }) => {
      const { error } = await supabase
        .from('offer_content_blocks' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('section_key', sectionKey);

      if (error) {
        toast.error('Nepodařilo se uložit: ' + error.message);
        return false;
      }
      toast.success('Uloženo');
      await fetchBlocks();
      return true;
    },
    [fetchBlocks]
  );

  return { blocks, isLoading, getBlock, updateBlock, refetch: fetchBlocks };
}
