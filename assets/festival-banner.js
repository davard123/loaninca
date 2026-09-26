/*
 * 节日祝福横幅（loaninca / rentalinca 共用，两站各放一份同样的文件）
 * 按访客本地日期，在节日前 2 天至节日后 2 天显示在页面最上方。
 * 多个节日同时在显示期内：当天正是某个节日的优先；否则日期最晚的新节日顶掉旧节日。
 * 可关闭，关闭后这个节日不再出现。
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

  // 日期由 lunar-javascript 计算（2026–2035）；春节为除夕前 2 天至正月初七
  var FESTIVALS = [
    { key: 'spring', text: '新春快乐，祝您阖家安康、万事顺意', image: 'spring-2026-1200.webp', before: 3, after: 6,
      dates: ['2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03', '2031-01-23', '2032-02-11', '2033-01-31', '2034-02-19', '2035-02-08'] },
    { key: 'lantern', text: '元宵快乐，祝您团团圆圆、前程光明', image: 'lantern-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-03-03', '2027-02-20', '2028-02-09', '2029-02-27', '2030-02-17', '2031-02-06', '2032-02-25', '2033-02-14', '2034-03-05', '2035-02-22'] },
    { key: 'duanwu', text: '端午安康，祝您和家人平安健康', image: 'duanwu-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-06-19', '2027-06-09', '2028-05-28', '2029-06-16', '2030-06-05', '2031-06-24', '2032-06-12', '2033-06-01', '2034-06-20', '2035-06-10'] },
    { key: 'mid-autumn', text: '中秋快乐，愿您阖家团圆', image: 'mid-autumn-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12', '2031-10-01', '2032-09-19', '2033-09-08', '2034-09-27', '2035-09-16'] },
    { key: 'newyear', text: '新年快乐，祝您新的一年心想事成', image: 'newyear-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-01-01', '2027-01-01', '2028-01-01', '2029-01-01', '2030-01-01', '2031-01-01', '2032-01-01', '2033-01-01', '2034-01-01', '2035-01-01'] },
    { key: 'mothers', text: '母亲节快乐，祝天下妈妈健康平安', image: 'mothers-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-05-10', '2027-05-09', '2028-05-14', '2029-05-13', '2030-05-12', '2031-05-11', '2032-05-09', '2033-05-08', '2034-05-14', '2035-05-13'] },
    { key: 'fathers', text: '父亲节快乐，祝天下爸爸身体健康', image: 'fathers-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-06-21', '2027-06-20', '2028-06-18', '2029-06-17', '2030-06-16', '2031-06-15', '2032-06-20', '2033-06-19', '2034-06-18', '2035-06-17'] },
    { key: 'july4', text: 'Happy 4th of July，祝您假期愉快', image: 'july4-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-07-04', '2027-07-04', '2028-07-04', '2029-07-04', '2030-07-04', '2031-07-04', '2032-07-04', '2033-07-04', '2034-07-04', '2035-07-04'] },
    { key: 'thanksgiving', text: '感恩节快乐，谢谢您一路以来的信任', image: 'thanksgiving-2026-1200.webp', before: 2, after: 2,
      dates: ['2026-11-26', '2027-11-25', '2028-11-23', '2029-11-22', '2030-11-28', '2031-11-27', '2032-11-25', '2033-11-24', '2034-11-23', '2035-11-22'] },
  ];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function shift(s, days) {
    var p = s.split('-');
    return ymd(new Date(+p[0], +p[1] - 1, +p[2] + days));
  }

  var preview = (location.search.match(/[?&]festival-date=(\d{4}-\d{2}-\d{2})/) || [])[1];
  var today = preview || ymd(new Date());

  // 当天正是某个节日的优先；否则取日期最晚的（新节日一进入显示期就替换旧节日）
  var active = null;
  for (var i = 0; i < FESTIVALS.length; i++) {
    var f = FESTIVALS[i];
    for (var j = 0; j < f.dates.length; j++) {
      var date = f.dates[j];
      if (shift(date, -f.before) > today || today > shift(date, f.after)) continue;
      var better = !active || date === today || (active.date !== today && date > active.date);
      if (better) active = { f: f, date: date };
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
