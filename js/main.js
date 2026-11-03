/* Avera Earthworx — site behaviour (no libraries needed) */
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

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

  /* Home page service explorer */
  var explorer = document.querySelector('[data-explorer]');
  if (explorer) {
    var tabs = explorer.querySelectorAll('.explorer__tab');
    var panel = explorer.querySelector('.explorer__panel');
    var img = panel.querySelector('img');
    var title = panel.querySelector('h3');
    var text = panel.querySelector('p');
    var icon = panel.querySelector('.icon');
    var timer = null;
    var current = 0;

    function show(i, userAction) {
      if (i === current && !userAction) return;
      var tab = tabs[i];
      tabs.forEach(function (t, n) {
        t.setAttribute('aria-selected', n === i ? 'true' : 'false');
        t.tabIndex = n === i ? 0 : -1;
      });
      panel.classList.add('is-changing');
      setTimeout(function () {
        img.src = tab.dataset.img;
        img.alt = tab.dataset.alt || '';
        title.textContent = tab.dataset.title;
        text.textContent = tab.dataset.text;
        icon.innerHTML = tab.querySelector('template').innerHTML;
        panel.classList.remove('is-changing');
      }, 250);
      current = i;
      if (userAction && tab.scrollIntoView && window.innerWidth < 900) {
        tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { stop(); show(i, true); });
      tab.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); stop(); show((i + 1) % tabs.length, true); tabs[(i + 1) % tabs.length].focus(); }
        if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); stop(); show((i - 1 + tabs.length) % tabs.length, true); tabs[(i - 1 + tabs.length) % tabs.length].focus(); }
      });
    });

    /* Preload images so switching is instant */
    tabs.forEach(function (t) { var p = new Image(); p.src = t.dataset.img; });

    /* Gently auto-advance until the visitor interacts */
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && timer === null && !explorer.dataset.stopped) {
            timer = setInterval(function () { show((current + 1) % tabs.length); }, 5000);
          } else if (!e.isIntersecting) { stop(); }
        });
      }, { threshold: 0.4 }).observe(explorer);
      explorer.addEventListener('pointerdown', function () { explorer.dataset.stopped = '1'; stop(); });
    }
  }

  /* Contact form: show chosen photo names */
  var file = document.querySelector('#photos');
  if (file) {
    var label = document.querySelector('#photos-label');
    file.addEventListener('change', function () {
      var n = file.files.length;
      label.textContent = n ? n + (n === 1 ? ' photo selected' : ' photos selected') : 'Add site photos (optional)';
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
