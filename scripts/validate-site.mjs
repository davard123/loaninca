import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const filesToCheck = [
  'index.html',
  'news.html',
  'calculator.html',
  'about.html',
  'privacy.html',
  'terms.html',
  'disclosures.html',
  'blog/h1b-california-home-loan.html',
  'blog/self-employed-mortgage-los-angeles.html',
  'blog/what-is-dscr-loan.html',
  'blog/los-angeles-down-payment-guide.html',
  'blog/what-is-jumbo-loan-2026.html',
  'blog/alipay-wechat-currency-swap-down-payment.html',
  'blog/bonus-overtime-commission-income-mortgage.html',
  'blog/cash-income-low-tax-returns-mortgage.html',
  'blog/china-50k-quota-multiple-relatives-wire-down-payment.html',
  'blog/credit-score-680-vs-740-mortgage-payment.html',
  'blog/down-payment-borrowed-credit-card-401k.html',
  'blog/fha-loan-i797-no-ead.html',
  'blog/foreign-national-investment-property-loan-california.html',
  'blog/form-3520-parents-gift-over-100k-down-payment.html',
  'blog/gift-funds-from-china-down-payment-documents.html',
  'blog/green-card-pending-i140-i485-mortgage.html',
  'blog/h1b-expiring-extension-pending-mortgage.html',
  'blog/h1b-h4-spouse-mortgage-whose-name-california.html',
  'blog/h1b-under-two-years-mortgage-california.html',
  'blog/how-long-seasoning-down-payment-funds.html',
  'blog/income-from-china-us-mortgage.html',
  'blog/itin-mortgage-california.html',
  'blog/job-change-after-pre-approval-before-closing.html',
  'blog/l1-o1-tn-visa-home-loan-california.html',
  'blog/laid-off-during-escrow-what-to-do.html',
  'blog/new-job-probation-period-mortgage-california.html',
  'blog/new-job-rsu-sign-on-bonus-mortgage-income.html',
  'blog/no-credit-score-buy-home-california.html',
  'blog/opt-income-not-accepted-mortgage.html',
  'blog/parents-non-occupant-co-borrower-no-us-income.html',
  'blog/rsu-income-mortgage-california.html',
  'blog/second-property-primary-second-home-or-investment.html',
  'blog/self-employed-one-year-tax-return-mortgage.html',
  'blog/selling-home-in-china-down-payment-proof.html',
  'blog/w2-plus-1099-side-business-loss-mortgage.html',
  'blog/expired-visa-stamp-i797-mortgage-approval.html',
  'blog/no-income-verification-loan-cost-and-risk.html',
  'blog/foreign-gift-funds-wire-directly-to-escrow.html',
  'blog/sell-stock-rsu-down-payment-capital-gains-tax.html',
  'blog/pledge-stock-margin-loan-down-payment.html',
  'blog/second-home-down-payment-heloc-or-cash-out-refinance.html',
  'blog/buy-new-home-before-selling-old-dti-bridge-loan-heloc.html',
  'blog/bay-area-income-how-much-house-dti.html',
  'blog/bay-area-10-percent-down-jumbo-pmi.html',
  'blog/h1b-no-fha-low-down-payment-options.html',
  'blog/calhfa-down-payment-assistance-h1b-eligible.html',
  'blog/mello-roos-hoa-reduce-loan-amount.html',
  'blog/married-couple-joint-or-one-borrower-mortgage.html',
  'blog/california-one-spouse-loan-both-on-title.html',
  'blog/parent-wants-to-use-my-name-for-mortgage.html',
  'blog/is-my-mortgage-rate-quote-too-high.html',
  'blog/mortgage-rate-shopping-hard-pull-credit-score.html',
  'blog/rate-and-closing-costs-changed-from-loan-estimate.html',
  'blog/bank-relationship-discount-mortgage-worth-it.html',
  'blog/builder-preferred-lender-closing-credit.html',
  'blog/condo-hoa-loan-denied-before-closing.html',
  'blog/loan-delay-cannot-close-on-time-california.html',
  'blog/california-fair-plan-insurance-mortgage-closing.html',
  'blog/choose-auspicious-closing-date-rate-lock.html',
  'blog/escrow-impound-account-payment-keeps-rising.html',
  'blog/california-supplemental-tax-bill-escrow.html',
  'blog/arm-fixed-period-ending-rate-adjustment.html',
  'blog/home-value-underwater-bank-demand-pay-difference.html',
  'blog/rent-out-primary-residence-before-one-year.html',
  'blog/moving-back-to-china-paying-us-mortgage.html',
  'robots.txt',
  'llms.txt',
  'sitemap.xml',
];

const prodHtmlFiles = filesToCheck.filter((file) => file.endsWith('.html'));
const errors = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function normalizeTarget(fromFile, target) {
  if (!target || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('javascript:')) {
    return null;
  }

  if (target.includes('${')) {
    return null;
  }

  if (target.startsWith('http://') || target.startsWith('https://')) {
    return null;
  }

  const [pathname] = target.split('#');
  const [cleanPath] = pathname.split('?');
  if (!cleanPath || cleanPath === '/') {
    return 'index.html';
  }

  const resolved = cleanPath.startsWith('/')
    ? cleanPath.slice(1)
    : path.normalize(path.join(path.dirname(fromFile), cleanPath));

  if (!resolved.includes('.')) {
    if (exists(path.join(resolved, 'index.html'))) return path.join(resolved, 'index.html');
    return `${resolved}.html`;
  }

  return resolved;
}

for (const file of prodHtmlFiles) {
  const content = read(file);

  if (content.includes('ndflending.com')) {
    errors.push(`${file}: still references ndflending.com`);
  }

  if (content.includes('待添加')) {
    errors.push(`${file}: still contains placeholder text`);
  }

  if (content.includes('2454750')) {
    errors.push(`${file}: still contains incorrect NMLS 2454750`);
  }

  const hrefMatches = [...content.matchAll(/\b(?:href|src|action)=["']([^"']+)["']/g)];
  for (const match of hrefMatches) {
    const target = normalizeTarget(file, match[1]);
    if (!target) continue;

    if (target.endsWith('/')) {
      if (!exists(path.join(target, 'index.html'))) {
        errors.push(`${file}: missing directory target ${match[1]}`);
      }
      continue;
    }

    if (!exists(target)) {
      errors.push(`${file}: missing local target ${match[1]}`);
    }
  }
}

const robots = read('robots.txt');
if (!robots.includes('https://www.loaninca.com/sitemap.xml')) {
  errors.push('robots.txt: sitemap does not point to loaninca.com');
}

const sitemap = read('sitemap.xml');
if (sitemap.includes('ndflending.com')) {
  errors.push('sitemap.xml: still references ndflending.com');
}

// GEO knowledge files should point to the same canonical URLs as the sitemap.
// This catches stale redirect paths before they are copied into public llms files.
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>(https:\/\/www\.loaninca\.com\/[^<]+)<\/loc>/g)].map(
    (match) => match[1],
  ),
);
for (const file of ['llms.txt', 'llms-full.txt']) {
  if (!exists(file)) {
    errors.push(`${file}: file is missing`);
    continue;
  }

  const content = read(file);
  for (const match of content.matchAll(/https:\/\/www\.loaninca\.com\/[^\s>]+/g)) {
    const url = match[0].replace(/[.,;:!?)]$/, '');
    if (!sitemapUrls.has(url)) {
      errors.push(`${file}: URL is not listed as a sitemap canonical URL ${url}`);
    }
  }
}

const news = read('news.html');
const newsTitle = news.match(/<title>([^<]+)<\/title>/i)?.[1];
const newsDescription = news.match(/<meta name="description" content="([^"]+)"/i)?.[1];
const newsOgTitle = news.match(/<meta property="og:title" content="([^"]+)"/i)?.[1];
const newsOgDescription = news.match(/<meta property="og:description" content="([^"]+)"/i)?.[1];
if (newsTitle && newsOgTitle && newsTitle !== newsOgTitle) {
  errors.push('news.html: og:title does not match the page title');
}
if (newsDescription && newsOgDescription && newsDescription !== newsOgDescription) {
  errors.push('news.html: og:description does not match the page description');
}

for (const page of ['about', 'privacy', 'terms', 'disclosures']) {
  if (!sitemap.includes(`https://www.loaninca.com/${page}`)) {
    errors.push(`sitemap.xml: missing ${page}`);
  }
}

if (errors.length > 0) {
  console.error('Site validation failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Site validation passed.');
