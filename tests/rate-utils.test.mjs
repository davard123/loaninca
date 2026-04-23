import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDailyMarketRates,
  buildFederalReserveRates,
  parseFredCsvSeries
} from '../functions/api/rate-utils.mjs';

test('parseFredCsvSeries returns latest and previous numeric values', () => {
  const csv = `DATE,VALUE
2026-04-02,6.46
2026-04-09,.
2026-04-16,6.30
`;

  const parsed = parseFredCsvSeries(csv);

  assert.equal(parsed.latest.date, '2026-04-16');
  assert.equal(parsed.latest.value, 6.3);
  assert.equal(parsed.previous.date, '2026-04-02');
  assert.equal(parsed.previous.value, 6.46);
});

test('buildFederalReserveRates creates rate cards from official public series', () => {
  const series = {
    FEDFUNDS: {
      latest: { date: '2026-03-01', value: 3.64 },
      previous: { date: '2026-02-01', value: 3.86 }
    },
    MORTGAGE30US: {
      latest: { date: '2026-04-16', value: 6.3 },
      previous: { date: '2026-04-09', value: 6.37 }
    },
    MORTGAGE15US: {
      latest: { date: '2026-04-16', value: 5.65 },
      previous: { date: '2026-04-09', value: 5.74 }
    },
    DGS10: {
      latest: { date: '2026-04-20', value: 4.26 },
      previous: { date: '2026-04-17', value: 4.33 }
    }
  };

  const rates = buildFederalReserveRates(series);

  assert.equal(rates.length, 4);
  assert.deepEqual(
    rates.map((rate) => rate.rate_type),
    ['fed_funds_rate', 'mortgage_30yr_fixed', 'mortgage_15yr_fixed', 'treasury_10yr']
  );
  assert.equal(rates[1].effective_date, '2026-04-16');
  assert.equal(rates[1].change, -0.07);
});

test('buildDailyMarketRates returns display rows with the newest available date', () => {
  const series = {
    FEDFUNDS: {
      latest: { date: '2026-03-01', value: 3.64 },
      previous: { date: '2026-02-01', value: 3.86 }
    },
    MORTGAGE30US: {
      latest: { date: '2026-04-16', value: 6.3 },
      previous: { date: '2026-04-09', value: 6.37 }
    },
    MORTGAGE15US: {
      latest: { date: '2026-04-16', value: 5.65 },
      previous: { date: '2026-04-09', value: 5.74 }
    },
    DGS10: {
      latest: { date: '2026-04-20', value: 4.26 },
      previous: { date: '2026-04-17', value: 4.33 }
    }
  };

  const dailyRates = buildDailyMarketRates(series);

  assert.equal(dailyRates.length, 4);
  assert.equal(dailyRates[0].rate_name_cn, '30 年固定利率');
  assert.equal(dailyRates[3].effective_date, '2026-04-20');
});
