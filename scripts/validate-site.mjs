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
