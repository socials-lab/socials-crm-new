/**
 * Centralized formatting utilities for the CRM application
 */

/**
 * Format a number as currency
 * @param amount - The number to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options?: {
    /** Currency symbol to use - defaults to 'Kč' */
    symbol?: 'CZK' | 'Kč' | 'EUR' | '€';
    /** Locale for number formatting - defaults to 'cs-CZ' */
    locale?: string;
    /** Whether to show decimal places - defaults to false for whole numbers */
    showDecimals?: boolean;
    /** Whether to show the currency symbol - defaults to true */
    showSymbol?: boolean;
  }
): string {
  const {
    symbol = 'Kč',
    locale = 'cs-CZ',
    showDecimals = !Number.isInteger(amount),
    showSymbol = true,
  } = options ?? {};

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);

  if (!showSymbol) {
    return formattedNumber;
  }

  // For Czech crowns, symbol goes after the number
  if (symbol === 'Kč' || symbol === 'CZK') {
    return `${formattedNumber} ${symbol}`;
  }

  // For EUR, symbol can go before or after depending on locale
  if (symbol === '€' || symbol === 'EUR') {
    return `${formattedNumber} ${symbol === 'EUR' ? 'EUR' : '€'}`;
  }

  return `${formattedNumber} ${symbol}`;
}

/**
 * Format a number in compact form (e.g., "150K" for 150000)
 * @param amount - The number to format
 * @param locale - Locale for formatting - defaults to 'cs-CZ'
 * @returns Compact formatted string
 */
export function formatCurrencyCompact(amount: number, locale = 'cs-CZ'): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1).replace('.0', '')}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat(locale).format(amount);
}

/**
 * Format a date in Czech locale
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options?: {
    /** Include time - defaults to false */
    includeTime?: boolean;
    /** Format style - defaults to 'short' */
    style?: 'short' | 'medium' | 'long';
  }
): string {
  const { includeTime = false, style = 'short' } = options ?? {};

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: style === 'short' ? 'numeric' : style === 'medium' ? 'short' : 'long',
    year: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return dateObj.toLocaleDateString('cs-CZ', dateOptions);
}

/**
 * Format a percentage
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places - defaults to 0
 * @returns Formatted percentage string
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)} %`;
}

/**
 * Format a phone number for display (basic formatting)
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If it starts with Czech country code, format accordingly
  if (cleaned.startsWith('+420') && cleaned.length === 13) {
    return `+420 ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
  }

  // If it's a 9-digit Czech number without country code
  if (/^\d{9}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  // Return as-is if no pattern matches
  return phone;
}
