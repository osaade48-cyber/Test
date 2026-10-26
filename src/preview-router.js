/* Preview only: shows one bundled page at a time instead of navigating between files. */
(function () {
  var pages = Array.prototype.slice.call(document.querySelectorAll('.tb-page'));
  var cta = document.getElementById('tb-cta');

  function show(slug, anchor, query) {
    if (document.startViewTransition && pages.some(function (p) { return !p.hidden; })) {
      var ok = pages.some(function (p) { return p.dataset.slug === slug; });
      if (ok) document.startViewTransition(function () { swap(slug, anchor, query); });
      return ok;
    }
    return swap(slug, anchor, query);
  }

  function swap(slug, anchor, query) {
    var page = pages.filter(function (p) { return p.dataset.slug === slug; })[0];
    if (!page) return false;
    pages.forEach(function (p) { p.hidden = p !== page; });
    cta.hidden = page.dataset.cta === 'no';
    document.title = page.dataset.title;
    document.body.className = 'page-' + slug;
    var SERVICES = ['services', 'websites', 'branding', 'seo', 'meta-ads', 'google-ads', 'ai-job-finder', 'ai-receptionist', 'ai-lead-caller', 'ai-chatbot', 'crm'];
    var navSlug = SERVICES.indexOf(slug) > -1 ? 'services' : slug;
    document.querySelectorAll('#site-nav > a, #site-nav .nav__droplink').forEach(function (a) {
      if ((a.getAttribute('href') || '').replace('.html', '') === navSlug) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    var plan = query && new URLSearchParams(query).get('plan');
    document.querySelectorAll('#book-form [name="plan"]').forEach(function (r) { if (plan && r.value === plan) r.checked = true; });
    if (slug === 'thanks' && window.TB_fillThanks) window.TB_fillThanks();
    if (slug === 'book' && window.TB_fillCarry) window.TB_fillCarry();
    var target = anchor && document.getElementById(anchor);
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.TB_relayout) window.TB_relayout();
    window.dispatchEvent(new Event('scroll'));
    return true;
  }

  function parse(href) {
    var m = /^([\w-]+)\.html(\?[^#]*)?(?:#([\w-]+))?$/.exec(href || '');
    return m && { slug: m[1], query: m[2] || '', anchor: m[3] };
  }

  window.TB_go = function (href) {
    var r = parse(href);
    if (r) show(r.slug, r.anchor, r.query);
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var r = parse(a.getAttribute('href'));
    if (r && show(r.slug, r.anchor, r.query)) e.preventDefault();
  });

  var start = (location.hash || '').slice(1);
  if (!show(start) ) show('index');
})();
