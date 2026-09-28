// 点击封面才加载 YouTube 播放器，页面本身不载入任何 YouTube 脚本
document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('.yt-play[data-id]');
  if (!btn || btn.classList.contains('playing')) return;
  e.preventDefault();
  var f = document.createElement('iframe');
  f.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.id + '?autoplay=1&rel=0';
  f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
  f.allowFullscreen = true;
  f.title = btn.getAttribute('aria-label') || 'YouTube 视频';
  btn.classList.add('playing');
  btn.appendChild(f);
});
document.addEventListener('keydown', function (e) {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.yt-play[data-id]')) { e.preventDefault(); e.target.click(); }
});
