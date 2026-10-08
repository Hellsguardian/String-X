import type { Page24Person, Page24Year, Page24YearBadge } from '../types';

/** "Aanya Shah" → "Aanya". Empty/whitespace → "". */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th", 11 → "11th", 21 → "21st". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/** Big text on the year card. */
export function yearValue(year: Page24Year): string {
  if (typeof year === 'number' && Number.isFinite(year)) return ordinal(Math.trunc(year));
  const s = String(year).trim();
  if (/^\d+$/.test(s)) return ordinal(parseInt(s, 10));
  return s;
}

/** Resolved year card for a person (explicit override wins). */
export function yearBadge(person: Page24Person): Page24YearBadge {
  if (person.yearBadge) return person.yearBadge;
  return { value: yearValue(person.year), caption: 'YEAR' };
}

/** "B.Tech 2nd Year", "2nd Year", "B.Tech PG". */
export function courseAndYear(person: Page24Person): string {
  const v = yearValue(person.year);
  const isPG = v.toUpperCase() === 'PG';
  const yearPart = isPG ? 'PG' : `${v} Year`;
  return [person.course?.trim(), yearPart].filter(Boolean).join(' ');
}

/** Case-insensitive intersection that keeps the matched user's order and spelling. */
export function intersectInterests(a: string[] | undefined, b: string[] | undefined): string[] {
  if (!a?.length || !b?.length) return [];
  const set = new Set(a.map((x) => x.trim().toLowerCase()));
  return b.filter((x) => set.has(x.trim().toLowerCase()));
}
