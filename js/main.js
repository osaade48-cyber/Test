/* Avera Earthworx — site behaviour (no libraries needed) */
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  /* Always open a new page at the top (unless the link points to a section, e.g. #quote) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function toTop() { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  toTop();
  window.addEventListener('pageshow', toTop);

  /* Header: solid background once the page scrolls */
  var header = document.querySelector('.site-header');
  var mobileBar = document.querySelector('.mobile-bar');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (mobileBar) mobileBar.classList.toggle('is-visible', y > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Reveal sections as they scroll into view */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Contact form: show chosen photo names */
  var file = document.querySelector('#photos');
  if (file) {
    var label = document.querySelector('#photos-label');
    file.addEventListener('change', function () {
      var n = file.files.length;
      label.textContent = n ? n + (n === 1 ? ' photo selected' : ' photos selected') : 'Add site photos';
    });
  }

  /* Pre-select service on contact page from ?service= in the link */
  var params = new URLSearchParams(window.location.search);
  var svc = params.get('service');
  if (svc) {
    var sel = document.querySelector('#service');
    if (sel) {
      Array.prototype.forEach.call(sel.options, function (o) { if (o.value === svc) sel.value = svc; });
    }
  }

  /* Footer year */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
