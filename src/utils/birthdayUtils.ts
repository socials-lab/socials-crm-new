import { format, isSameDay, addDays, isBefore, isAfter, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import type { Colleague } from '@/types/crm';

export interface ColleagueWithUpcomingBirthday extends Colleague {
  birthdayThisYear: Date;
  daysUntilBirthday: number;
  isBirthdayToday: boolean;
}

/**
 * Check if a colleague has birthday today
 */
export function hasBirthdayToday(birthday: string | null): boolean {
  if (!birthday) return false;
  
  const today = new Date();
  const birthDate = parseISO(birthday);
  
  return (
    birthDate.getDate() === today.getDate() &&
    birthDate.getMonth() === today.getMonth()
  );
}

/**
 * Get birthday this year (or next year if already passed)
 */
function getBirthdayThisYear(birthday: string): Date {
  const today = new Date();
  const birthDate = parseISO(birthday);
  
  let birthdayThisYear = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );
  
  // If birthday has already passed this year, use next year
  if (isBefore(birthdayThisYear, today) && !isSameDay(birthdayThisYear, today)) {
    birthdayThisYear = new Date(
      today.getFullYear() + 1,
      birthDate.getMonth(),
      birthDate.getDate()
    );
  }
  
  return birthdayThisYear;
}

/**
 * Calculate days until birthday
 */
function getDaysUntilBirthday(birthdayThisYear: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = birthdayThisYear.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get colleagues with upcoming birthdays in the next X days
 */
export function getUpcomingBirthdays(
  colleagues: Colleague[],
  days: number = 7
): ColleagueWithUpcomingBirthday[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = addDays(today, days);
  
  return colleagues
    .filter((colleague) => {
      if (!colleague.birthday || colleague.status === 'left') return false;
      
      const birthdayThisYear = getBirthdayThisYear(colleague.birthday);
      return (
        (isSameDay(birthdayThisYear, today) || isAfter(birthdayThisYear, today)) &&
        isBefore(birthdayThisYear, endDate)
      );
    })
    .map((colleague) => {
      const birthdayThisYear = getBirthdayThisYear(colleague.birthday!);
      const daysUntilBirthday = getDaysUntilBirthday(birthdayThisYear);
      
      return {
        ...colleague,
        birthdayThisYear,
        daysUntilBirthday,
        isBirthdayToday: daysUntilBirthday === 0,
      };
    })
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
}

/**
 * Get colleagues with birthday today
 */
export function getTodaysBirthdays(colleagues: Colleague[]): Colleague[] {
  return colleagues.filter(
    (colleague) => 
      colleague.birthday && 
      colleague.status !== 'left' && 
      hasBirthdayToday(colleague.birthday)
  );
}

/**
 * Format birthday date for display (day and month only)
 */
export function formatBirthdayDate(birthday: string): string {
  return format(parseISO(birthday), 'd. MMMM', { locale: cs });
}

/**
 * Format birthday as short date (e.g., "8. 1.")
 */
export function formatBirthdayShort(birthday: string): string {
  return format(parseISO(birthday), 'd. M.', { locale: cs });
}

/**
 * Calculate age from birthday
 */
export function calculateAge(birthday: string): number {
  const today = new Date();
  const birthDate = parseISO(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get localStorage key for today's birthday notifications
 */
function getBirthdayNotificationKey(): string {
  const today = new Date();
  return `birthday_notifications_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
}

/**
 * Check if birthday notification was already shown today
 */
export function wasBirthdayNotificationShown(colleagueId: string): boolean {
  const key = getBirthdayNotificationKey();
  const shown = localStorage.getItem(key);
  if (!shown) return false;
  
  try {
    const shownIds: string[] = JSON.parse(shown);
    return shownIds.includes(colleagueId);
  } catch {
    return false;
  }
}

/**
 * Mark birthday notification as shown
 */
export function markBirthdayNotificationShown(colleagueId: string): void {
  const key = getBirthdayNotificationKey();
  const shown = localStorage.getItem(key);
  
  let shownIds: string[] = [];
  if (shown) {
    try {
      shownIds = JSON.parse(shown);
    } catch {
      shownIds = [];
    }
  }
  
  if (!shownIds.includes(colleagueId)) {
    shownIds.push(colleagueId);
    localStorage.setItem(key, JSON.stringify(shownIds));
  }
}
