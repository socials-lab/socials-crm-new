const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const isLocalhostHostname = (hostname: string) => {
  const normalized = hostname.toLowerCase();
  return (
    LOCAL_HOSTNAMES.has(normalized) ||
    normalized.endsWith('.localhost')
  );
};

const normalizeConfiguredAppOrigin = (value: string): string => {
  const parsed = new URL(value);
  return parsed.origin;
};

export const resolveAppOrigin = (): string => {
  const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim();
  if (configuredAppUrl) {
    const configuredOrigin = normalizeConfiguredAppOrigin(configuredAppUrl);
    const configuredHost = new URL(configuredOrigin).hostname;

    if (import.meta.env.PROD && isLocalhostHostname(configuredHost)) {
      throw new Error('Invalid VITE_APP_URL in production: localhost origins are not allowed.');
    }

    return configuredOrigin;
  }

  const runtimeOrigin = window.location.origin;
  const runtimeHost = window.location.hostname;

  if (import.meta.env.PROD && isLocalhostHostname(runtimeHost)) {
    throw new Error('Refusing to persist production links from localhost origin. Configure VITE_APP_URL.');
  }

  return runtimeOrigin;
};

export const buildAppUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${resolveAppOrigin()}${normalizedPath}`;
};
