/*
 * 节日祝福横幅（loaninca / rentalinca 共用，两站各放一份同样的文件）
 * 按访客本地日期，在节日前 2 天至节日当天显示在页面最上方；可关闭，关闭后当年不再出现。
 * 用法：<script src="/festival-banner.js" data-qr="/assets/wechat-qr.jpg"
 *         data-sign="房产校长 David" data-art="/assets/festivals/" defer></script>
 * 预览其他日期：网址后加 ?festival-date=2026-09-25
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var QR = script.getAttribute('data-qr') || '';
  var SIGN = script.getAttribute('data-sign') || 'David';
  var ART = script.getAttribute('data-art') || '/';

  // 农历节日日期由 lunar-javascript 计算（2026–2035）
  var FESTIVALS = [
    {
      key: 'mid-autumn',
      text: '中秋快乐，愿您阖家团圆',
      image: 'mid-autumn-2026-1200.webp',
      dates: ['2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12',
        '2031-10-01', '2032-09-19', '2033-09-08', '2034-09-27', '2035-09-16'],
    },
  ];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function shift(s, days) {
    var p = s.split('-');
    return ymd(new Date(+p[0], +p[1] - 1, +p[2] + days));
  }

  var preview = (location.search.match(/[?&]festival-date=(\d{4}-\d{2}-\d{2})/) || [])[1];
  var today = preview || ymd(new Date());

  var active = null;
  for (var i = 0; i < FESTIVALS.length && !active; i++) {
    for (var j = 0; j < FESTIVALS[i].dates.length; j++) {
      var date = FESTIVALS[i].dates[j];
      if (shift(date, -2) <= today && today <= date) { active = { f: FESTIVALS[i], date: date }; break; }
    }
  }
  if (!active) return;

  var dismissKey = 'festival-banner-closed:' + active.f.key + ':' + active.date;
  try { if (!preview && localStorage.getItem(dismissKey)) return; } catch (e) {}

  var css = '' +
    '.fb-bar{position:relative;overflow:hidden;background:#1b1a3d;color:#fbeecb;font-family:inherit}' +
    '.fb-bar img.fb-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:20% 24%;animation:fb-drift 24s ease-in-out infinite alternate}' +
    '.fb-bar .fb-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,18,52,.15) 0,rgba(20,18,52,.55) 30%,rgba(20,18,52,.85) 100%)}' +
    '.fb-inner{position:relative;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;min-height:64px;padding:12px 56px 12px 28%;animation:fb-in .8s ease both}' +
    '.fb-text{margin:0;font-size:1rem;font-weight:700;letter-spacing:.04em;line-height:1.5;text-shadow:0 1px 8px rgba(0,0,0,.35)}' +
    '.fb-sign{font-weight:500;opacity:.85;margin-left:6px}' +
    '.fb-wechat{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:6px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#e0b76e,#f0d091);color:#2a1c0c;font:inherit;font-size:.9rem;font-weight:800;cursor:pointer}' +
    '.fb-close{position:absolute;top:50%;right:12px;transform:translateY(-50%);width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fbeecb;font-size:18px;line-height:1;cursor:pointer}' +
    '.fb-wechat:focus-visible,.fb-close:focus-visible{outline:3px solid rgba(242,200,121,.8);outline-offset:2px}' +
    '.fb-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,8,24,.6)}' +
    '.fb-card{position:relative;width:min(320px,100%);padding:24px 20px 20px;border-radius:18px;background:#fffaf0;color:#2a1c0c;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35)}' +
    '.fb-card img{display:block;width:220px;max-width:100%;height:auto;margin:10px auto;border-radius:10px}' +
    '.fb-card h2{margin:0;font-size:1.15rem}' +
    '.fb-card p{margin:6px 0 0;font-size:.9rem;color:#5b4a40;line-height:1.6}' +
    '.fb-card .fb-close{top:10px;right:10px;transform:none;background:rgba(0,0,0,.06);color:#2a1c0c}' +
    '@keyframes fb-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}' +
    '@keyframes fb-drift{from{transform:scale(1.02)}to{transform:scale(1.1) translateX(-2%)}}' +
    '@media(max-width:700px){.fb-inner{justify-content:flex-start;min-height:0;padding:10px 50px 10px 30%;gap:6px 10px}.fb-text{font-size:.9rem}.fb-sign{display:block;margin-left:0;font-size:.82rem}.fb-wechat{min-height:34px;padding:4px 12px;font-size:.84rem}.fb-bar img.fb-art{object-position:12% 24%}}' +
    '@media(prefers-reduced-motion:reduce){.fb-bar img.fb-art,.fb-inner{animation:none}}';

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (text) node.textContent = text;
    return node;
  }

  function openQr(trigger) {
    var modal = el('div', { class: 'fb-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': '微信联系 David' });
    var card = el('div', { class: 'fb-card' });
    var close = el('button', { type: 'button', class: 'fb-close', 'aria-label': '关闭' }, '×');
    card.appendChild(close);
    card.appendChild(el('h2', {}, '微信联系 David'));
    if (QR) card.appendChild(el('img', { src: QR, alt: 'David 的微信二维码', width: '220', height: '220' }));
    card.appendChild(el('p', {}, '用微信扫一扫，或在微信里长按图片识别二维码。'));
    modal.appendChild(card);
    function shut() {
      modal.remove();
      document.removeEventListener('keydown', onKey);
      trigger.focus();
    }
    function onKey(e) { if (e.key === 'Escape') shut(); }
    close.addEventListener('click', shut);
    modal.addEventListener('click', function (e) { if (e.target === modal) shut(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(modal);
    close.focus();
  }

  function mount() {
    var style = el('style', {});
    style.textContent = css;
    document.head.appendChild(style);

    var bar = el('aside', { class: 'fb-bar', 'aria-label': '节日祝福' });
    bar.appendChild(el('img', { class: 'fb-art', src: ART + active.f.image, alt: '', decoding: 'async' }));
    bar.appendChild(el('div', { class: 'fb-shade', 'aria-hidden': 'true' }));

    var inner = el('div', { class: 'fb-inner' });
    var text = el('p', { class: 'fb-text' }, active.f.text);
    text.appendChild(el('span', { class: 'fb-sign' }, '—— ' + SIGN));
    inner.appendChild(text);

    var wechat = el('button', { type: 'button', class: 'fb-wechat', 'data-track': 'festival_wechat_clicked' }, '微信联系我');
    wechat.addEventListener('click', function () { openQr(wechat); });
    inner.appendChild(wechat);
    bar.appendChild(inner);

    var close = el('button', { type: 'button', class: 'fb-close', 'aria-label': '关闭节日祝福' }, '×');
    close.addEventListener('click', function () {
      try { localStorage.setItem(dismissKey, '1'); } catch (e) {}
      bar.remove();
    });
    bar.appendChild(close);

    var skip = document.querySelector('body > .skip');
    document.body.insertBefore(bar, skip ? skip.nextSibling : document.body.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
