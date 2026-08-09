const GA_MEASUREMENT_ID = 'G-J1LGSKRY0V';

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag() {
  window.dataLayer.push(arguments);
};

if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
  const googleTag = document.createElement('script');
  googleTag.async = true;
  googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(googleTag);
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
  });
}

function analyticsSession() {
  try {
    let id = sessionStorage.getItem('loaninca_session');
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('loaninca_session', id);
    }
    return id;
  } catch {
    return '';
  }
}

function track(name, detail = {}) {
  const safe = {
    event: name,
    path: location.pathname,
    ...detail,
  };

  window.gtag('event', name, {
    page_path: location.pathname,
  });
  document.dispatchEvent(new CustomEvent(`loaninca:${name}`, { detail: safe }));

  const query = new URLSearchParams(location.search);
  const payload = {
    calculator_type: name,
    input_data: { path: location.pathname },
    result_data: {},
    session_id: analyticsSession(),
    utm_source: query.get('utm_source') || '',
    utm_medium: query.get('utm_medium') || '',
    utm_campaign: query.get('utm_campaign') || '',
  };

  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-btn');
  const navigation = document.querySelector('.nav-links');

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const open = navigation.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => {
      track(element.dataset.track);
    });
  });
});

window.LoanInCA = { track };
