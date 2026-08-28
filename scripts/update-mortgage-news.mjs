import { readFile, writeFile } from "node:fs/promises";

const NEWS_PATHS = [
  "assets/mortgage-news.json",
  "ios/LoanInCACalculator/LoanInCACalculator/mortgage-news.json",
];
const PMMS_URL = "https://www.freddiemac.com/pmms";

const response = await fetch(PMMS_URL, {
  headers: { "user-agent": "LoanInCA news updater (https://www.loaninca.com)" },
});

if (!response.ok) {
  throw new Error(`Freddie Mac PMMS returned HTTP ${response.status}`);
}

const pageText = (await response.text())
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");

// Primary source: the page's own summary widget ("U.S. weekly mortgage rate
// averages as of MM/DD/YYYY  30-year Fixed-Rate Mortgage X%  15-year
// Fixed-Rate Mortgage Y%"). This is much more stable than the prose
// paragraph below it, whose wording Freddie Mac changes week to week
// (e.g. "up", "slightly up", "sharply up", "little changed").
const summary = pageText.match(
  /as of (\d{2})\/(\d{2})\/(\d{4})\s*30-year Fixed-Rate Mortgage\s*([0-9.]+)%\s*15-year Fixed-Rate Mortgage\s*([0-9.]+)%/i,
);

if (!summary) {
  throw new Error("Unable to parse current PMMS rates; Freddie Mac may have changed the page format.");
}

const [, mm, dd, yyyy, rate30, rate15] = summary;
const isoDate = `${yyyy}-${mm}-${dd}`;

if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) {
  throw new Error(`Unable to parse PMMS publication date: ${mm}/${dd}/${yyyy}`);
}

// Secondary, best-effort: last week's 30-year rate, for the week-over-week
// comparison. This comes from the prose paragraph, so it's less stable —
// if Freddie Mac rewords it beyond recognition, we still succeed with just
// this week's rates and drop the comparison rather than failing the run.
const priorMatch = pageText.match(
  /30-year fixed-rate mortgage averaged [0-9.]+%[\s\S]{0,160}?when it averaged ([0-9.]+)%/i,
);
const priorRate30 = priorMatch ? priorMatch[1] : null;

// Direction is derived by comparing the two numbers ourselves rather than
// matching Freddie Mac's chosen adjective ("up" / "slightly up" / "little
// changed" / ...), which is the part of the page that actually changed and
// broke the previous version of this script.
const direction = priorRate30 === null
  ? null
  : Number(rate30) >= Number(priorRate30) ? "up" : "down";
const directionZh = direction === "up" ? "高于" : "低于";

const comparisonEn = priorRate30
  ? `, ${direction} from ${priorRate30}% the week before`
  : "";
const comparisonZh = priorRate30
  ? `，${directionZh}前一周的 ${priorRate30}%`
  : "";

const primaryPath = NEWS_PATHS[0];
const feed = JSON.parse(await readFile(primaryPath, "utf8"));

const rateItem = {
  source: "Freddie Mac",
  date: isoDate,
  title: `The average 30-year fixed mortgage rate was ${rate30}%`,
  title_zh: `30 年固定房贷全国平均利率为 ${rate30}%`,
  summary: `Freddie Mac's PMMS reported a ${rate30}% average${comparisonEn}. The 15-year fixed average was ${rate15}%. These are national averages, not individual quotes.`,
  summary_zh: `Freddie Mac 的 PMMS 显示，30 年固定房贷平均利率为 ${rate30}%${comparisonZh}；15 年固定房贷平均利率为 ${rate15}%。这是全国平均值，不是个人报价。`,
  url: PMMS_URL,
};

feed.generated_at = new Date().toISOString();
feed.notes = "Mortgage and housing updates from primary public sources.";
feed.items = [
  rateItem,
  ...feed.items.filter((item) => item.source !== "Freddie Mac"),
]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 8);

const output = `${JSON.stringify(feed, null, 2)}\n`;
for (const path of NEWS_PATHS) {
  await writeFile(path, output, "utf8");
}

console.log(`Updated mortgage news for ${isoDate}: 30-year ${rate30}%, 15-year ${rate15}%${priorRate30 ? ` (prior 30-year: ${priorRate30}%)` : " (no prior-week comparison found)"}`);
