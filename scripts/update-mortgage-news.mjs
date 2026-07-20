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

const thirtyYear = pageText.match(
  /30-year fixed-rate mortgage averaged ([0-9.]+)% as of ([A-Za-z]+ \d{1,2}, \d{4}), (?:up|down) from last week when it averaged ([0-9.]+)%/i,
);
const fifteenYear = pageText.match(/15-year fixed-rate mortgage averaged ([0-9.]+)%/i);

if (!thirtyYear || !fifteenYear) {
  throw new Error("Unable to parse current PMMS rates; Freddie Mac may have changed the page format.");
}

const [, rate30, publishedDate, priorRate30] = thirtyYear;
const [, rate15] = fifteenYear;
const date = new Date(`${publishedDate} 12:00:00 UTC`);

if (Number.isNaN(date.valueOf())) {
  throw new Error(`Unable to parse PMMS publication date: ${publishedDate}`);
}

const isoDate = date.toISOString().slice(0, 10);
const direction = Number(rate30) >= Number(priorRate30) ? "up" : "down";
const directionZh = direction === "up" ? "高于" : "低于";
const primaryPath = NEWS_PATHS[0];
const feed = JSON.parse(await readFile(primaryPath, "utf8"));

const rateItem = {
  source: "Freddie Mac",
  date: isoDate,
  title: `The average 30-year fixed mortgage rate was ${rate30}%`,
  title_zh: `30 年固定房贷全国平均利率为 ${rate30}%`,
  summary: `Freddie Mac's PMMS reported a ${rate30}% average, ${direction} from ${priorRate30}% the week before. The 15-year fixed average was ${rate15}%. These are national averages, not individual quotes.`,
  summary_zh: `Freddie Mac 的 PMMS 显示，30 年固定房贷平均利率为 ${rate30}%，${directionZh}前一周的 ${priorRate30}%；15 年固定房贷平均利率为 ${rate15}%。这是全国平均值，不是个人报价。`,
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

console.log(`Updated mortgage news for ${isoDate}: 30-year ${rate30}%, 15-year ${rate15}%`);
