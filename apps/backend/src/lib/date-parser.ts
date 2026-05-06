/**
 * NLP date parser for natural language scheduling.
 * Handles expressions like "tomorrow at 2pm", "next Monday", "in 30 minutes", etc.
 * No external dependencies.
 */

export interface ParsedDate {
  date: Date;
  confidence: number;
  original: string;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function parseTime(text: string): { hours: number; minutes: number } | null {
  // "2pm", "2:30pm", "14:00", "noon", "midnight", "2 pm", "2:30 am"
  const noonMatch = /\bnoon\b/.test(text);
  if (noonMatch) return { hours: 12, minutes: 0 };

  const midnightMatch = /\bmidnight\b/.test(text);
  if (midnightMatch) return { hours: 0, minutes: 0 };

  const eveningMatch = /\bevening\b/.test(text);
  if (eveningMatch) return { hours: 19, minutes: 0 };

  const morningMatch = /\bmorning\b/.test(text);
  if (morningMatch) return { hours: 9, minutes: 0 };

  const afternoonMatch = /\bafternoon\b/.test(text);
  if (afternoonMatch) return { hours: 14, minutes: 0 };

  // HH:MM am/pm
  const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    // Heuristic: if no meridiem and hour <= 8, assume PM (students schedule evening)
    if (!meridiem && hours >= 1 && hours <= 8) hours += 12;

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  return null;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(9, 0, 0, 0); // default reminder at 9am
  return d;
}

export function parseNaturalDate(text: string, now: Date = new Date()): ParsedDate | null {
  const lower = text.toLowerCase().trim();
  const time = parseTime(lower);

  // --- RELATIVE MINUTES/HOURS ---
  const inMinutes = lower.match(/\bin\s+(\d+)\s+min(?:ute)?s?\b/);
  if (inMinutes) {
    const mins = parseInt(inMinutes[1], 10);
    const date = new Date(now.getTime() + mins * 60 * 1000);
    return { date, confidence: 0.95, original: inMinutes[0] };
  }

  const inHours = lower.match(/\bin\s+(\d+)\s+hours?\b/);
  if (inHours) {
    const hrs = parseInt(inHours[1], 10);
    const date = new Date(now.getTime() + hrs * 60 * 60 * 1000);
    return { date, confidence: 0.95, original: inHours[0] };
  }

  const inDays = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDays) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inDays[1], 10));
    const result = time ? setTime(d, time.hours, time.minutes) : startOfDay(d);
    return { date: result, confidence: 0.93, original: inDays[0] };
  }

  const inWeeks = lower.match(/\bin\s+(\d+)\s+weeks?\b/);
  if (inWeeks) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inWeeks[1], 10) * 7);
    const result = time ? setTime(d, time.hours, time.minutes) : startOfDay(d);
    return { date: result, confidence: 0.93, original: inWeeks[0] };
  }

  // --- TODAY / TONIGHT ---
  if (/\btonight\b/.test(lower)) {
    const d = new Date(now);
    const t = time || { hours: 20, minutes: 0 };
    return { date: setTime(d, t.hours, t.minutes), confidence: 0.95, original: 'tonight' };
  }

  if (/\btoday\b/.test(lower)) {
    const d = new Date(now);
    const t = time || { hours: 9, minutes: 0 };
    return { date: setTime(d, t.hours, t.minutes), confidence: 0.95, original: 'today' };
  }

  // --- TOMORROW ---
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    const t = time || { hours: 9, minutes: 0 };
    return { date: setTime(d, t.hours, t.minutes), confidence: 0.97, original: 'tomorrow' };
  }

  // --- YESTERDAY (past, skip) ---
  if (/\byesterday\b/.test(lower)) return null;

  // --- NEXT WEEK ---
  if (/\bnext week\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    const t = time || { hours: 9, minutes: 0 };
    return { date: setTime(d, t.hours, t.minutes), confidence: 0.85, original: 'next week' };
  }

  // --- NEXT MONTH ---
  if (/\bnext month\b/.test(lower)) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    const t = time || { hours: 9, minutes: 0 };
    return { date: setTime(d, t.hours, t.minutes), confidence: 0.85, original: 'next month' };
  }

  // --- THIS/NEXT <DAY OF WEEK> ---
  const nextDayMatch = lower.match(/\b(this|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (nextDayMatch) {
    const isNext = nextDayMatch[1] === 'next';
    const targetDay = DAYS.indexOf(nextDayMatch[2]);
    const d = new Date(now);
    const currentDay = d.getDay();
    let diff = targetDay - currentDay;

    if (diff <= 0 || isNext) diff += 7;
    d.setDate(d.getDate() + diff);
    const t = time || { hours: 9, minutes: 0 };
    return { date: setTime(d, t.hours, t.minutes), confidence: 0.9, original: nextDayMatch[0] };
  }

  // --- <MONTH> <DAY> e.g. "June 15", "Jan 3rd" ---
  const monthDayMatch = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/
  );
  if (monthDayMatch) {
    const month = MONTHS.indexOf(monthDayMatch[1]);
    const day = parseInt(monthDayMatch[2], 10);
    const d = new Date(now);
    d.setMonth(month, day);
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    const t = time || { hours: 9, minutes: 0 };
    return { date: setTime(d, t.hours, t.minutes), confidence: 0.9, original: monthDayMatch[0] };
  }

  // --- ISO / MM-DD-YYYY / DD/MM/YYYY ---
  const isoMatch = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
    if (!isNaN(d.getTime())) {
      const t = time || { hours: 9, minutes: 0 };
      return { date: setTime(d, t.hours, t.minutes), confidence: 0.98, original: isoMatch[0] };
    }
  }

  const mdyMatch = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (mdyMatch) {
    const month = parseInt(mdyMatch[1], 10) - 1;
    const day = parseInt(mdyMatch[2], 10);
    let year = mdyMatch[3] ? parseInt(mdyMatch[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const t = time || { hours: 9, minutes: 0 };
      return { date: setTime(d, t.hours, t.minutes), confidence: 0.88, original: mdyMatch[0] };
    }
  }

  // --- Just a time today ("at 3pm") ---
  if (time) {
    const d = new Date(now);
    const result = setTime(d, time.hours, time.minutes);
    // If time already passed, schedule for tomorrow
    if (result <= now) result.setDate(result.getDate() + 1);
    return { date: result, confidence: 0.75, original: `at ${time.hours}:${String(time.minutes).padStart(2, '0')}` };
  }

  return null;
}

/** Extract the first reminder-like date from arbitrary text. */
export function extractReminderDate(text: string, now: Date = new Date()): ParsedDate | null {
  // Common reminder patterns to try first
  const reminderPhrases = [
    /remind(?:er)?\s+(?:me\s+)?(?:to\s+\w+\s+)?(.+)/i,
    /(?:set\s+)?reminder\s+(?:for\s+)?(.+)/i,
    /don'?t\s+forget\s+(?:to\s+\w+\s+)?(.+)/i,
    /alert\s+(?:me\s+)?(.+)/i,
  ];

  for (const pattern of reminderPhrases) {
    const match = text.match(pattern);
    if (match) {
      const result = parseNaturalDate(match[1], now);
      if (result) return result;
    }
  }

  return parseNaturalDate(text, now);
}
