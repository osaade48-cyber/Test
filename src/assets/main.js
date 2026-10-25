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
          ? 'The Growth plan is $' + PLAN + ' a month. <em>Win back one job and it’s paid for.</em>'
          : 'The Growth plan is $' + PLAN + ' a month. <em>Win back ' + Math.ceil(PLAN / j) + ' jobs a month and it’s paid for.</em>';
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
          btn.textContent = 'Book my chat';
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
    '.srv__copy', '.srv__msg', '.srv-cta', '.journey', '.option', '.lock', '.value', '.facts-row li', '.story-top__photo', '.signoff > *', '.story-quote .signature', '.handle__col', '.duty__col', '.price-block > *', '.hiw-jump', '.more__copy > *', '.more__flow', '.lh-card', '.leads-offer > *', '.pipe__text', '.leads-hero .btn-row'];
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
  $$('.flow__step').forEach(function (el, k) { el.style.setProperty('--k', k); el.style.setProperty('--d', (k * 600 + 200) + 'ms'); });

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
    var to = +el.dataset.countup, pre = el.dataset.prefix || '', start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 1100);
      el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-AU');
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
  window.addEventListener('resize', function () { layoutSignal(); requestFrame(); });
  window.addEventListener('load', function () { layoutSignal(); requestFrame(); });
  layoutSignal();
  frame();
  window.TB_relayout = function () { layoutSignal(); frame(); };
})();
