export interface DirectorInfo {
  name: string;
  role: string;
  ownership_percent: number | null;
}

export interface AresData {
  companyName: string;
  dic: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string;
  legalForm: string | null;
  foundedDate: string | null;
  nace: string | null;
  directors: DirectorInfo[];
  spisovaZnacka: string | null;
}

const COURT_MAP: Record<string, string> = {
  MSPH: 'Městský soud v Praze',
  KSCB: 'Krajský soud v Českých Budějovicích',
  KSPL: 'Krajský soud v Plzni',
  KSUL: 'Krajský soud v Ústí nad Labem',
  KSHK: 'Krajský soud v Hradci Králové',
  KSBR: 'Krajský soud v Brně',
  KSOS: 'Krajský soud v Ostravě',
};

export async function fetchAresData(ico: string): Promise<AresData | null> {
  try {
    const basicRes = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
    if (!basicRes.ok) return null;
    const basic = await basicRes.json();

    const sidlo = basic.sidlo || {};
    const legalFormCode = basic.pravniForma;
    const legalFormLabel = legalFormCode ? `${legalFormCode}` : null;

    let directors: DirectorInfo[] = [];
    let spisovaZnacka: string | null = null;
    try {
      const vrRes = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty-vr/${ico}`);
      if (vrRes.ok) {
        const vr = await vrRes.json();
        const zaznam = vr?.zaznamy?.[0];

        const directorNames = new Set<string>();
        const statutarniOrgan = zaznam?.statutarniOrgan;
        if (statutarniOrgan && Array.isArray(statutarniOrgan)) {
          for (const organ of statutarniOrgan) {
            if (organ.clenove && Array.isArray(organ.clenove)) {
              for (const clen of organ.clenove) {
                const fo = clen.fospiravni || clen.fospiravny || clen.clenstvi?.ospiravni || clen;
                const jmeno = fo?.jmeno;
                const prijmeni = fo?.prijmeni;
                if (jmeno && prijmeni) {
                  directorNames.add(`${jmeno} ${prijmeni}`);
                }
              }
            }
          }
        }

        const shareholderMap = new Map<string, number>();
        const spolecnici = zaznam?.spolecnici;
        let totalVklad = 0;

        if (spolecnici && Array.isArray(spolecnici)) {
          for (const s of spolecnici) {
            const vklad = s?.vklad?.souhrn?.hodnota ?? s?.podpiravni?.vklad?.souhrn?.hodnota ?? 0;
            totalVklad += vklad;
          }
          for (const s of spolecnici) {
            const fo = s?.fospiravni || s;
            const jmeno = fo?.jmeno;
            const prijmeni = fo?.prijmeni;
            const vklad = s?.vklad?.souhrn?.hodnota ?? s?.podpiravni?.vklad?.souhrn?.hodnota ?? 0;
            if (jmeno && prijmeni) {
              const name = `${jmeno} ${prijmeni}`;
              const percent = totalVklad > 0 ? Math.round((vklad / totalVklad) * 100) : null;
              shareholderMap.set(name, percent ?? 0);
            }
          }
        }

        const allNames = new Set([...directorNames, ...shareholderMap.keys()]);
        for (const name of allNames) {
          const isDirector = directorNames.has(name);
          const isShareholder = shareholderMap.has(name);
          const percent = shareholderMap.get(name) ?? null;

          let role = '';
          if (isDirector && isShareholder) role = 'jednatel, společník';
          else if (isDirector) role = 'jednatel';
          else role = 'společník';

          directors.push({ name, role, ownership_percent: percent });
        }

        directors.sort((a, b) => (b.ownership_percent ?? 0) - (a.ownership_percent ?? 0));

        // Extract spisovaZnacka
        const szArray = zaznam?.spisovaZnacka;
        if (szArray && Array.isArray(szArray) && szArray.length > 0) {
          const sz = szArray[0];
          const oddil = sz?.oddil;
          const vlozka = sz?.vlozka;
          const soudKod = sz?.soud;
          if (oddil && vlozka) {
            const soudName = (soudKod && COURT_MAP[soudKod]) || soudKod || '';
            spisovaZnacka = soudName
              ? `${oddil} ${vlozka}, ${soudName}`
              : `${oddil} ${vlozka}`;
          }
        }
      }
    } catch {
      // VR endpoint may not exist for all subjects
    }

    return {
      companyName: basic.obchodniJmeno || basic.nazev || '',
      dic: basic.dic || null,
      street: sidlo.textovaAdresa || [sidlo.nazevUlice, sidlo.cisloDomovni ? `${sidlo.cisloDomovni}${sidlo.cisloOrientacni ? '/' + sidlo.cisloOrientacni : ''}` : null].filter(Boolean).join(' ') || null,
      city: sidlo.nazevObce || null,
      zip: sidlo.psc ? String(sidlo.psc) : null,
      country: 'Česká republika',
      legalForm: legalFormLabel,
      foundedDate: basic.datumVzniku || null,
      nace: basic.czNace && basic.czNace.length > 0 ? basic.czNace[0] : null,
      directors,
      spisovaZnacka,
    };
  } catch {
    return null;
  }
}
