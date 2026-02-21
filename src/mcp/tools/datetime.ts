import { z } from 'zod';

function applyCustomFormat(date: Date, format: string): string {
  return format
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
    .replace('DD', String(date.getDate()).padStart(2, '0'));
}

// get_current_date

export const getCurrentDateSchema = z.object({
  format: z
    .enum(['iso', 'us', 'eu', 'custom'])
    .optional()
    .default('iso')
    .describe('Output format (default: iso)'),
  customFormat: z
    .string()
    .optional()
    .describe('Custom format string using YYYY, MM, DD placeholders'),
});

export async function getCurrentDate(
  args: z.infer<typeof getCurrentDateSchema>
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  let result: string;
  switch (args.format) {
    case 'us':
      result = `${month}/${day}/${year}`;
      break;
    case 'eu':
      result = `${day}/${month}/${year}`;
      break;
    case 'custom':
      result = applyCustomFormat(now, args.customFormat ?? 'YYYY-MM-DD');
      break;
    default:
      result = `${year}-${month}-${day}`;
      break;
  }

  return JSON.stringify({ date: result });
}
