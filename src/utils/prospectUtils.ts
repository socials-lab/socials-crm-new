const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.cz', 'outlook.com', 'hotmail.com',
  'seznam.cz', 'email.cz', 'post.cz', 'centrum.cz', 'volny.cz', 'atlas.cz',
  'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
  'live.com', 'msn.com', 'aol.com', 'mail.com', 'zoho.com',
]);

export function getCompanyUrl(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || FREE_EMAIL_DOMAINS.has(domain)) return null;
  return `https://${domain}`;
}
