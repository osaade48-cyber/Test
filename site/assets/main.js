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

  /* ---------- Scroll reveal ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Sample calls ---------- */
  var SCRIPTS = {
    hero: {
      caller: '0412 ••• 381',
      business: 'Avera Earthworx',
      turns: [
        ['ai', "G'day, Avera Earthworx. You've got the office, how can I help?"],
        ['caller', "Hi, I need a quote for a retaining wall and a site cut."],
        ['ai', "No worries. What suburb's the job in, and can a 5-tonne excavator get down the side?"],
        ['caller', "Castle Hill. Yeah, side access is about 2.4 metres."],
        ['ai', "Perfect. I can get someone out for a site visit Thursday at 7:30am. Does that suit?"],
        ['caller', "Thursday's great, thanks."]
      ],
      booked: ['Site visit booked', 'Thu 7:30am · Castle Hill · In your calendar'],
      sms: ['New job booked', 'Sarah, Castle Hill. Retaining wall + site cut, 2.4m side access. Site visit Thu 7:30am.']
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
    label.textContent = who === 'ai' ? 'AI receptionist' : 'Caller';
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
    this.status.innerHTML = '<span class="live">● Answered by AI</span> · call ended';
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
      self.status.innerHTML = '<span class="live">● Answered by AI</span> · ' + (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
    }
    function stopTimer() { if (timer) clearInterval(timer); timer = null; }

    (async function () {
      self.reset(s);
      for (var ring = 1; ring <= 3; ring++) {
        if (!alive()) return;
        self.status.innerHTML = '<span class="ringing">Incoming call · ring ' + ring + '</span>';
        await wait(750);
      }
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
      self.status.innerHTML = '<span class="live">● Answered by AI</span> · call ended';
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
    var pick = function (btn) {
      scenarioBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      demoPlayer.play(SCRIPTS[btn.dataset.scenario], false);
    };
    scenarioBtns.forEach(function (b) { b.addEventListener('click', function () { pick(b); }); });
    demoPlayer.showAll(SCRIPTS[scenarioBtns[0].dataset.scenario]);
  }

  /* ---------- Missed-call ticker ----------
     Based on an industry estimate of ~270,000 missed calls a day to Aussie tradies (about 3 a second). */
  var ticker = $('[data-ticker]');
  if (ticker) {
    var t0 = Date.now();
    var perSec = 270000 / 86400;
    var draw = function () { ticker.textContent = Math.floor((Date.now() - t0) / 1000 * perSec).toLocaleString('en-AU'); };
    setInterval(draw, 330);
  }

  /* ---------- Count-up numbers (final value is in the HTML) ---------- */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, target = +el.dataset.count, suffix = el.dataset.suffix || '', start = null;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / 1400);
          var eased = 1 - Math.pow(1 - p, 3);
          el.firstChild.nodeValue = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: .5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- Same call, two endings ---------- */
  var endings = $('[data-endings]');
  if (endings) {
    var withoutEl = $('.ending--without', endings);
    var withEl = $('.ending--with', endings);
    var tabs = $$('.endings-switch button');
    var mobile = window.matchMedia('(max-width: 760px)');
    var showTab = function (which) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.ending === which)); });
      if (mobile.matches) {
        withoutEl.hidden = which !== 'without';
        withEl.hidden = which !== 'with';
      }
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { showTab(t.dataset.ending); }); });
    var syncLayout = function () {
      if (mobile.matches) showTab((tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]).dataset.ending);
      else { withoutEl.hidden = false; withEl.hidden = false; }
    };
    if (mobile.addEventListener) mobile.addEventListener('change', syncLayout);
    syncLayout();

    if ('IntersectionObserver' in window && !reduceMotion) {
      var played = false;
      var a = $$('li', withoutEl), b = $$('li', withEl);
      new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting || played) return;
        played = true;
        endings.classList.add('is-playing');
        (async function () {
          for (var i = 0; i < Math.max(a.length, b.length); i++) {
            if (a[i]) a[i].classList.add('is-on');
            await wait(320);
            if (b[i]) b[i].classList.add('is-on');
            await wait(420);
          }
          endings.classList.remove('is-playing');
          $$('li', endings).forEach(function (li) { li.classList.remove('is-on'); });
        })();
      }, { threshold: .45 }).observe(endings);
    }
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

  /* ---------- Calculators ---------- */
  var PLAN = 400;
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
      out('year').textContent = aud(n.year);
      if (out('jobs')) out('jobs').textContent = jobsPhrase(n.perMonth, n.jobs);
      if (out('verdict')) {
        out('verdict').innerHTML = j >= PLAN
          ? 'The Growth plan is $400 a month. <em>Win back one job and it’s paid for.</em>'
          : 'The Growth plan is $400 a month. <em>Win back ' + Math.ceil(PLAN / j) + ' jobs a month and it’s paid for.</em>';
      }
      if (out('working')) {
        out('working').innerHTML =
          '<b>' + c + '</b> missed calls × 52 weeks = <b>' + n.missed.toLocaleString('en-AU') + '</b> a year<br>' +
          '<b>' + r + ' in 10</b> would’ve become a job = <b>' + n.jobs.toLocaleString('en-AU') + '</b> jobs<br>' +
          n.jobs.toLocaleString('en-AU') + ' jobs × <b>' + aud(j) + '</b> = <b>' + aud(n.year) + '</b> a year';
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
    if (plan && $('[name="plan"]', form)) $('[name="plan"]', form).value = plan;

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
})();
