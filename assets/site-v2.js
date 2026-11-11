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

// 记住这位访客这次是从哪一页进站的、从哪个网站来的（只留域名）。
// 只放在浏览器的 sessionStorage 里，关掉标签页就没了；不写 cookie，不记完整来源网址。
// 用途：咨询或点电话时，能知道是哪篇文章把人带进来的。任何出错都返回空对象，不影响页面。
function firstTouch() {
  try {
    const saved = sessionStorage.getItem('loaninca_first');
    if (saved) return JSON.parse(saved) || {};

    let refHost = '';
    let refPath = '';
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.host === location.host) refPath = ref.pathname;
        else refHost = ref.hostname;
      }
    } catch {}

    const first = {
      // 有些老页面没有加载这个脚本：如果上一页也是本站的，就把上一页当作进站页（标记为推断）。
      landing: (refPath || location.pathname).slice(0, 200),
      landing_inferred: refPath ? 1 : 0,
      ref_host: refHost.slice(0, 100),
      utm_source: (new URLSearchParams(location.search).get('utm_source') || '').slice(0, 80),
    };
    sessionStorage.setItem('loaninca_first', JSON.stringify(first));
    return first;
  } catch {
    return {};
  }
}

firstTouch();

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
  const first = firstTouch();
  const payload = {
    calculator_type: name,
    input_data: {
      path: location.pathname,
      landing: first.landing || '',
      landing_inferred: first.landing_inferred ? 1 : 0,
      ref_host: first.ref_host || '',
      first_utm_source: first.utm_source || '',
    },
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
