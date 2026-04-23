const FRED_SERIES_CONFIG = [
  {
    id: 'FEDFUNDS',
    rateType: 'fed_funds_rate',
    label: 'Federal Funds Effective Rate',
    sourceUrl: 'https://fred.stlouisfed.org/series/FEDFUNDS',
    notes: 'Federal Funds Effective Rate'
  },
  {
    id: 'MORTGAGE30US',
    rateType: 'mortgage_30yr_fixed',
    label: '30-Year Fixed Rate Mortgage Average',
    sourceUrl: 'https://fred.stlouisfed.org/series/MORTGAGE30US',
    notes: '30-Year Fixed Rate Mortgage Average'
  },
  {
    id: 'MORTGAGE15US',
    rateType: 'mortgage_15yr_fixed',
    label: '15-Year Fixed Rate Mortgage Average',
    sourceUrl: 'https://fred.stlouisfed.org/series/MORTGAGE15US',
    notes: '15-Year Fixed Rate Mortgage Average'
  },
  {
    id: 'DGS10',
    rateType: 'treasury_10yr',
    label: '10-Year Treasury Constant Maturity Rate',
    sourceUrl: 'https://fred.stlouisfed.org/series/DGS10',
    notes: '10-Year Treasury Constant Maturity Rate'
  }
];

export function parseFredCsvSeries(csvText) {
  const rows = csvText
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [date, value] = line.split(',');
      const numericValue = Number.parseFloat(value);

      return {
        date,
        value: numericValue
      };
    })
    .filter((row) => row.date && Number.isFinite(row.value));

  if (rows.length === 0) {
    throw new Error('No numeric rows found in FRED CSV response');
  }

  return {
    latest: rows.at(-1),
    previous: rows.length > 1 ? rows.at(-2) : rows.at(-1)
  };
}

export function buildFederalReserveRates(seriesById) {
  return FRED_SERIES_CONFIG.map((config) => {
    const series = seriesById[config.id];
    if (!series?.latest) {
      throw new Error(`Missing latest value for ${config.id}`);
    }

    const latestValue = roundRate(series.latest.value);
    const previousValue = roundRate((series.previous || series.latest).value);
    const change = roundRate(latestValue - previousValue);
    const changePercent = previousValue === 0
      ? 0
      : roundRate((change / previousValue) * 100);

    return {
      rate_type: config.rateType,
      rate_value: latestValue,
      previous_value: previousValue,
      change,
      change_percent: changePercent,
      effective_date: series.latest.date,
      source_url: config.sourceUrl,
      notes: config.notes
    };
  });
}

export function buildDailyMarketRates(seriesById) {
  return [
    buildDailyRateRow('daily-market-30yr', '30 Year Fixed', '30 年固定利率', seriesById.MORTGAGE30US, 1, 'market'),
    buildDailyRateRow('daily-market-15yr', '15 Year Fixed', '15 年固定利率', seriesById.MORTGAGE15US, 2, 'market'),
    buildDailyRateRow('daily-market-fedfunds', 'Fed Funds Rate', '联邦基金利率', seriesById.FEDFUNDS, 3, 'benchmark'),
    buildDailyRateRow('daily-market-10yr', '10 Year Treasury', '10 年国债收益率', seriesById.DGS10, 4, 'benchmark')
  ];
}

function buildDailyRateRow(id, rateName, rateNameCn, series, displayOrder, category) {
  if (!series?.latest) {
    throw new Error(`Missing latest value for daily rate row: ${rateName}`);
  }

  const value = roundRate(series.latest.value);

  return {
    id,
    rate_name: rateName,
    rate_name_cn: rateNameCn,
    rate_value: value,
    apr: category === 'market' ? value : null,
    category,
    display_order: displayOrder,
    effective_date: series.latest.date
  };
}

function roundRate(value) {
  return Math.round(value * 100) / 100;
}
