const MAX = {
  name: 80,
  phone: 120,
  email: 160,
  inquiryType: 80,
  loanAmount: 80,
  note: 3000,
  sourceUrl: 500,
  utm: 120,
};

export function cleanText(value, maxLength) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function normalizeLead(input = {}) {
  return {
    website: cleanText(input.website, 200),
    name: cleanText(input.name, MAX.name),
    phone: cleanText(input.phone, MAX.phone),
    email: cleanText(input.email, MAX.email).toLowerCase(),
    inquiry_type: cleanText(input.inquiry_type, MAX.inquiryType),
    loan_amount: cleanText(input.loan_amount, MAX.loanAmount),
    note: cleanText(input.note, MAX.note),
    source_url: cleanText(input.source_url, MAX.sourceUrl),
    utm_source: cleanText(input.utm_source, MAX.utm),
    utm_medium: cleanText(input.utm_medium, MAX.utm),
    utm_campaign: cleanText(input.utm_campaign, MAX.utm),
  };
}

export function validateLead(input = {}) {
  const lead = normalizeLead(input);

  if (lead.website) return { ok: true, spam: true, lead };
  if (!lead.name) return { ok: false, error: '请填写姓名。', lead };
  if (!lead.phone && !lead.email) return { ok: false, error: '请填写联系方式。', lead };
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return { ok: false, error: '请填写有效的邮箱地址。', lead };
  }

  return { ok: true, spam: false, lead };
}
