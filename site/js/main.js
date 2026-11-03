// Mobile nav
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
  }));
}

// Header shadow on scroll
const header = document.querySelector('.header');
const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Image slots: <div class="img" data-src="images/x.jpg" data-alt="...">
// Loads the photo if it exists; otherwise the styled green fallback remains.
document.querySelectorAll('.img[data-src]').forEach(el => {
  const img = new Image();
  img.alt = el.dataset.alt || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.onload = () => { el.appendChild(img); el.classList.add('has-photo'); };
  img.src = el.dataset.src;
});

// Reveal on scroll
const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 }) : null;
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

// Project filters
const filters = document.querySelectorAll('.filter');
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
  const cat = btn.dataset.filter;
  document.querySelectorAll('.project').forEach(p => {
    p.classList.toggle('hidden', cat !== 'all' && !p.dataset.cat.split(' ').includes(cat));
  });
}));

// Year
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
