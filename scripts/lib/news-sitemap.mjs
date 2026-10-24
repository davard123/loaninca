const NEWS_ENTRY = /(<url>\s*<loc>https:\/\/www\.loaninca\.com\/news<\/loc>\s*<lastmod>)[^<]*(<\/lastmod>)/i;

function generatedAtDate(value) {
  if (typeof value !== 'string' || !/[Tt]\d{2}:\d{2}/.test(value)) {
    throw new Error('News feed generated_at must be an ISO timestamp');
  }

  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) {
    throw new Error('News feed generated_at is invalid');
  }

  return timestamp.toISOString().slice(0, 10);
}

/**
 * Return the date the rendered news feed last changed, not an article source date.
 * mergePmms preserves generated_at when the feed content is unchanged.
 */
export function newsPageLastmod(feed) {
  return generatedAtDate(feed?.generated_at);
}

export function updateNewsSitemapLastmod(sitemap, feed) {
  if (typeof sitemap !== 'string') throw new Error('Sitemap content must be text');

  const lastmod = newsPageLastmod(feed);
  if (!NEWS_ENTRY.test(sitemap)) {
    throw new Error('Sitemap is missing the /news entry');
  }

  const content = sitemap.replace(NEWS_ENTRY, `$1${lastmod}$2`);
  return { content, lastmod, changed: content !== sitemap };
}
