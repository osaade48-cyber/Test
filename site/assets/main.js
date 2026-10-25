/* TradeBooked — site behaviour. No libraries. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var aud = function (v) { return '$' + Math.round(v).toLocaleString('en-AU'); };
  var store = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------- Header, menu, thumb bar ---------- */
  var header = $('.site-header');
  var thumb = $('.thumb-bar');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (thumb) thumb.classList.toggle('is-visible', y > 240 || !document.body.classList.contains('page-index'));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Sample calls ---------- */
  var SCRIPTS = {
    hero: {
      outbound: true,
      caller: 'Jess · Facebook lead',
      business: 'Avera Earthworx',
      turns: [
        ['ai', "Hi, is that Jess? It's Avera Earthworx. You just asked about a pool dig on Facebook."],
        ['caller', "Oh yes! That was quick."],
        ['ai', "We like to be. Roughly how big's the pool, and can a 5-tonne digger get down the side?"],
        ['caller', "About 8 by 4 metres. Side access is around 3 metres."],
        ['ai', "Perfect. I can get someone out to quote Thursday at 7:30am. Does that suit?"],
        ['caller', "Thursday works, thanks."]
      ],
      booked: ['Quote booked', 'Thu 7:30am · Kellyville · Confirmation sent'],
      sms: ['New quote booked', 'Jess, Kellyville. Pool dig 8×4m, 3m side access. Thu 7:30am. From your Facebook ad.']
    },
    emergency: {
      caller: '0433 ••• 902',
      business: 'Harbour Plumbing',
      turns: [
        ['ai', "Harbour Plumbing, you've got the after-hours line. What's going on?"],
        ['caller', "A pipe's burst under the kitchen sink, there's water everywhere!"],
        ['ai', "Okay, first turn off the water at the meter, usually out the front near the footpath. Can you do that now?"],
        ['caller', "Yep, done. It's stopped."],
        ['ai', "Good stuff. I'm flagging this as urgent and texting the plumber now. What's your address?"],
        ['caller', "14 Grove Street, Marrickville."]
      ],
      booked: ['Urgent job flagged', 'Plumber texted · Marrickville · 9:04pm'],
      sms: ['URGENT: burst pipe', 'Marrickville, 14 Grove St. Water off at meter. Customer waiting on a call back.']
    },
    quote: {
      caller: '0401 ••• 557',
      business: 'Northside Landscapes',
      turns: [
        ['ai', "Northside Landscapes, how can I help?"],
        ['caller', "Hi, we're after new turf and garden beds for the backyard."],
        ['ai', "Lovely. Roughly how big is the yard, and is there side access for a bobcat?"],
        ['caller', "About 120 square metres. Side gate's a bit narrow."],
        ['ai', "No dramas. I'll book a free measure and quote. Is Monday morning or Wednesday arvo better?"],
        ['caller', "Wednesday arvo works."]
      ],
      booked: ['Measure & quote booked', 'Wed 2:30pm · Turf + garden beds'],
      sms: ['New quote booked', 'Priya, Hornsby. ~120m² turf + beds, narrow side gate. Measure Wed 2:30pm.']
    },
    existing: {
      caller: 'Mark Jensen',
      business: 'Spark Bros Electrical',
      turns: [
        ['ai', "Spark Bros Electrical, hi Mark. How can I help today?"],
        ['caller', "Hey, the guys are booked Friday but I need to push it back a week."],
        ['ai', "No problem. I can move you to next Friday, same time, 8am. Want me to lock that in?"],
        ['caller', "Yes please."],
        ['ai', "Done. You'll get a text confirmation in a sec. Anything else?"],
        ['caller', "That's it, cheers."]
      ],
      booked: ['Job rescheduled', 'Moved to next Fri 8am · Confirmation sent'],
      sms: ['Job moved', 'Mark Jensen moved Friday 8am to next Friday 8am. Calendar updated.']
    }
  };

  function CallPlayer(phone) {
    this.phone = phone;
    this.who = $('.call-head__who', phone);
    this.status = $('.call-head__status', phone);
    this.log = $('.call-log', phone);
    this.sms = $('.sms-drop', phone);
    this.run = 0;
  }
  CallPlayer.prototype.reset = function (s) {
    this.log.innerHTML = '';
    this.sms.classList.remove('is-in');
    this.who.textContent = s.caller;
  };
  CallPlayer.prototype.bubble = function (who, text, s) {
    var b = document.createElement('div');
    b.className = 'bubble bubble--' + (who === 'ai' ? 'ai' : 'caller');
    var label = document.createElement('span');
    label.className = 'bubble__who';
    label.textContent = who === 'ai' ? 'AI receptionist' : 'Customer';
    var body = document.createElement('span');
    b.appendChild(label);
    b.appendChild(body);
    this.log.appendChild(b);
    while (this.log.children.length > 7) this.log.removeChild(this.log.firstChild);
    return body;
  };
  CallPlayer.prototype.card = function (s) {
    var c = document.createElement('div');
    c.className = 'booked-card';
    c.innerHTML = '<span class="booked-card__tick"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><b></b><span></span></div>';
    c.querySelector('b').textContent = s.booked[0];
    c.querySelector('div span').textContent = s.booked[1];
    this.log.appendChild(c);
  };
  CallPlayer.prototype.fillSms = function (s) {
    this.sms.innerHTML = '<div class="sms-drop__from">TradeBooked <span>now</span></div><b></b> <span class="sms-drop__body"></span>';
    this.sms.querySelector('b').textContent = s.sms[0] + ':';
    this.sms.querySelector('.sms-drop__body').textContent = s.sms[1];
  };
  CallPlayer.prototype.showAll = function (s) {
    var self = this;
    this.reset(s);
    s.turns.forEach(function (t) { self.bubble(t[0], t[1], s).textContent = t[1]; });
    this.card(s);
    this.fillSms(s);
    this.sms.classList.add('is-in');
    this.status.innerHTML = '<span class="live">● ' + (s.outbound ? 'AI called' : 'Answered by AI') + '</span> · call ended';
  };
  CallPlayer.prototype.play = function (s, loop) {
    var self = this;
    var id = ++this.run;
    var alive = function () { return id === self.run; };
    if (reduceMotion) { this.showAll(s); return; }
    var secs = 0, timer = null;
    function tickTimer() {
      secs++;
      var m = Math.floor(secs / 60), r = secs % 60;
      self.status.innerHTML = '<span class="live">● ' + (s.outbound ? 'AI on the call' : 'Answered by AI') + '</span> · ' + (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
    }
    function stopTimer() { if (timer) clearInterval(timer); timer = null; }

    (async function () {
      self.reset(s);
      self.phone.classList.add('is-ringing');
      for (var ring = 1; ring <= 3; ring++) {
        if (!alive()) return;
        self.status.innerHTML = '<span class="ringing">' + (s.outbound ? 'AI calling · ring ' : 'Incoming call · ring ') + ring + '</span>';
        await wait(750);
      }
      self.phone.classList.remove('is-ringing');
      if (!alive()) return;
      tickTimer();
      timer = setInterval(function () { if (alive()) tickTimer(); else stopTimer(); }, 1000);
      for (var i = 0; i < s.turns.length; i++) {
        var t = s.turns[i];
        var body = self.bubble(t[0], t[1], s);
        var caret = document.createElement('span');
        caret.className = 'caret';
        for (var c = 1; c <= t[1].length; c++) {
          if (!alive()) { stopTimer(); return; }
          body.textContent = t[1].slice(0, c);
          body.appendChild(caret);
          await wait(t[0] === 'ai' ? 22 : 26);
        }
        body.textContent = t[1];
        await wait(650);
      }
      if (!alive()) { stopTimer(); return; }
      self.card(s);
      await wait(1300);
      stopTimer();
      if (!alive()) return;
      self.status.innerHTML = '<span class="live">● ' + (s.outbound ? 'AI called' : 'Answered by AI') + '</span> · call ended';
      self.fillSms(s);
      self.sms.classList.add('is-in');
      if (!loop) return;
      await wait(5200);
      if (alive()) self.play(s, true);
    })();
  };

  var heroPhone = $('[data-call="hero"]');
  if (heroPhone) {
    var heroPlayer = new CallPlayer(heroPhone);
    if ('IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !started) { started = true; heroPlayer.play(SCRIPTS.hero, true); }
      }, { threshold: .2 }).observe(heroPhone);
    } else {
      heroPlayer.play(SCRIPTS.hero, true);
    }
  }

  var demoPhone = $('[data-call="demo"]');
  if (demoPhone) {
    var demoPlayer = new CallPlayer(demoPhone);
    var scenarioBtns = $$('[data-scenario]');
    var startOverlay = $('.phone-start', demoPhone);
    var current = function () {
      return (scenarioBtns.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0] || scenarioBtns[0]).dataset.scenario;
    };
    var playLabel = $('[data-play-label]');
    var play = function () {
      if (startOverlay) startOverlay.hidden = true;
      if (playLabel) playLabel.textContent = 'Play again';
      demoPlayer.play(SCRIPTS[current()], false);
      var r = demoPhone.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) demoPhone.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    };
    scenarioBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        scenarioBtns.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        play();
      });
    });
    $$('[data-play]').forEach(function (b) { b.addEventListener('click', play); });
    demoPlayer.reset(SCRIPTS[current()]);
    demoPlayer.status.textContent = 'Sample call';
  }

  /* ---------- Range fill ---------- */
  function paintRange(r) {
    var pct = (r.value - r.min) / (r.max - r.min) * 100;
    r.style.setProperty('--pct', pct + '%');
  }
  $$('input[type="range"]').forEach(function (r) {
    paintRange(r);
    r.addEventListener('input', function () { paintRange(r); });
  });

  /* ---------- Rolling numbers ---------- */
  function roll(el, to) {
    var from = +(el.dataset.v || String(el.textContent).replace(/[^0-9]/g, '') || 0);
    el.dataset.v = to;
    if (reduceMotion || from === to) { el.textContent = aud(to); return; }
    var start = null;
    cancelAnimationFrame(el._raf);
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 450);
      el.textContent = aud(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  /* ---------- Calculators ---------- */
  var PLAN = 495;
  function calcNumbers(calls, inTen, job) {
    var missed = calls * 52;
    var jobs = Math.round(missed * inTen / 10);
    return { missed: missed, jobs: jobs, year: jobs * job, perMonth: jobs / 12 };
  }
  function jobsPhrase(perMonth, jobs) {
    if (perMonth >= 1) { var n = Math.round(perMonth); return n + (n === 1 ? ' job' : ' jobs') + ' a month'; }
    if (jobs < 1) return 'the odd job';
    return 'about 1 job every ' + Math.round(12 / jobs) + ' months';
  }

  $$('[data-calc]').forEach(function (root) {
    var calls = $('[name="calls"]', root), rate = $('[name="rate"]', root), job = $('[name="job"]', root);
    var out = function (k) { return $('[data-out="' + k + '"]', root); };
    function update(e) {
      var c = +calls.value, r = rate ? +rate.value : 3, j = job ? +job.value : 2500;
      var n = calcNumbers(c, r, j);
      if (out('calls')) out('calls').textContent = c;
      if (out('rate')) out('rate').textContent = r + ' in 10';
      if (out('job')) out('job').textContent = aud(j);
      roll(out('year'), n.year);
      if (out('jobs')) out('jobs').textContent = jobsPhrase(n.perMonth, n.jobs);
      if (out('verdict')) {
        out('verdict').innerHTML = j >= PLAN
          ? 'Never Miss a Job is $' + PLAN + ' a month. <em>Win back one job and it’s paid for.</em>'
          : 'Never Miss a Job is $' + PLAN + ' a month. <em>Win back ' + Math.ceil(PLAN / j) + ' jobs a month and it’s paid for.</em>';
      }
      if (out('working')) {
        out('working').textContent = c + ' missed calls × 52 weeks × ' + r + ' in 10 × ' + aud(j);
      }
      if (e) store.set('tb_calc', { calls: c, rate: r, job: j, year: n.year });
    }
    [calls, rate, job].forEach(function (el) { if (el) el.addEventListener('input', update); });
    var saved = store.get('tb_calc');
    if (saved && root.hasAttribute('data-calc-restore')) {
      calls.value = saved.calls; if (rate) rate.value = saved.rate; if (job) job.value = saved.job;
      [calls, rate, job].forEach(function (el) { if (el) paintRange(el); });
    }
    update();
  });

  /* ---------- Book a chat form ---------- */
  var form = $('#book-form');
  if (form) {
    var fillCarry = function () {
      var saved = store.get('tb_calc');
      var carry = $('.calc-carry', form);
      if (saved && saved.year && carry) {
        carry.classList.add('is-on');
        $('b', carry).textContent = aud(saved.year);
        $('[name="calculator_estimate"]', form).value = aud(saved.year) + ' a year (' + saved.calls + ' missed calls/wk, ' + saved.rate + ' in 10 book, ' + aud(saved.job) + ' job)';
      }
    };
    fillCarry();
    window.TB_fillCarry = fillCarry;
    var plan = new URLSearchParams(location.search).get('plan');
    $$('[name="plan"]', form).forEach(function (r) { if (plan && r.value === plan) r.checked = true; });

    var setError = function (field, msg) {
      var wrap = field.closest('.field');
      var err = $('.field__error', wrap);
      wrap.classList.toggle('has-error', !!msg);
      if (err) err.textContent = msg || '';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [['name', 'Pop your name in so I know who to ask for.'], ['business', 'What’s the business called?'], ['phone', 'I need a number to call you on.']].forEach(function (pair) {
        var f = form.elements[pair[0]];
        var bad = !f.value.trim() || (pair[0] === 'phone' && f.value.replace(/\D/g, '').length < 8);
        setError(f, bad ? (pair[0] === 'phone' && f.value.trim() ? 'That number looks a bit short. Check it and try again.' : pair[1]) : '');
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;

      var btn = $('button[type="submit"]', form);
      var status = $('.form__status', form);
      var endpoint = form.dataset.endpoint;
      var done = function () {
        store.set('tb_lead', { name: form.elements.name.value.trim().split(' ')[0], time: form.elements.time.value });
        if (window.TB_go) window.TB_go('thanks.html'); else location.href = 'thanks.html';
      };
      if (!endpoint) { done(); return; }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Book my call';
          status.textContent = 'That didn’t send. Check your connection and try again, or email ' + form.dataset.email + '.';
        });
    });
  }

  /* ---------- Thanks page ---------- */
  function fillThanks() {
    var thanks = $('[data-thanks]');
    if (!thanks) return;
    var lead = store.get('tb_lead');
    if (lead && lead.name) $('[data-thanks-name]').textContent = lead.name;
    if (lead && lead.time) $('[data-thanks-time]').textContent = lead.time.toLowerCase();
    var unconnected = $('[data-unconnected]');
    if (unconnected && !thanks.dataset.endpoint) unconnected.hidden = false;
  }
  fillThanks();
  window.TB_fillThanks = fillThanks;

  /* =================================================================
     Motion and flow
     ================================================================= */
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Headline words ---------- */
  $$('.hero__title, .page-hero h1, .story-hero h1, .story-top h1').forEach(function (h) {
    if (reduceMotion) return;
    var i = 0;
    var wrap = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', i++);
            w.textContent = part;
            frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) {
          wrap(c);
        }
      });
    };
    wrap(h);
    h.classList.add('split');
  });

  /* ---------- Reveal on scroll ---------- */
  var REVEAL = ['.section-head > *', '.page-hero__inner > p', '.hero__copy > p', '.hero__copy > .btn-row', '.phone-wrap',
    '.flow__step', '.example', '.setup-note', '.svc', '.plan', '.plans-note', '.calc__inputs .range', '.calc__out', '.calc__note',
    '.faq-group', '.story-hero .photo-ph', '.story-hero > div > p', '.prose > *', '.ba__col', '.maker > *', '.demo__copy > *',
    '.form', '.nexts li', '.side-card', '.cta-strip__inner > *', '.sources', '.center-page__inner > *',
    '.srv__copy', '.srv__msg', '.srv-cta', '.journey', '.option', '.lock', '.area', '.minibundle', '.svc-group__head', '.svc-card', '.notsure > *', '.problem__grid > h2', '.problem__pts li', '.svc-get__list', '.svc-get__ex', '.shot', '.logo-card', '.ute-card', '.bizcard-card', '.fbad', '.bundle', '.combo', '.custom', '.bundle-in', '.auto', '.svc-hero__ico', '.pain', '.cost', '.change__col', '.change__arrow', '.result', '.value', '.facts-row li', '.story-top__photo', '.signoff > *', '.story-quote .signature', '.handle__col', '.duty__col', '.price-block > *', '.hiw-jump', '.more__copy > *', '.more__flow', '.lh-card', '.leads-offer > *', '.pipe__text', '.leads-hero .btn-row'];
  var revealEls = [];
  REVEAL.forEach(function (sel) {
    $$(sel).forEach(function (el) {
      if (el.hasAttribute('data-reveal') || el.closest('.scene')) return;
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(sel); });
      el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 90 + 'ms');
      el.setAttribute('data-reveal', '');
      revealEls.push(el);
    });
  });
  $$('.more__flow li, .journey__step').forEach(function (el, k, all) { el.style.setProperty('--k', Array.prototype.indexOf.call(el.parentNode.children, el)); });
  $$('.flow__step').forEach(function (el) {
    var k = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.setProperty('--k', k);
    el.style.setProperty('--d', (k * 600 + 200) + 'ms');
  });
  $$('.area').forEach(function (el) { el.style.setProperty('--k', Array.prototype.indexOf.call(el.parentNode.children, el)); });

  function onReveal(el) {
    el.classList.add('is-in');
    if (el.classList.contains('flow__step')) el.parentNode.classList.add('is-in');
    $$('.msg-card', el).concat(el.classList.contains('msg-card') ? [el] : []).forEach(sendMessage);
    $$('[data-countup]', el).forEach(countUp);
  }
  if (hasIO && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { onReveal(en.target); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(onReveal);
  }

  /* ---------- Messages arrive with typing dots ---------- */
  $$('.msg-card').forEach(function (card) {
    if (reduceMotion) return;
    var t = document.createElement('span');
    t.className = 'typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    card.appendChild(t);
    card.classList.add('is-waiting');
  });
  function sendMessage(card) {
    if (!card.classList.contains('is-waiting') || card._sent) return;
    card._sent = true;
    setTimeout(function () { card.classList.add('is-typing'); }, 350);
    setTimeout(function () { card.classList.remove('is-typing', 'is-waiting'); card.classList.add('is-sent'); }, 1500);
  }

  /* ---------- Count up ---------- */
  function countUp(el) {
    if (reduceMotion || el._done) return;
    el._done = true;
    var to = +el.dataset.countup, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 1100);
      el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-AU') + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Signal line ----------
     One per <main>. A thin line down the side that draws as you scroll,
     lighting a node at the top of each section it reaches. */
  var signals = $$('main').map(function (m) {
    var sig = document.createElement('div');
    sig.className = 'signal';
    sig.setAttribute('aria-hidden', 'true');
    sig.innerHTML = '<div class="signal__track"></div><div class="signal__fill"></div><div class="signal__head"></div>';
    m.appendChild(sig);
    var nodes = $$(':scope > section', m).slice(1).map(function (sec) {
      var n = document.createElement('span');
      n.className = 'signal__node';
      sig.appendChild(n);
      return { el: n, sec: sec, y: 0 };
    });
    return { main: m, el: sig, nodes: nodes };
  });
  var isShown = function (el) { return !el.closest('[hidden]'); };
  function layoutSignal() {
    signals.forEach(function (sg) {
      if (!isShown(sg.main)) return;
      var top = sg.main.getBoundingClientRect().top;
      sg.nodes.forEach(function (n) {
        n.y = n.sec.getBoundingClientRect().top - top;
        n.el.style.top = n.y + 'px';
      });
    });
  }
  function drawSignal() {
    signals.forEach(function (sg) {
      if (!isShown(sg.main)) return;
      var r = sg.main.getBoundingClientRect();
      var fill = reduceMotion ? r.height : Math.max(0, Math.min(r.height, window.innerHeight * 0.62 - r.top));
      sg.el.style.setProperty('--fill', fill + 'px');
      sg.nodes.forEach(function (n) { n.el.classList.toggle('is-lit', fill >= n.y); });
    });
  }

  /* ---------- Quote words light up as you scroll ---------- */
  var lightups = $$('.maker__quote, .pullquote');
  lightups.forEach(function (q) {
    if (reduceMotion) return;
    q.innerHTML = q.textContent.split(/(\s+)/).map(function (w) {
      return /^\s+$/.test(w) ? w : '<span class="lw">' + w + '</span>';
    }).join('');
    q.classList.add('lightup');
    q._words = $$('.lw', q);
  });
  function drawLightups() {
    lightups.forEach(function (q) {
      if (!q._words) return;
      var r = q.getBoundingClientRect();
      var p = (window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.35);
      var lit = Math.round(Math.max(0, Math.min(1, p)) * q._words.length);
      q._words.forEach(function (w, i) { w.classList.toggle('on', i < lit); });
    });
  }

  /* ---------- Parallax ---------- */
  var parallax = $$('[data-parallax]');
  function drawParallax() {
    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var off = (r.top + r.height / 2 - window.innerHeight / 2) * -0.06;
      el.style.transform = 'translateY(' + off.toFixed(1) + 'px)';
    });
  }

  /* ---------- Phone tilt (desktop) ---------- */
  var heroWrap = $('[data-call="hero"]');
  if (heroWrap && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var heroSec = heroWrap.closest('section');
    heroSec.addEventListener('pointermove', function (e) {
      var r = heroWrap.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      var y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      heroWrap.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      heroWrap.style.setProperty('--rx', (y * -10).toFixed(2) + 'deg');
    });
    heroSec.addEventListener('pointerleave', function () {
      heroWrap.style.setProperty('--ry', '0deg');
      heroWrap.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- Stats story ---------- */
  var stats = $('[data-stats]');
  var drawStats = function () {};
  if (stats) {
    var PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
    var phones = $('[data-vis="phones"]', stats);
    var missOrder = [0, 2, 3, 5, 7, 9];
    var html = '<div class="vis-phones">';
    for (var i = 0; i < 10; i++) {
      var k = missOrder.indexOf(i);
      html += '<span class="vp' + (k > -1 ? ' miss' : '') + '" style="--i:' + i + ';--k:' + Math.max(k, 0) + '">' + PHONE + '</span>';
    }
    phones.innerHTML = html + '</div>';

    var crowd = $('[data-vis="crowd"]', stats);
    var seed = 7, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var ids = []; for (i = 0; i < 100; i++) ids.push(i);
    ids.sort(function () { return rnd() - .5; });
    var gone = {}; ids.slice(0, 78).forEach(function (id) { gone[id] = true; });
    html = '<div class="vis-crowd">';
    for (i = 0; i < 100; i++) {
      html += '<span class="vc' + (gone[i] ? ' gone' : '') + '" style="--d:' + Math.round(rnd() * 1200) + 'ms;--x:' + Math.round((rnd() - .5) * 30) + 'px"></span>';
    }
    crowd.innerHTML = html + '</div>';

    $('[data-vis="switch"]', stats).innerHTML =
      '<div class="vis-switch"><div class="vs-people"><span class="vs-p"></span><span class="vs-p"></span><span class="vs-p"></span><span class="vs-p"></span><span class="vs-p leaver"></span></div>' +
      '<div class="vs-biz"><span class="vs-slot"></span>' + PHONE + '<span>Another business</span></div></div>';
    var placeLeaver = function () {
      var lv = $('.vs-p.leaver', stats), slot = $('.vs-slot', stats);
      var t = lv.style.transform; lv.style.transition = 'none'; lv.style.transform = 'none';
      var a = lv.getBoundingClientRect(), b = slot.getBoundingClientRect();
      lv.style.setProperty('--gx', (b.left + b.width / 2 - (a.left + a.width / 2)) + 'px');
      lv.style.setProperty('--gy', (b.top + b.height / 2 - (a.top + a.height / 2)) + 'px');
      lv.style.transform = t; lv.offsetWidth; lv.style.transition = '';
    };
    placeLeaver();
    window.addEventListener('resize', placeLeaver);

    var scenes = $$('.scene', stats);
    var dots = $$('.stats-dots li', stats);
    var active = -1;
    var countTo = function (scene) {
      var el = $('[data-to]', scene);
      if (!el || reduceMotion) return;
      var to = +el.dataset.to, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / 1400);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var activate = function (idx) {
      if (idx === active) return;
      active = idx;
      if (idx === 2) placeLeaver();
      scenes.forEach(function (sc, i) { sc.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i <= idx); });
      if (scenes[idx]) countTo(scenes[idx]);
    };
    var pinned = !reduceMotion && window.matchMedia('(min-width: 900px) and (min-height: 600px)').matches;
    if (pinned) {
      stats.classList.add('stats--pinned');
      var track = $('.stats-track', stats);
      drawStats = function () {
        var r = track.getBoundingClientRect();
        var total = r.height - (window.innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')));
        var p = Math.max(0, Math.min(0.999, -r.top / total));
        activate(r.top < window.innerHeight * 0.5 ? Math.floor(p * 3) : -1);
        if (r.top >= window.innerHeight * 0.5 && active === -1) scenes.forEach(function (sc) { sc.classList.remove('is-active'); });
      };
    } else if (hasIO && !reduceMotion) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          if (en.target.dataset.scene === '2') placeLeaver();
          en.target.classList.add('is-active');
          countTo(en.target);
          so.unobserve(en.target);
        });
      }, { threshold: .45 });
      scenes.forEach(function (sc) { so.observe(sc); });
    } else {
      scenes.forEach(function (sc) { sc.classList.add('is-active'); });
    }
  }

  /* ---------- Website previews scroll inside their browser frame ---------- */
  var shots = $$('.shot');
  function measureShots() {
    shots.forEach(function (sh) {
      var img = $('img', sh), view = $('.shot__view', sh);
      if (!img || !view || !img.offsetHeight) return;
      sh.style.setProperty('--dist', Math.min(0, view.clientHeight - img.offsetHeight) + 'px');
    });
  }
  shots.forEach(function (sh) {
    var img = $('img', sh);
    if (img) img.addEventListener('load', measureShots);
  });
  // On touch screens there's no hover, so previews scroll up and down by themselves once in view.
  if (shots.length && !reduceMotion && !window.matchMedia('(hover: hover)').matches && hasIO) {
    var so2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var sh = en.target;
        if (en.isIntersecting && !sh._timer) {
          sh.classList.add('is-auto');
          sh._timer = setInterval(function () { sh.classList.toggle('is-auto'); }, 7500);
        } else if (!en.isIntersecting && sh._timer) {
          clearInterval(sh._timer); sh._timer = null; sh.classList.remove('is-auto');
        }
      });
    }, { threshold: .4 });
    shots.forEach(function (sh) { so2.observe(sh); });
  }

  /* ---------- Pipeline (Get more jobs) ---------- */
  var pipes = $$('[data-pipe]');
  function drawPipes() {
    pipes.forEach(function (pipe) {
      if (!isShown(pipe)) return;
      var r = pipe.getBoundingClientRect();
      var fill = reduceMotion ? r.height : Math.max(0, Math.min(r.height, window.innerHeight * 0.6 - r.top));
      pipe.style.setProperty('--pipe-fill', fill + 'px');
      $$('.pipe__step', pipe).forEach(function (st) {
        var n = $('.pipe__n', st);
        var y = n.getBoundingClientRect().top + n.offsetHeight / 2 - r.top;
        st.classList.toggle('is-on', fill >= y);
      });
    });
  }


  /* =================================================================
     Service centrepieces
     Each one plays when it scrolls into view. "Play again" restarts it.
     ================================================================= */
  var CP = {};
  var sleep = function (ms, tok) { return new Promise(function (r, j) { setTimeout(function () { tok.dead ? j('stop') : r(); }, ms); }); };
  var typeInto = async function (el, text, tok, speed) {
    for (var i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await sleep(speed || 45, tok); }
  };

  // 1. Websites: the loading race
  CP.race = {
    reset: function (r) {
      $$('.rload', r).forEach(function (l) { l.classList.remove('is-done'); });
      $('.rload__bar', r).style.setProperty('--load', '0%');
      $('[data-rtime]', r).textContent = '0.0s';
      $('[data-left]', r).textContent = '0';
      $('.rnotif', r).classList.remove('is-in');
    },
    play: async function (r, tok) {
      var t0 = performance.now(), fastDone = false, notified = false;
      var bar = $('.rload__bar', r), time = $('[data-rtime]', r), left = $('[data-left]', r);
      while (true) {
        var t = (performance.now() - t0) / 1000;
        if (!fastDone && t > 0.8) { fastDone = true; $('.rload--fast', r).classList.add('is-done'); }
        if (!notified && t > 2.2) { notified = true; $('.rnotif', r).classList.add('is-in'); }
        var shown = Math.min(t * 1.15, 8);
        time.textContent = shown.toFixed(1) + 's';
        bar.style.setProperty('--load', Math.min(100, t / 7 * 92) + '%');
        left.textContent = Math.round(53 * Math.min(1, Math.max(0, (shown - 1.5) / 5.5)));
        if (t > 7) break;
        await sleep(80, tok);
      }
      $('.rload:not(.rload--fast)', r).classList.add('is-done');
    },
    still: function (r) {
      $$('.rload', r).forEach(function (l) { l.classList.add('is-done'); });
      $('[data-rtime]', r).textContent = '8.0s'; $('[data-left]', r).textContent = '53';
      $('.rnotif', r).classList.add('is-in');
    }
  };

  // 3. SEO: climb the map
  CP.climb = {
    order: function (r, mePos) {
      var items = $$('.ci', r), me = $('.ci--me', r), others = items.filter(function (i) { return i !== me; });
      var slots = []; others.forEach(function (o) { slots.push(o); });
      slots.splice(mePos, 0, me);
      slots.forEach(function (el, i) { el.style.top = (i * 62) + 'px'; });
      me.classList.toggle('is-top', mePos < 3);
    },
    set: function (r, step) {
      var pos = [5, 4, 3, 2, 1, 0][step], months = [0, 1, 2, 3, 4, 6][step];
      var revs = [5, 18, 37, 61, 92, 126][step], calls = [2, 5, 11, 19, 27, 38][step];
      CP.climb.order(r, pos);
      $('[data-c-pos]', r).textContent = '#' + (pos + 1);
      $('[data-c-rev]', r).textContent = revs;
      $('[data-c-rev2]', r).textContent = '4.9 (' + revs + ')';
      $('[data-c-calls]', r).textContent = calls;
      $('[data-month]', r).textContent = 'Month ' + months;
    },
    reset: function (r) { CP.climb.set(r, 0); },
    play: async function (r, tok) { for (var i = 1; i <= 5; i++) { await sleep(900, tok); CP.climb.set(r, i); } },
    still: function (r) { CP.climb.set(r, 5); }
  };

  // 4. Meta ads: scroll to lead
  CP.feed = {
    step: function (r, n) { $$('.fsteps li', r).forEach(function (li) { var k = +li.dataset.s; li.classList.toggle('is-on', k === n); li.classList.toggle('is-done', k < n); }); },
    reset: function (r) {
      $('[data-feed]', r).style.transform = 'translateY(0)';
      $('[data-ad]', r).classList.remove('is-hot'); $('[data-adbtn]', r).classList.remove('is-tap');
      $('[data-form]', r).classList.remove('is-in'); $('[data-lead]', r).classList.remove('is-in');
      $$('[data-type]', r).forEach(function (e) { e.textContent = ''; });
      CP.feed.step(r, 0);
    },
    tap: async function (r, el, tok) {
      var tap = $('[data-tap]', r), sr = $('.fphone__screen', r).getBoundingClientRect(), er = el.getBoundingClientRect();
      tap.style.left = (er.left - sr.left + er.width / 2) + 'px'; tap.style.top = (er.top - sr.top + er.height / 2) + 'px';
      tap.classList.remove('is-on'); void tap.offsetWidth; tap.classList.add('is-on');
      el.classList.add('is-tap'); await sleep(450, tok);
    },
    play: async function (r, tok) {
      var feed = $('[data-feed]', r), ad = $('[data-ad]', r), screen = $('.fphone__screen', r);
      CP.feed.step(r, 1);
      var target = ad.offsetTop - (screen.clientHeight - ad.offsetHeight) / 2;
      feed.style.transform = 'translateY(' + (-target) + 'px)';
      await sleep(2700, tok);
      CP.feed.step(r, 2); ad.classList.add('is-hot'); await sleep(1300, tok);
      CP.feed.step(r, 3); await CP.feed.tap(r, $('[data-adbtn]', r), tok);
      $('[data-form]', r).classList.add('is-in'); await sleep(600, tok);
      CP.feed.step(r, 4);
      var fields = $$('[data-type]', r);
      for (var i = 0; i < fields.length; i++) { await typeInto(fields[i], fields[i].dataset.type, tok, 55); await sleep(200, tok); }
      await CP.feed.tap(r, $('[data-submit]', r), tok);
      CP.feed.step(r, 5); $('[data-lead]', r).classList.add('is-in');
    },
    still: function (r) {
      $('[data-form]', r).classList.add('is-in'); $('[data-lead]', r).classList.add('is-in');
      $$('[data-type]', r).forEach(function (e) { e.textContent = e.dataset.type; });
      CP.feed.step(r, 5);
    }
  };

  // 5. Google Ads: live search
  CP.gsearch = {
    reset: function (r) {
      $('[data-q]', r).textContent = ''; $('[data-results]', r).classList.remove('is-in');
      $('[data-call]', r).classList.remove('is-pulse'); $('[data-calling]', r).classList.remove('is-in');
      $('[data-yourphone]', r).classList.remove('is-ring');
    },
    play: async function (r, tok) {
      await sleep(400, tok);
      await typeInto($('[data-q]', r), 'emergency plumber dee why', tok, 70);
      await sleep(500, tok); $('[data-results]', r).classList.add('is-in');
      await sleep(1400, tok); $('[data-call]', r).classList.add('is-pulse');
      await sleep(1800, tok); $('[data-calling]', r).classList.add('is-in');
      await sleep(700, tok); $('[data-yourphone]', r).classList.add('is-ring');
    },
    still: function (r) { $('[data-q]', r).textContent = 'emergency plumber dee why'; $('[data-results]', r).classList.add('is-in'); $('[data-yourphone]', r).classList.add('is-ring'); }
  };

  // 6. AI receptionist: missed-call pile-up
  var CALLS = [['7:42', 'Missed call', '0412 ••• 381', 'New job booked', 'Retaining wall · Thu 7:30am'], ['9:15', 'Missed call', '0433 ••• 902', 'Message taken', 'Builder wants a callback'], ['11:03', 'Missed call', '0401 ••• 557', 'New job booked', 'Pool dig · Mon 8am'], ['12:48', 'Missed call', '0422 ••• 160', 'New job booked', 'Driveway · Fri 9am'], ['14:20', 'Missed call', '0419 ••• 774', 'Message taken', 'Supplier re: delivery'], ['16:35', 'Missed call', '0455 ••• 230', 'New job booked', 'Site cut · Wed 7am']];
  CP.pileup = {
    reset: function (r) {
      $('[data-list]', r).innerHTML = ''; $('[data-time]', r).textContent = '7:00'; $('[data-missed]', r).textContent = '0';
      var tg = $('[data-toggle]', r); tg.setAttribute('aria-pressed', 'false'); tg.classList.remove('is-ready');
      $('[data-after]', r).classList.remove('is-in'); r._switched = false;
    },
    add: function (r, c) {
      var n = document.createElement('div'); n.className = 'n2';
      n.innerHTML = '<span class="n2__ico"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></span><div class="n2__txt"><b></b><span></span></div><time></time>';
      $('.n2__txt b', n).textContent = c[1]; $('.n2__txt span', n).textContent = c[2]; $('time', n).textContent = c[0];
      n._ok = c; $('[data-list]', r).appendChild(n);
    },
    switchOn: async function (r, tok) {
      if (r._switched) return; r._switched = true;
      var tg = $('[data-toggle]', r); tg.classList.remove('is-ready'); tg.setAttribute('aria-pressed', 'true');
      var ns = $$('.n2', r);
      for (var i = 0; i < ns.length; i++) {
        await sleep(260, tok);
        ns[i].classList.add('is-ok'); $('.n2__txt b', ns[i]).textContent = ns[i]._ok[3]; $('.n2__txt span', ns[i]).textContent = ns[i]._ok[4];
      }
      $('[data-missed]', r).textContent = '0'; $('[data-after]', r).classList.add('is-in');
    },
    play: async function (r, tok) {
      var time = $('[data-time]', r), missed = $('[data-missed]', r), k = 0;
      for (var m = 7 * 60; m <= 17 * 60; m += 10) {
        time.textContent = Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2);
        while (k < CALLS.length) {
          var p = CALLS[k][0].split(':'), cm = +p[0] * 60 + +p[1];
          if (cm > m) break;
          CP.pileup.add(r, CALLS[k]); k++; missed.textContent = k;
        }
        await sleep(70, tok);
      }
      $('[data-toggle]', r).classList.add('is-ready');
      await sleep(4500, tok);
      await CP.pileup.switchOn(r, tok);
    },
    init: function (r, run) { $('[data-toggle]', r).addEventListener('click', function () { if ($$('.n2', r).length) CP.pileup.switchOn(r, run.tok); }); },
    still: function (r) { CALLS.forEach(function (c) { CP.pileup.add(r, c); }); $('[data-time]', r).textContent = '17:00'; CP.pileup.switchOn(r, { dead: false }); }
  };

  // 7. AI lead caller: the callback race
  var hms = function (sec) { sec = Math.round(sec); return Math.floor(sec / 3600) + ':' + ('0' + Math.floor(sec % 3600 / 60)).slice(-2) + ':' + ('0' + sec % 60).slice(-2); };
  CP.race2 = {
    reset: function (r) {
      $('[data-w1]', r).textContent = '0:00:00'; $('[data-w2]', r).textContent = '0:00:00';
      $('[data-t1]', r).style.width = '0'; $('[data-t2]', r).style.width = '0';
      ['[data-r1]', '[data-r2]', '[data-texts]'].forEach(function (q) { $(q, r).classList.remove('is-in'); });
    },
    play: async function (r, tok) {
      var t0 = performance.now(), aiDone = false;
      while (true) {
        var t = (performance.now() - t0) / 1000;
        var ai = Math.min(47, t / 1.4 * 47), slow = Math.min(15120, Math.pow(Math.min(1, t / 5.5), 2) * 15120);
        $('[data-w2]', r).textContent = hms(ai); $('[data-t2]', r).style.width = (ai / 47 * 100) + '%';
        $('[data-w1]', r).textContent = hms(slow); $('[data-t1]', r).style.width = (slow / 15120 * 100) + '%';
        if (!aiDone && ai >= 47) { aiDone = true; $('[data-r2]', r).classList.add('is-in'); setTimeout(function () { $('[data-texts]', r).classList.add('is-in'); }, 700); }
        if (slow >= 15120) break;
        await sleep(50, tok);
      }
      $('[data-r1]', r).classList.add('is-in');
    },
    still: function (r) { $('[data-w1]', r).textContent = '4:12:00'; $('[data-w2]', r).textContent = '0:00:47'; $('[data-t1]', r).style.width = '100%'; $('[data-t2]', r).style.width = '100%'; ['[data-r1]', '[data-r2]', '[data-texts]'].forEach(function (q) { $(q, r).classList.add('is-in'); }); }
  };

  // 8. AI chatbot: a working demo
  var BOT = {
    greet: "G'day! I'm the Coastline Plumbing assistant. What can I help with?",
    q: [
      ['Do you service Manly?', "Yes, we cover Manly and the whole Northern Beaches. What do you need done?"],
      ['How much for a new hot water system?', "Most replacements are between $1,800 and $3,500 installed, depending on the type. We'll give you an exact price on site. Want me to book that?"],
      ['Can someone come tomorrow?', "We've got a spot tomorrow at 8am or 1pm. Which suits you better?"],
      ['Are you licensed?', "Yes, fully licensed and insured. Licence no. 000000."]
    ],
    book: ['Book me in', "Easy. What's your name and best number? (In the real thing, they type it here.)", "Thanks Megan! You're booked for tomorrow at 8am. You'll get a text confirmation shortly."]
  };
  CP.chat = {
    say: async function (r, who, text, tok) {
      var log = $('[data-log]', r);
      if (who === 'bot') {
        var t = document.createElement('div'); t.className = 'cbub cbub--typing'; t.innerHTML = '<i></i><i></i><i></i>';
        log.appendChild(t); log.scrollTop = log.scrollHeight;
        await sleep(Math.min(1400, 500 + text.length * 12), tok); t.remove();
      }
      var b = document.createElement('div'); b.className = 'cbub cbub--' + (who === 'bot' ? 'bot' : 'me'); b.textContent = text;
      log.appendChild(b); log.scrollTop = log.scrollHeight;
    },
    chips: function (r, run) {
      var box = $('[data-chips]', r); box.innerHTML = '';
      var asked = r._asked || [];
      var opts = BOT.q.filter(function (q) { return asked.indexOf(q[0]) < 0; });
      if (asked.length && !r._booked) opts = [BOT.book].concat(opts);
      opts.forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = q[0];
        b.addEventListener('click', function () { CP.chat.ask(r, q, run); });
        box.appendChild(b);
      });
    },
    ask: async function (r, q, run) {
      var tok = run.tok; $('[data-chips]', r).innerHTML = '';
      try {
        await CP.chat.say(r, 'me', q[0], tok);
        if (q === BOT.book) {
          r._booked = true;
          await CP.chat.say(r, 'bot', q[1], tok);
          await sleep(900, tok); await CP.chat.say(r, 'me', 'Megan, 0412 ••• 381', tok);
          await CP.chat.say(r, 'bot', q[2], tok);
        } else {
          (r._asked = r._asked || []).push(q[0]);
          await CP.chat.say(r, 'bot', q[1], tok);
        }
        CP.chat.chips(r, run);
      } catch (e) {}
    },
    reset: function (r) { $('[data-log]', r).innerHTML = ''; $('[data-chips]', r).innerHTML = ''; r._asked = []; r._booked = false; },
    play: async function (r, tok, run) { await CP.chat.say(r, 'bot', BOT.greet, tok); CP.chat.chips(r, run); },
    still: function (r, run) { var b = document.createElement('div'); b.className = 'cbub cbub--bot'; b.textContent = BOT.greet; $('[data-log]', r).appendChild(b); CP.chat.chips(r, run); }
  };

  // 9. CRM: move the jobs (tap to advance, or drag between columns)
  var STAGE_MSG = [null, function (n) { return 'Confirmation text sent to ' + n; }, function (n) { return 'Quote follow-up booked for ' + n + ' in 3 days'; }, function (n) { return 'Google review request sent to ' + n; }];
  CP.board = {
    snapshot: null,
    toast: function (r, msg) {
      var box = $('[data-toasts]', r), t = document.createElement('div'); t.className = 'toast2'; t.textContent = msg;
      box.appendChild(t);
      setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 400); }, 2600);
      while (box.children.length > 3) box.removeChild(box.firstChild);
    },
    move: function (r, card, stage) {
      var col = $('[data-stage="' + stage + '"] .board__cards', r);
      if (!col || card.parentNode === col) return;
      col.appendChild(card); card.classList.remove('is-new'); void card.offsetWidth; card.classList.add('is-new');
      if (STAGE_MSG[stage]) CP.board.toast(r, STAGE_MSG[stage](card.dataset.name));
    },
    init: function (r) {
      r._html = $$('.board__cards', r).map(function (c) { return c.innerHTML; });
      r.addEventListener('click', function (e) {
        var card = e.target.closest('.jcard'); if (!card || r._dragged) return;
        var stage = +card.closest('.board__col').dataset.stage;
        if (stage < 3) CP.board.move(r, card, stage + 1);
      });
      var drag = null;
      r.addEventListener('pointerdown', function (e) {
        var card = e.target.closest('.jcard'); if (!card || e.button > 0) return;
        drag = { card: card, x: e.clientX, y: e.clientY, on: false }; r._dragged = false;
      });
      window.addEventListener('pointermove', function (e) {
        if (!drag) return;
        if (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
          drag.on = true; r._dragged = true;
          var rc = drag.card.getBoundingClientRect();
          drag.ghost = drag.card.cloneNode(true); drag.ghost.classList.add('is-drag');
          drag.ghost.style.width = rc.width + 'px'; drag.dx = e.clientX - rc.left; drag.dy = e.clientY - rc.top;
          document.body.appendChild(drag.ghost); drag.card.style.opacity = '.3';
        }
        if (drag.on) {
          drag.ghost.style.left = (e.clientX - drag.dx) + 'px'; drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
          $$('.board__col', r).forEach(function (c) { var b = c.getBoundingClientRect(); c.classList.toggle('is-over', e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom); });
        }
      });
      window.addEventListener('pointerup', function () {
        if (!drag) return;
        if (drag.on) {
          var over = $('.board__col.is-over', r);
          if (over) CP.board.move(r, drag.card, +over.dataset.stage);
          drag.ghost.remove(); drag.card.style.opacity = '';
          $$('.board__col', r).forEach(function (c) { c.classList.remove('is-over'); });
          setTimeout(function () { r._dragged = false; }, 50);
        }
        drag = null;
      });
    },
    reset: function (r) { $$('.board__cards', r).forEach(function (c, i) { c.innerHTML = r._html[i]; }); $('[data-toasts]', r).innerHTML = ''; },
    play: async function (r, tok) {
      await sleep(900, tok);
      for (var st = 1; st <= 3; st++) {
        var card = $$('.jcard', r).filter(function (c) { return c.dataset.name === 'Sarah'; })[0];
        CP.board.move(r, card, st); await sleep(1500, tok);
      }
    },
    still: function () {}
  };

  // Compare sliders (websites before/after, branding)
  $$('[data-cmp]').forEach(function (c) {
    var range = $('.cmp__range', c);
    range.addEventListener('input', function () { c.style.setProperty('--x', range.value + '%'); c._touched = true; });
  });
  var sweep = async function (c) {
    if (reduceMotion || c._touched) return;
    var range = $('.cmp__range', c), tok = { dead: false };
    var to = function (v, ms) { return new Promise(function (res) { var a = +range.value, t0 = performance.now(); (function f(now) { if (c._touched) return res(); var p = Math.min(1, (now - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; range.value = a + (v - a) * e; c.style.setProperty('--x', range.value + '%'); p < 1 ? requestAnimationFrame(f) : res(); })(t0); }); };
    await to(85, 1100); await to(15, 1400); await to(50, 900);
  };

  // Runner: one run per centrepiece; a new run cancels the old one.
  $$('.cp-sec').forEach(function (sec) {
    var root = $('[data-cp]', sec), cmp = $$('[data-cmp]', sec);
    var name = root && root.dataset.cp, def = name && CP[name];
    var run = { tok: { dead: false } };
    var start = function () {
      if (def) {
        run.tok.dead = true; run.tok = { dead: false };
        def.reset(root, run);
        if (reduceMotion) { def.still(root, run); }
        else { def.play(root, run.tok, run).catch(function () {}); }
      }
      cmp.forEach(function (c) { c._touched = false; sweep(c); });
    };
    if (def && def.init) def.init(root, run);
    if (def) def.reset(root, run);
    var replay = $('[data-replay]', sec);
    if (replay) replay.addEventListener('click', start);
    if (hasIO) {
      var seen = false;
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !seen) { seen = true; start(); }
      }, { threshold: .35 }).observe(root || sec);
    } else { start(); }
  });

  /* ---------- One scroll loop for everything ---------- */
  var ticking = false;
  function frame() {
    ticking = false;
    drawSignal();
    drawLightups();
    drawParallax();
    drawStats();
    drawPipes();
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', function () { layoutSignal(); measureShots(); requestFrame(); });
  window.addEventListener('load', function () { layoutSignal(); measureShots(); requestFrame(); });
  layoutSignal();
  frame();
  window.TB_relayout = function () { layoutSignal(); measureShots(); frame(); };
})();
