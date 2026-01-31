/**
 * Explore fitness metrics from TrainingPeaks.
 *
 * This script demonstrates:
 * - Getting current CTL/ATL/TSB values
 * - Fetching fitness history over time
 * - Understanding the Performance Management Chart data
 *
 * Terminology:
 * - CTL = Chronic Training Load (fitness)
 * - ATL = Acute Training Load (fatigue)
 * - TSB = Training Stress Balance (form = CTL - ATL)
 * - TSS = Training Stress Score (daily load)
 *
 * Run with: npm run explore:fitness
 */
import 'dotenv/config';
import { TrainingPeaksClient } from '../src/index.js';
import { dump, shape, lastNDays, saveSnapshot } from './helpers.js';

const client = new TrainingPeaksClient();

try {
  // Get current fitness values
  console.log('=== Current Fitness ===');
  const current = await client.getCurrentFitness();
  dump('Today\'s Metrics', current);

  console.log('\nInterpretation:');
  console.log(`  CTL (Fitness): ${current.ctl?.toFixed(1) ?? 'N/A'}`);
  console.log(`  ATL (Fatigue): ${current.atl?.toFixed(1) ?? 'N/A'}`);
  console.log(`  TSB (Form):    ${current.tsb?.toFixed(1) ?? 'N/A'}`);

  if (current.tsb !== undefined) {
    if (current.tsb > 25) {
      console.log('  Status: Very fresh - might be losing fitness');
    } else if (current.tsb > 5) {
      console.log('  Status: Fresh - good for racing');
    } else if (current.tsb > -10) {
      console.log('  Status: Neutral - good for training');
    } else if (current.tsb > -30) {
      console.log('  Status: Tired - building fitness');
    } else {
      console.log('  Status: Very fatigued - risk of overtraining');
    }
  }

  // Get fitness history for the last 7 days
  console.log('\n=== Fitness History (Last 7 Days) ===');
  const { start: weekStart, end: weekEnd } = lastNDays(7);
  const weekHistory = await client.getFitnessData(weekStart, weekEnd);

  console.log('\nStructure of fitness data:');
  shape(weekHistory);

  dump('Daily Values', weekHistory);

  // Get 30-day history for trend analysis
  console.log('\n=== 30-Day Trend ===');
  const { start: monthStart, end: monthEnd } = lastNDays(30);
  const monthHistory = await client.getFitnessData(monthStart, monthEnd);

  // Calculate some basic stats
  if (monthHistory.length > 0) {
    const ctlValues = monthHistory.map((d) => d.ctl).filter((v) => v !== undefined) as number[];
    const tssValues = monthHistory.map((d) => d.dailyTss).filter((v) => v !== undefined) as number[];

    if (ctlValues.length > 0) {
      const startCtl = ctlValues[0];
      const endCtl = ctlValues[ctlValues.length - 1];
      const ctlChange = endCtl - startCtl;

      console.log(`\nCTL Trend:`);
      console.log(`  30 days ago: ${startCtl.toFixed(1)}`);
      console.log(`  Today:       ${endCtl.toFixed(1)}`);
      console.log(`  Change:      ${ctlChange >= 0 ? '+' : ''}${ctlChange.toFixed(1)}`);
    }

    if (tssValues.length > 0) {
      const avgTss = tssValues.reduce((a, b) => a + b, 0) / tssValues.length;
      const maxTss = Math.max(...tssValues);

      console.log(`\nTraining Load:`);
      console.log(`  Avg daily TSS: ${avgTss.toFixed(0)}`);
      console.log(`  Max daily TSS: ${maxTss.toFixed(0)}`);
    }
  }

  // Uncomment to save for charting in Excel/Google Sheets:
  // await saveSnapshot('fitness-30days', monthHistory);
} finally {
  await client.close();
}
