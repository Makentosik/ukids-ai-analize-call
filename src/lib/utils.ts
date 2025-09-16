import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Парсит дату из русского формата DD.MM.YYYY HH:MM
 * @param dateString - строка даты в формате "16.09.2025 11:07"
 * @returns Date объект или null если парсинг не удался
 */
export function parseRussianDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Регулярное выражение для формата DD.MM.YYYY HH:MM или DD.MM.YYYY HH:MM:SS
  const russianDateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
  const match = dateString.trim().match(russianDateRegex);
  
  if (!match) {
    // Попробуем стандартный парсинг как fallback
    const fallbackDate = new Date(dateString);
    return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
  }
  
  const [, day, month, year, hour, minute, second = '0'] = match;
  
  // Создаем дату (месяц в JavaScript начинается с 0)
  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  );
  
  // Проверяем, что дата валидна
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}
