export function ClientsSlide() {
  const clients = [
    'Dedra', 'Pietro Filipi', 'Kočky.cz', 'Sportisimo', 'IGET',
    'CZC.cz', 'Madora', 'KupKolo.cz', 'BioLIFE', 'Galex',
    'VetPharma', 'BylinkyRevital', 'PetCenter', 'BigBrands', 'Bandi Vamos',
  ];

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center px-32">
      <h2 className="text-[52px] font-bold text-white mb-4 tracking-tight text-center">
        ❤️ Značky, které jsme pomohli posunout
      </h2>
      <p className="text-[22px] text-white/50 mb-20 text-center">
        Pomáháme růst firmám napříč odvětvími
      </p>

      <div className="flex flex-wrap justify-center gap-6 max-w-[1400px]">
        {clients.map((client, i) => (
          <div
            key={i}
            className="px-10 py-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#94e700]/30 transition-colors"
          >
            <span className="text-[24px] font-semibold text-white/70">{client}</span>
          </div>
        ))}
      </div>

      <p className="text-[18px] text-white/30 mt-16">
        …a desítky dalších e-shopů a značek v ČR i na Slovensku
      </p>
    </div>
  );
}
