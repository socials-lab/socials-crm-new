import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PortfolioItem {
  id: string;
  title: string;
  file_url: string;
  type: 'image' | 'video';
  sort_order: number;
  is_active: boolean;
}

export function CreativeExamplesSlide() {
  const [items, setItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    (supabase as any)
      .from('portfolio_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }: any) => {
        if (data) setItems(data);
      });
  }, []);

  // Show up to 8 items
  const displayItems = items.slice(0, 8);

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col px-32 py-20">
      <h2 className="text-[48px] font-bold text-white mb-3 tracking-tight text-center">
        🖼️ Ukázky našich kreativ
      </h2>
      <p className="text-[22px] text-white/50 mb-12 text-center">
        Bannery, videa a grafiky, které tvoříme pro naše klienty
      </p>

      {displayItems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[20px] text-white/30">Portfolio se načítá…</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-6 auto-rows-fr">
            {displayItems.map((item) => (
              <div key={item.id} className="flex flex-col items-center">
                <div className="w-[360px] h-[360px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 bg-white/5">
                  {item.type === 'video' ? (
                    <video
                      src={item.file_url}
                      muted
                      className="w-full h-full object-cover"
                      preload="metadata"
                      poster={`${item.file_url}#t=0.5`}
                    />
                  ) : (
                    <img
                      src={item.file_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="text-[15px] text-white/40 mt-3 font-medium truncate max-w-[340px]">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
