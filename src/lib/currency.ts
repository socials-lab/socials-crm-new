type SupportedCurrency = 'CZK' | 'EUR' | 'USD';

interface ExchangeRateResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ExchangeRateResult {
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  providerDate: string;
}

const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['CZK', 'EUR', 'USD'];
const rateCache = new Map<string, ExchangeRateResult>();
const CACHE_TTL_MS = 1000 * 60 * 60;
const cacheTimestampByPair = new Map<string, number>();

function toSupportedCurrency(value: string): SupportedCurrency {
  const normalized = value.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(normalized as SupportedCurrency)) {
    throw new Error(`Unsupported currency: ${value}`);
  }
  return normalized as SupportedCurrency;
}

function getCacheKey(from: SupportedCurrency, to: SupportedCurrency): string {
  return `${from}->${to}`;
}

export async function getExchangeRate(fromRaw: string, toRaw: string): Promise<ExchangeRateResult> {
  const from = toSupportedCurrency(fromRaw);
  const to = toSupportedCurrency(toRaw);

  if (from === to) {
    return {
      from,
      to,
      rate: 1,
      providerDate: new Date().toISOString().slice(0, 10),
    };
  }

  const key = getCacheKey(from, to);
  const cachedRate = rateCache.get(key);
  const cachedAt = cacheTimestampByPair.get(key);
  if (cachedRate && cachedAt && Date.now() - cachedAt <= CACHE_TTL_MS) {
    return cachedRate;
  }

  const endpoint = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to load exchange rate ${from}/${to} (${response.status})`);
  }

  const payload = (await response.json()) as ExchangeRateResponse;
  const rate = payload.rates[to];
  if (typeof rate !== 'number' || Number.isNaN(rate) || rate <= 0) {
    throw new Error(`Invalid exchange rate received for ${from}/${to}`);
  }

  const result: ExchangeRateResult = {
    from,
    to,
    rate,
    providerDate: payload.date,
  };

  rateCache.set(key, result);
  cacheTimestampByPair.set(key, Date.now());
  return result;
}

export async function convertCurrencyAmount(
  amount: number,
  fromRaw: string,
  toRaw: string,
): Promise<{ amount: number; rate: number; providerDate: string }> {
  if (!Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }

  const from = toSupportedCurrency(fromRaw);
  const to = toSupportedCurrency(toRaw);
  const { rate, providerDate } = await getExchangeRate(from, to);
  const decimals = to === 'CZK' ? 0 : 2;
  const converted = Number((amount * rate).toFixed(decimals));

  return {
    amount: converted,
    rate,
    providerDate,
  };
}
