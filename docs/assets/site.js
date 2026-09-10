/* ARCHIVE — bascule FR/EN, mémorisée. */
(function () {
  var html = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('archive-lang'); } catch (e) {}
  var lang = (saved === 'en' || saved === 'fr') ? saved : 'fr';
  function apply(l) {
    lang = l; html.setAttribute('data-lang', l); html.setAttribute('lang', l);
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set') === l ? 'true' : 'false');
    });
    try { localStorage.setItem('archive-lang', l); } catch (e) {}
  }
  apply(lang);
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-set')); });
  });
  /* apparition au scroll */
  var rev = document.querySelectorAll('.reveal');
  if (rev.length && 'IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (el, i) { el.style.transitionDelay = Math.min(i, 4) * 60 + 'ms'; ro.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }
  /* diaporamas automatiques, 2 s par image, sans contrôle, uniquement visibles */
  document.querySelectorAll('[data-slides]').forEach(function (box) {
    var imgs = box.querySelectorAll('img'), lbls = box.querySelectorAll('.lbl'), i = 0, timer = null;
    if (imgs.length < 2) return;
    function step() {
      imgs[i].classList.remove('on'); if (lbls[i]) lbls[i].removeAttribute('data-on');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('on'); if (lbls[i]) lbls[i].setAttribute('data-on', '');
    }
    function start() { if (!timer) timer = setInterval(step, 2000); }
    function stop() { clearInterval(timer); timer = null; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.2 }).observe(box);
    } else start();
  });
  /* vidéos : lecture uniquement quand visibles */
  var vids = document.querySelectorAll('video[data-auto]');
  if (vids.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) e.target.play().catch(function () {}); else e.target.pause(); });
    }, { threshold: 0.3 });
    vids.forEach(function (v) { io.observe(v); });
  }
})();
