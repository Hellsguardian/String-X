import type { Page25Message } from '../types';

/** Formats a timestamp as "07:42 PM" (12-hour, zero-padded hour). */
export function formatPage25Time(value: Page25Message['createdAt']): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
}
