/**
 * Redact PII from a string before logging.
 * Replaces emails, phone numbers, and long digit sequences with [REDACTED].
 * Truncates the result to maxLen characters.
 */
export function redactPII(input: string, maxLen = 100): string {
  if (!input) return '';
  let s = input;
  // Emails
  s = s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[REDACTED_EMAIL]');
  // International phone numbers (E.164-ish): +, then 7-15 digits with optional separators
  s = s.replace(/\+?\d[\d\s\-().]{6,}\d/g, (m) => {
    const digits = m.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15 ? '[REDACTED_PHONE]' : m;
  });
  // Long digit sequences (credit cards, SSN, account numbers)
  s = s.replace(/\b\d{9,}\b/g, '[REDACTED_NUM]');
  // Truncate
  if (s.length > maxLen) s = s.slice(0, maxLen) + '…';
  return s;
}

/**
 * Format a webhook log line safely.
 * Use this INSTEAD of console.log in webhook handlers.
 */
export function logWebhook(channel: string, sender: string, content: string): void {
  const safeSender = redactPII(sender, 30);
  const safeContent = redactPII(content, 80);
  console.log(`[${channel}] from=${safeSender} content="${safeContent}"`);
}
