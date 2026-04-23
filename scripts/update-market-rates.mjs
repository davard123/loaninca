import { writeFile } from 'node:fs/promises';

import {
  buildDailyMarketRates,
  buildFederalReserveRates,
  parseFredCsvSeries
} from '../functions/api/rate-utils.mjs';

const seriesIds = ['FEDFUNDS', 'MORTGAGE30US', 'MORTGAGE15US', 'DGS10'];
const generatedAt = new Date().toISOString();

const seriesEntries = await Promise.all(seriesIds.map(async (seriesId) => {
  const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${seriesId}: ${response.status}`);
  }

  const csvText = await response.text();
  return [seriesId, parseFredCsvSeries(csvText)];
}));

const seriesById = Object.fromEntries(seriesEntries);
const fedRates = buildFederalReserveRates(seriesById).map((rate) => ({
  ...rate,
  id: `market-${rate.rate_type}`,
  last_updated: generatedAt
}));

const dailyRows = buildDailyMarketRates(seriesById).map((rate) => ({
  ...rate,
  created_at: generatedAt
}));

const latestEffectiveDate = dailyRows.reduce((maxDate, row) => {
  return !maxDate || row.effective_date > maxDate ? row.effective_date : maxDate;
}, null);

const payload = {
  generated_at: generatedAt,
  source: 'FRED public CSV data',
  fed_rates: fedRates,
  daily_rates: {
    success: true,
    effective_date: latestEffectiveDate,
    rates: dailyRows
  }
};

await writeFile(
  new URL('../assets/market-rates.json', import.meta.url),
  JSON.stringify(payload, null, 2) + '\n',
  'utf8'
);

console.log(`Updated assets/market-rates.json at ${generatedAt}`);
