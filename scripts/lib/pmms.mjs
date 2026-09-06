import { validDate } from '../../assets/news-utils.mjs';
export function parsePmms(html, now = new Date()) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;|\u00a0/g,' ').replace(/\s+/g,' ');
  const match = text.match(/as of (\d{2})\/(\d{2})\/(\d{4})\s*30-year Fixed-Rate Mortgage\s*([0-9.]+)%\s*15-year Fixed-Rate Mortgage\s*([0-9.]+)%/i);
  if (!match) throw new Error('Unable to parse current PMMS summary; keeping existing news');
  const [,mm,dd,yyyy,rate30,rate15] = match;
  const date = `${yyyy}-${mm}-${dd}`;
  if (!validDate(date) || date > now.toISOString().slice(0,10) || now.getTime()-Date.parse(date) > 10*86400000) throw new Error('PMMS publication date is invalid, future or stale');
  for (const rate of [rate30,rate15]) if (!(Number(rate)>0 && Number(rate)<30)) throw new Error('PMMS rate out of range');
  const prior = text.match(/30-year fixed-rate mortgage averaged [0-9.]+%[\s\S]{0,160}?when it averaged ([0-9.]+)%/i)?.[1];
  const comparisonZh = !prior ? '' : Number(rate30)===Number(prior) ? `，与前一周的 ${prior}% 持平` : `，${Number(rate30)>Number(prior)?'高于':'低于'}前一周的 ${prior}%`;
  const comparisonEn = !prior ? '' : Number(rate30)===Number(prior) ? `, unchanged from ${prior}% the week before` : `, ${Number(rate30)>Number(prior)?'up':'down'} from ${prior}% the week before`;
  return {source:'Freddie Mac', date, title:`The average 30-year fixed mortgage rate was ${rate30}%`, title_zh:`30 年固定房贷全国平均利率为 ${rate30}%`, summary:`Freddie Mac's PMMS reported a ${rate30}% average${comparisonEn}. The 15-year fixed average was ${rate15}%. These are national averages, not individual quotes.`, summary_zh:`Freddie Mac 的 PMMS 显示，30 年固定房贷平均利率为 ${rate30}%${comparisonZh}；15 年固定房贷平均利率为 ${rate15}%。这是全国平均值，不是个人报价。`, url:'https://www.freddiemac.com/pmms'};
}
export function mergePmms(feed, item, now = new Date()) {
  const old = feed.items.find(x=>x.source==='Freddie Mac');
  if (old && old.date > item.date) throw new Error('Refusing to replace a newer PMMS release');
  const items = [item, ...feed.items.filter(x=>x.source!=='Freddie Mac')].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
  if (JSON.stringify(items) === JSON.stringify(feed.items)) return feed;
  return {...feed, generated_at:now.toISOString(), items};
}
