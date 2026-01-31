/**
 * Helper utilities for exploring and debugging the TrainingPeaks API.
 */
import { inspect } from 'util';

/**
 * Pretty-print any data with colors and full depth.
 * Great for seeing exactly what the API returns.
 *
 * @example
 * const user = await client.getUser();
 * dump('User Profile', user);
 */
export function dump(label: string, data: unknown): void {
  console.log(`\n=== ${label} ===`);
  console.log(inspect(data, { depth: null, colors: true, maxArrayLength: 50 }));
}

/**
 * Get the keys of an object. Useful for quick exploration.
 *
 * @example
 * const workout = await client.getWorkoutDetails(id);
 * console.log(keys(workout)); // ['workoutId', 'title', 'metrics', ...]
 */
export function keys(obj: object): string[] {
  return Object.keys(obj);
}

/**
 * Show the structure/shape of data without the actual values.
 * Helps you understand the types without overwhelming output.
 *
 * @example
 * const workouts = await client.getWorkouts(start, end);
 * shape(workouts); // Shows: [{ workoutId: number, title: string, ... }] (5 items)
 */
export function shape(obj: unknown): void {
  const describe = (val: unknown, indent = 0): string => {
    const pad = '  '.repeat(indent);
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      return `[${describe(val[0], indent)}] (${val.length} items)`;
    }
    if (typeof val === 'object') {
      const entries = Object.entries(val as object).map(
        ([k, v]) => `${pad}  ${k}: ${describe(v, indent + 1)}`
      );
      return `{\n${entries.join(',\n')}\n${pad}}`;
    }
    return typeof val;
  };
  console.log(describe(obj));
}

/**
 * Save data as JSON for later comparison or analysis.
 * Files are saved to ./snapshots/ with a timestamp.
 *
 * @example
 * const workouts = await client.getWorkouts(start, end);
 * await saveSnapshot('january-workouts', workouts);
 * // Saved: ./snapshots/january-workouts-1706745600000.json
 */
export async function saveSnapshot(name: string, data: unknown): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const snapshotsDir = './snapshots';
  await fs.mkdir(snapshotsDir, { recursive: true });

  const filename = `${name}-${Date.now()}.json`;
  const filepath = path.join(snapshotsDir, filename);

  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`Saved: ${filepath}`);
}

/**
 * Format a date as YYYY-MM-DD (the format TrainingPeaks expects).
 *
 * @example
 * const today = formatDate(new Date());
 * const thirtyDaysAgo = formatDate(new Date(Date.now() - 30 * 86400000));
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get a date range for the last N days.
 *
 * @example
 * const { start, end } = lastNDays(30);
 * const workouts = await client.getWorkouts(start, end);
 */
export function lastNDays(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}
