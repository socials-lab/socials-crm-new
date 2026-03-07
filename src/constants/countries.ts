export const MANAGED_COUNTRIES = [
  { code: 'CZ', name: 'Česko', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovensko', flag: '🇸🇰' },
  { code: 'DE', name: 'Německo', flag: '🇩🇪' },
  { code: 'AT', name: 'Rakousko', flag: '🇦🇹' },
  { code: 'PL', name: 'Polsko', flag: '🇵🇱' },
  { code: 'HU', name: 'Maďarsko', flag: '🇭🇺' },
  { code: 'RO', name: 'Rumunsko', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulharsko', flag: '🇧🇬' },
  { code: 'HR', name: 'Chorvatsko', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovinsko', flag: '🇸🇮' },
  { code: 'FR', name: 'Francie', flag: '🇫🇷' },
  { code: 'IT', name: 'Itálie', flag: '🇮🇹' },
  { code: 'ES', name: 'Španělsko', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugalsko', flag: '🇵🇹' },
  { code: 'NL', name: 'Nizozemsko', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgie', flag: '🇧🇪' },
  { code: 'LU', name: 'Lucembursko', flag: '🇱🇺' },
  { code: 'IE', name: 'Irsko', flag: '🇮🇪' },
  { code: 'DK', name: 'Dánsko', flag: '🇩🇰' },
  { code: 'SE', name: 'Švédsko', flag: '🇸🇪' },
  { code: 'FI', name: 'Finsko', flag: '🇫🇮' },
  { code: 'EE', name: 'Estonsko', flag: '🇪🇪' },
  { code: 'LV', name: 'Lotyšsko', flag: '🇱🇻' },
  { code: 'LT', name: 'Litva', flag: '🇱🇹' },
  { code: 'GR', name: 'Řecko', flag: '🇬🇷' },
  { code: 'CY', name: 'Kypr', flag: '🇨🇾' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'GB', name: 'Velká Británie', flag: '🇬🇧' },
  { code: 'US', name: 'Spojené státy', flag: '🇺🇸' },
] as const;

export type ManagedCountryCode = typeof MANAGED_COUNTRIES[number]['code'];

export function getCountryFlag(code: string): string {
  const country = MANAGED_COUNTRIES.find((item) => item.code === code);
  if (!country) {
    throw new Error(`Unknown managed country code: ${code}`);
  }
  return country.flag;
}

export function getCountryName(code: string): string {
  const country = MANAGED_COUNTRIES.find((item) => item.code === code);
  if (!country) {
    throw new Error(`Unknown managed country code: ${code}`);
  }
  return country.name;
}
