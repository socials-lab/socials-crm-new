// Demo data for colleague personal and billing information
// This enriches real colleagues from Supabase with frontend-only demo data

import type { Colleague } from '@/types/crm';

export interface ColleagueDemoData {
  avatar_url: string | null;
  personal_email: string | null;
  birthday: string | null;
  ico: string | null;
  dic: string | null;
  company_name: string | null;
  billing_street: string | null;
  billing_city: string | null;
  billing_zip: string | null;
  bank_account: string | null;
}

// Sample demo data based on colleague name (deterministic by name hash)
const demoDataPool: ColleagueDemoData[] = [
  {
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    personal_email: 'jan.personal@gmail.com',
    birthday: '1990-03-15',
    ico: '12345678',
    dic: 'CZ12345678',
    company_name: 'Jan Novák OSVČ',
    billing_street: 'Příkladná 123',
    billing_city: 'Praha',
    billing_zip: '110 00',
    bank_account: '123456789/0100',
  },
  {
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    personal_email: 'petra.home@seznam.cz',
    birthday: '1988-07-22',
    ico: '87654321',
    dic: 'CZ87654321',
    company_name: 'Petra Design s.r.o.',
    billing_street: 'Tvůrčí 456',
    billing_city: 'Brno',
    billing_zip: '602 00',
    bank_account: '987654321/0300',
  },
  {
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    personal_email: 'martin.soukromy@gmail.com',
    birthday: '1992-11-08',
    ico: '11223344',
    dic: 'CZ11223344',
    company_name: 'Martin Digital',
    billing_street: 'Marketingová 789',
    billing_city: 'Ostrava',
    billing_zip: '702 00',
    bank_account: '112233445/0800',
  },
  {
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    personal_email: 'lucie.doma@email.cz',
    birthday: '1995-01-30',
    ico: '55667788',
    dic: null,
    company_name: 'Lucie Creative OSVČ',
    billing_street: 'Kreativní 321',
    billing_city: 'Plzeň',
    billing_zip: '301 00',
    bank_account: '556677889/5500',
  },
  {
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    personal_email: 'tomas.personal@outlook.com',
    birthday: '1987-05-18',
    ico: '99887766',
    dic: 'CZ99887766',
    company_name: 'Tomáš Performance s.r.o.',
    billing_street: 'PPC ulice 555',
    billing_city: 'Liberec',
    billing_zip: '460 01',
    bank_account: '998877665/2010',
  },
  {
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    personal_email: 'anna.soukromy@gmail.com',
    birthday: '1993-09-12',
    ico: '33445566',
    dic: 'CZ33445566',
    company_name: 'Anna Graphics',
    billing_street: 'Designová 777',
    billing_city: 'Olomouc',
    billing_zip: '779 00',
    bank_account: '334455667/0600',
  },
];

// Simple hash function to get consistent demo data for each colleague
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Enriches colleague data with demo personal/billing information
 * Uses the colleague's full_name to deterministically select demo data
 */
export function enrichColleagueWithDemoData(colleague: Colleague): Colleague {
  // If colleague already has personal data, don't override
  if (colleague.ico || colleague.personal_email || colleague.avatar_url || colleague.bank_account) {
    return colleague;
  }

  // Get deterministic demo data based on name
  const index = hashString(colleague.full_name) % demoDataPool.length;
  const demoData = demoDataPool[index];

  // Generate personalized data based on colleague's actual name
  const firstName = colleague.full_name.split(' ')[0].toLowerCase();
  const lastName = colleague.full_name.split(' ').slice(1).join(' ');
  
  return {
    ...colleague,
    avatar_url: demoData.avatar_url,
    personal_email: `${firstName}.personal@gmail.com`,
    birthday: colleague.birthday || demoData.birthday,
    ico: demoData.ico,
    dic: demoData.dic,
    company_name: lastName ? `${colleague.full_name} OSVČ` : demoData.company_name,
    billing_street: demoData.billing_street,
    billing_city: demoData.billing_city,
    billing_zip: demoData.billing_zip,
    bank_account: demoData.bank_account,
  };
}

/**
 * Enriches all colleagues with demo data
 */
export function enrichColleaguesWithDemoData(colleagues: Colleague[]): Colleague[] {
  return colleagues.map(enrichColleagueWithDemoData);
}
