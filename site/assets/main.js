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
        if (!alive()) { stopTimer(); return; }
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
    var started = false;
    var heroLabel = $('[data-call-label]', heroPhone);
    var heroChips = $$('[data-scenario]', heroPhone.parentNode);
    heroChips.forEach(function (b) {
      b.addEventListener('click', function () {
        started = true;
        heroChips.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        if (heroLabel) heroLabel.textContent = b.dataset.label;
        heroPlayer.play(SCRIPTS[b.dataset.scenario], false);
      });
    });
    if ('IntersectionObserver' in window) {
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
    var scenarioBtns = $$('[data-scenario]', demoPhone.closest('section'));
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

  /* ---------- Phone links ----------
     tel: links only work on a phone, outside an iframe, once the real number is set.
     Everywhere else, show a tip instead of a blank error page. */
  var canDial = window.matchMedia('(pointer: coarse)').matches && window.self === window.top;
  var tip = null, tipTimer = null;
  var showTip = function (html) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'calltip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip); }
    tip.innerHTML = html;
    tip.classList.add('is-in');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () { tip.classList.remove('is-in'); }, 5000);
  };
  $$('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var num = (a.textContent.match(/\(?\d{2}\)?[\s\dX]{6,}/i) || [''])[0].trim();
      var placeholder = /x/i.test(num) || /^tel:\+?61?2?0+$/.test(a.getAttribute('href'));
      if (canDial && !placeholder) return;
      e.preventDefault();
      if (placeholder) {
        showTip('<b>The demo line isn\u2019t live yet.</b> Tap a sample call to watch the AI in action.');
        var chips = $('.call-chips') || $('.scenario-list');
        if (chips) {
          chips.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          chips.classList.remove('is-nudge'); void chips.offsetWidth; chips.classList.add('is-nudge');
        }
      } else {
        showTip('Call <b>' + num + '</b> from your phone to talk to the AI receptionist.');
      }
    });
  });

  /* ---------- Site chatbot ----------
     Answers from the knowledge base in the footer (#tb-chat-kb) and collects call-back requests.
     Sends leads to formEndpoint when it's set. */
  var chat = $('[data-chat]');
  var kbEl = document.getElementById('tb-chat-kb');
  if (chat && kbEl) {
    var KB = JSON.parse(kbEl.textContent);
    var panel = $('.tbchat__panel', chat), log = $('.tbchat__log', chat), chipsEl = $('.tbchat__chips', chat);
    var form = $('.tbchat__form', chat), input = form.elements.msg, toggle = $('.tbchat__btn', chat), teaser = $('.tbchat__teaser', chat);
    var saved = store.get('tb_chat') || { msgs: [], lead: null };
    var flow = null;
    var GENERIC = ['price', 'bundles', 'services', 'greet', 'thanks'];
    var save = function () { saved.msgs = saved.msgs.slice(-40); store.set('tb_chat', saved); };
    var scrollDown = function () { log.scrollTop = log.scrollHeight; };
    var addMsg = function (who, html, keep) {
      var m = document.createElement('div');
      m.className = 'tbmsg tbmsg--' + who;
      if (who === 'bot') m.innerHTML = html; else m.textContent = html;
      log.appendChild(m);
      scrollDown();
      if (keep !== false) { saved.msgs.push([who, html]); save(); }
    };
    var setChips = function (list) {
      chipsEl.innerHTML = '';
      (list || []).forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tbchip'; b.textContent = t;
        b.addEventListener('click', function () { send(t); });
        chipsEl.appendChild(b);
      });
    };
    var botSay = function (html, chips) {
      setChips([]);
      var dots = document.createElement('div');
      dots.className = 'tbmsg tbmsg--bot tbmsg--typing';
      dots.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(dots); scrollDown();
      setTimeout(function () {
        dots.remove();
        addMsg('bot', html);
        setChips(chips);
      }, reduceMotion ? 0 : 450 + Math.min(html.length * 4, 700));
    };
    var match = function (text) {
      var t = ' ' + text.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ') + ' ';
      var best = null, bestGeneric = null;
      KB.intents.forEach(function (it) {
        var score = 0;
        it.keys.forEach(function (k) { if (t.indexOf(' ' + k + ' ') > -1 || (k.length > 4 && t.indexOf(k) > -1) || (k.length > 5 && k.indexOf(' ') < 0 && t.indexOf(' ' + k.slice(0, -1)) > -1)) score += k.length; });
        if (!score) return;
        if (GENERIC.indexOf(it.id) > -1) { if (!bestGeneric || score > bestGeneric.s) bestGeneric = { it: it, s: score }; }
        else if (!best || score > best.s) best = { it: it, s: score };
      });
      return (best || bestGeneric || {}).it;
    };
    var sendLead = function (lead) {
      saved.lead = lead; save();
      store.set('tb_lead', { name: lead.name, time: '' });
      var endpoint = chat.dataset.endpoint;
      if (!endpoint) return;
      var fd = new FormData();
      fd.append('name', lead.name); fd.append('phone', lead.phone); fd.append('plan', lead.plan);
      fd.append('source', 'Website chatbot');
      fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).catch(function () {});
    };
    var leadStep = function (text) {
      if (flow.step === 'name') {
        var name = text.trim().split(/\s+/)[0].replace(/[^A-Za-z'-]/g, '');
        if (!name) { botSay('Sorry, what was your first name?'); return; }
        flow.name = name.charAt(0).toUpperCase() + name.slice(1);
        flow.step = 'phone';
        botSay('Nice to meet you, ' + flow.name + '. What’s your mobile? We’ll text you.');
      } else if (flow.step === 'phone') {
        if (text.replace(/\D/g, '').length < 8) { botSay('That number looks a bit short. Can you check it for me?'); return; }
        flow.phone = text.trim();
        flow.step = 'plan';
        botSay('Got it. And what are you most interested in?', KB.plans);
      } else if (flow.step === 'plan') {
        flow.plan = text.trim();
        var lead = { name: flow.name, phone: flow.phone, plan: flow.plan };
        flow = null;
        sendLead(lead);
        var q = KB.plans.indexOf(lead.plan) > -1 && lead.plan !== 'Not sure yet' ? lead.plan : 'Not sure';
        botSay('Legend, ' + lead.name + '. We’ll text you on ' + lead.phone.replace(/</g, '') + ' shortly, usually within the hour (Mon to Sat). Not sure what you need? <a href="quiz.html">Take the 1-minute quiz</a>', ['What do you offer?', 'How much does it cost?']);
      }
    };
    var send = function (text) {
      text = (text || '').trim();
      if (!text) return;
      addMsg('user', text);
      if (flow) { leadStep(text); return; }
      var it = KB.intents.filter(function (x) { return x.id === KB.chipMap[text]; })[0] || match(text);
      if (!it) { botSay(KB.fallback, KB.fallbackChips); return; }
      if (it.flow === 'lead') {
        if (saved.lead) { botSay('You’re already on the list, ' + saved.lead.name + '. We’ll text you on ' + saved.lead.phone.replace(/</g, '') + ' soon. Anything else I can help with?', ['What do you offer?', 'How much does it cost?']); return; }
        flow = { step: 'name' };
        botSay(it.answer + ' What’s your first name?');
        return;
      }
      botSay(it.answer, it.chips);
    };
    var open = function (on) {
      panel.hidden = !on;
      chat.classList.toggle('is-open', on);
      toggle.setAttribute('aria-expanded', String(on));
      toggle.setAttribute('aria-label', on ? 'Close chat' : 'Chat with us');
      teaser.hidden = true;
      if (on) {
        store.set('tb_chat_seen', true);
        if (!log.children.length) {
          if (saved.msgs.length) { saved.msgs.forEach(function (m) { addMsg(m[0], m[1], false); }); setChips(KB.start); }
          else botSay(KB.greeting, KB.start);
        }
        setTimeout(function () { scrollDown(); if (window.matchMedia('(pointer: fine)').matches) input.focus(); }, 60);
      }
    };
    toggle.addEventListener('click', function () { open(panel.hidden); });
    $('.tbchat__x', chat).addEventListener('click', function () { open(false); toggle.focus(); });
    $('.tbchat__teaser-open', chat).addEventListener('click', function () { open(true); });
    $('.tbchat__teaser-x', chat).addEventListener('click', function () { teaser.hidden = true; store.set('tb_chat_seen', true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); input.value = ''; });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { open(false); toggle.focus(); } });
    log.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth < 600) open(false);
    });
    if (!store.get('tb_chat_seen')) {
      setTimeout(function () { if (panel.hidden && !store.get('tb_chat_seen')) teaser.hidden = false; }, 9000);
    }
  }

  /* ---------- Home: start-to-finish journey ---------- */
  var jr = $('[data-jr]');
  if (jr) {
    var jrSteps = $$('.jr__step', jr);
    var runJr = function () {
      if (reduceMotion) { jr.classList.add('is-run', 'is-done'); jrSteps.forEach(function (st) { st.classList.add('is-on'); }); return; }
      jr.classList.add('is-run');
      jrSteps.forEach(function (st, i) { setTimeout(function () { st.classList.add('is-on'); }, 150 + i * 720); });
      setTimeout(function () { jr.classList.add('is-done'); }, 150 + jrSteps.length * 720);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { ob.disconnect(); runJr(); } }, { threshold: .3 }).observe(jr);
    else runJr();
  }

  /* ---------- Home: five suppliers vs one team ---------- */
  var cx = $('[data-cx]');
  if (cx) {
    var cxBtn = $('[data-cx-toggle]', cx), cxTouched = false;
    var cxCount = function (to) {
      $$('[data-cx-n]', cx).forEach(function (n, i) {
        var from = +n.textContent, step = from > to ? -1 : 1;
        if (from === to) return;
        if (reduceMotion) { n.textContent = to; return; }
        var t = setInterval(function () { var v = +n.textContent + step; n.textContent = v; if (v === to) clearInterval(t); }, 110 + i * 25);
      });
    };
    var cxSet = function (on) {
      cx.classList.toggle('is-with', on);
      cxBtn.setAttribute('aria-pressed', String(on));
      $('[data-cx-label]', cx).textContent = on ? 'Back to five suppliers' : 'Switch to one team';
      $('[data-cx-verdict]', cx).textContent = on ? 'One team in charge of getting you jobs. One bill, one report, one number to call.' : 'Nobody is in charge of getting you jobs.';
      $$('[data-one]', cx).forEach(function (l) { if (!l.dataset.many) l.dataset.many = l.textContent; setTimeout(function () { l.textContent = on ? l.dataset.one : l.dataset.many; }, on ? 450 : 0); });
      cxCount(on ? 1 : 5);
    };
    cxBtn.addEventListener('click', function () { cxTouched = true; cxSet(!cx.classList.contains('is-with')); });
    var cxAuto = function () { setTimeout(function () { if (!cxTouched) cxSet(true); }, reduceMotion ? 0 : 2200); };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { ob.disconnect(); cxAuto(); } }, { threshold: .45 }).observe(cx);
    else cxAuto();
  }

  /* ---------- Home: where tradies lose jobs ---------- */
  var lk = $('[data-lk]');
  if (lk) {
    var lkItems = $$('.lk-item', lk), lkBar = $('.lk-meter__bar i', lk);
    var lkFill = function (n) { lkBar.style.width = (20 + n * 20) + '%'; };
    var lkCount = function () {
      $$('[data-lk-n]', lk).forEach(function (b) {
        var to = +b.dataset.lkN, pre = b.dataset.pre || '', t0 = performance.now();
        (function f(now) { var p = Math.min(1, (now - t0) / 1100); b.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
      });
    };
    var runLk = function () {
      if (reduceMotion) {
        $$('[data-lk-n]', lk).forEach(function (b) { b.textContent = (b.dataset.pre || '') + b.dataset.lkN; });
        lkItems.forEach(function (it) { it.classList.add('is-fixed'); }); lkFill(4); lk.classList.add('is-run', 'is-done'); return;
      }
      lk.classList.add('is-run'); lkFill(0); lkCount();
      lkItems.forEach(function (it, i) { setTimeout(function () { it.classList.add('is-fixed'); lkFill(i + 1); }, 2600 + i * 900); });
      setTimeout(function () { lk.classList.add('is-done'); }, 2600 + lkItems.length * 900);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { ob.disconnect(); runLk(); } }, { threshold: .35 }).observe(lk);
    else runLk();
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
  var planEl = $('[data-plan]');
  var PLAN = planEl ? +planEl.getAttribute('data-plan').replace(/,/g, '') : 550;
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
          ? 'Reception is $' + PLAN + ' a month. <em>Win back one job and it’s paid for.</em>'
          : 'Reception is $' + PLAN + ' a month. <em>Win back ' + Math.ceil(PLAN / j) + ' jobs a month and it’s paid for.</em>';
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
      // Answers from the "What do I need?" quiz travel with the enquiry
      var quiz = store.get('tb_quiz');
      var qField = $('[name="quiz_summary"]', form);
      if (quiz && qField) {
        qField.value = quiz.summary || '';
        var t = $$('[name="trade"]', form).filter(function (r) { return r.value === quiz.trade; })[0]
          || $('[name="trade"][value="Other"]', form);
        if (t) t.checked = true;
        var note = $('[data-quiz-note]', form);
        if (note) { note.hidden = false; $('b', note).textContent = quiz.rec || 'your quiz answers'; }
      }
    };
    fillCarry();
    window.TB_fillCarry = fillCarry;
    // "What are you interested in?": bundle, separate services, or not sure
    var picker = $('[data-picker]', form);
    var pickMode = function () { var r = $('[name="start"]:checked', form); return r ? r.value : 'bundle'; };
    var updatePicker = function () {
      var mode = pickMode();
      $$('[data-panel]', picker).forEach(function (p) { p.hidden = p.dataset.panel !== mode && !(mode === 'bundle' && p.dataset.panel === 'services'); });
      $$('[name="plan"]', form).forEach(function (r) { r.disabled = mode !== 'bundle'; });
      $$('[name="services"]', form).forEach(function (c) { c.disabled = mode === 'unsure'; });
      var more = $('[data-more]', picker), anyExtra = $$('[name="services"]:checked', form).length > 0;
      var showList = mode !== 'bundle' || picker._more || anyExtra;
      more.hidden = mode !== 'bundle' || showList;
      $('[data-svc-note]', picker).hidden = !showList;
      $('.svc-picks', picker).hidden = !showList;
      $('[data-svc-note]', picker).textContent = mode === 'bundle' ? 'Extras on top of your bundle. Tick as many as you like.' : 'Separate services. Tick as many as you like.';
      var plan = $('[name="plan"]:checked', form), svcs = $$('[name="services"]:checked', form).map(function (c) { return c.value; });
      var parts = mode === 'unsure' ? [] : (mode === 'bundle' && plan ? [plan.value + ' bundle'] : []).concat(svcs);
      $('[data-pick-sum]', picker).innerHTML = parts.length ? 'You\u2019ve picked: <b>' + parts.join(' + ') + '</b>' : '';
    };
    $('[data-more]', picker).addEventListener('click', function () { picker._more = true; updatePicker(); var first = $('[name="services"]', form); if (first) first.focus(); });
    $$('[name="start"], [name="plan"], [name="services"]', form).forEach(function (el) { el.addEventListener('change', function () { setError(picker, ''); updatePicker(); }); });
    var fillBook = function (query) {
      var q = new URLSearchParams(query || location.search), plan = q.get('plan'), svc = q.get('service'), start = q.get('start');
      var setStart = function (v) { var r = $('[name="start"][value="' + v + '"]', form); if (r) r.checked = true; };
      if (plan === 'Not sure') setStart('unsure');
      else if (plan) { var p = $$('[name="plan"]', form).filter(function (r) { return r.value === plan; })[0]; if (p) { p.checked = true; setStart('bundle'); } }
      var svcList = (q.get('services') || svc || '').split(',').filter(Boolean);
      svcList.forEach(function (k) { var c = $('[data-svc="' + k + '"]', form); if (c) c.checked = true; });
      if (svcList.length && !(plan && plan !== 'Not sure')) setStart('services');
      if (start) setStart(start);
      updatePicker();
    };
    window.TB_fillBook = fillBook;

    var setError = function (field, msg) {
      var wrap = field.closest('.field');
      var err = $('.field__error', wrap);
      wrap.classList.toggle('has-error', !!msg);
      if (err) err.textContent = msg || '';
    };
    fillBook();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (pickMode() === 'services' && !$$('[name="services"]:checked', form).length) {
        setError(picker, 'Tick at least one service, or choose a bundle.');
        picker.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        ok = false;
      }
      [['name', 'Pop your name in so I know who to ask for.'], ['business', 'What’s the business called?'], ['phone', 'I need your mobile so we can text you.']].forEach(function (pair) {
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
        var pref = form.elements.contact_pref ? form.elements.contact_pref.value : 'Text me';
        store.set('tb_lead', { name: form.elements.name.value.trim().split(' ')[0], pref: pref });
        if (window.TB_go) window.TB_go('thanks.html'); else location.href = 'thanks.html';
      };
      if (!endpoint) { done(); return; }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Text me';
          status.textContent = 'That didn’t send. Check your connection and try again, or email ' + form.dataset.email + '.';
        });
    });
  }

  /* ---------- SEO onboarding form ---------- */
  var ob = $('#onboard-form');
  if (ob) {
    var OB_KEY = 'tb_seo_onboarding';
    var lsGet = function () { try { return JSON.parse(localStorage.getItem(OB_KEY)) || {}; } catch (e) { return {}; } };
    var lsSet = function (v) { try { localStorage.setItem(OB_KEY, JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
    var obFields = $$('input, textarea, select', ob).filter(function (el) { return el.name && el.type !== 'hidden'; });
    var textFields = obFields.filter(function (el) { return el.tagName === 'TEXTAREA' || /^(text|email|tel)$/.test(el.type); });
    var saveDraft = function () {
      var d = {};
      obFields.forEach(function (el) {
        if (el.type === 'radio') { if (el.checked) d[el.name] = el.value; }
        else if (el.type === 'checkbox') { if (el.checked) (d[el.name] = d[el.name] || []).push(el.value); }
        else d[el.name] = el.value;
      });
      lsSet(d);
    };
    var loadDraft = function () {
      var d = lsGet();
      obFields.forEach(function (el) {
        if (!(el.name in d)) return;
        var v = d[el.name];
        if (el.type === 'radio') el.checked = v === el.value;
        else if (el.type === 'checkbox') el.checked = [].concat(v).indexOf(el.value) > -1;
        else el.value = v;
      });
    };
    // Which services the client is on: bundles + separate services, each with data-svcs keys
    var picks = $$('[data-ob-pick] input[data-svcs]', ob);
    var chosen = function () {
      var set = {};
      picks.forEach(function (c) { if (c.checked) c.dataset.svcs.split(' ').forEach(function (k) { set[k] = true; }); });
      return set;
    };
    // Show only sections and questions for the chosen services; hidden ones are disabled so they aren't sent
    var applyServices = function () {
      var set = chosen(), any = Object.keys(set).length > 0;
      $$('[data-for]', ob).forEach(function (el) {
        var on = any && el.dataset.for.split(' ').some(function (k) { return set[k]; });
        el.hidden = !on;
      });
      $$('input, textarea, select', ob).forEach(function (el) {
        if (el.type === 'hidden' || el.closest('[data-ob-pick]')) return;
        el.disabled = !!el.closest('[data-for][hidden]');
      });
      var names = picks.filter(function (c) { return c.checked; }).map(function (c) { return c.name === 'bundles' ? c.value + ' bundle' : c.value; });
      $('[data-ob-sum]', ob).innerHTML = names.length ? 'Setting up: <b>' + names.join(' + ') + '</b>' : 'Tick what you signed up for and the form will show only the questions you need.';
      ob.elements.services_summary.value = names.join(', ');
    };
    // Prefill from the link: onboarding.html?plan=Growth,Visibility&services=seo,meta-ads
    (function () {
      var q = new URLSearchParams(location.search), plans = (q.get('plan') || '').toLowerCase().split(','), svcs = (q.get('services') || q.get('service') || '').toLowerCase().split(',');
      var hit = false;
      picks.forEach(function (c) {
        if ((c.name === 'bundles' && plans.indexOf(c.value.toLowerCase()) > -1) || (c.name === 'services_picked' && svcs.indexOf(c.dataset.svcs) > -1)) { c.checked = true; hit = true; }
      });
      if (hit) { $('[data-ob-pre]', ob).hidden = false; ob._prefilled = true; }
    })();
    var reveal = function () {
      $$('[data-when]', ob).forEach(function (box) {
        var trigger = $('[data-show="' + box.dataset.when + '"]', ob);
        box.hidden = !(trigger && trigger.checked && !trigger.disabled);
      });
    };
    var progress = function () {
      var live = textFields.filter(function (el) { return !el.disabled; });
      var filled = live.filter(function (el) { return el.value.trim(); }).length;
      var pct = live.length ? Math.round(filled / live.length * 100) : 0;
      var bar = $('[data-ob-bar]'), num = $('[data-ob-pct]');
      if (bar) bar.style.width = pct + '%';
      if (num) num.textContent = pct + '%';
    };
    var obError = function (el, msg) {
      var wrap = el.closest('.field');
      if (!wrap) return;
      wrap.classList.toggle('has-error', !!msg);
      var err = $('.field__error', wrap);
      if (err) err.textContent = msg || '';
    };
    var prefilled = ob._prefilled ? picks.map(function (c) { return c.checked; }) : null;
    loadDraft();
    if (prefilled) picks.forEach(function (c, i) { c.checked = prefilled[i]; }); // the link you sent wins over an old draft
    applyServices(); reveal(); progress();
    ob.addEventListener('input', function (e) { obError(e.target, ''); progress(); saveDraft(); });
    ob.addEventListener('change', function (e) {
      if (e.target.type === 'checkbox') obError(e.target, '');
      if (e.target.dataset.svcs) applyServices();
      reveal(); progress(); saveDraft();
    });

    ob.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      var pickBox = $('[data-ob-pick]', ob);
      var noPick = !picks.some(function (c) { return c.checked; });
      pickBox.classList.toggle('has-error', noPick);
      $(':scope > .field__error', pickBox).textContent = noPick ? 'Tick at least one bundle or service.' : '';
      if (noPick) first = picks[0];
      [
        ['contact_name', 'Pop your name in.'],
        ['business_name', 'What’s the business called?'],
        ['business_phone', 'We need the number customers call.'],
        ['business_email', 'We need an email for the business.'],
        ['services', 'List at least one service.'],
        ['base_suburb', 'Which suburb are you based in?'],
        ['agree', 'Tick this so we can manage your listings.']
      ].forEach(function (pair) {
        var el = ob.elements[pair[0]], msg = pair[1];
        var bad = el.type === 'checkbox' ? !el.checked : !el.value.trim();
        if (!bad && pair[0] === 'business_phone' && el.value.replace(/\D/g, '').length < 8) { bad = true; msg = 'That number looks a bit short.'; }
        if (!bad && pair[0] === 'business_email' && !/^\S+@\S+\.\S+$/.test(el.value.trim())) { bad = true; msg = 'That email doesn’t look right.'; }
        obError(el, bad ? msg : '');
        if (bad && !first) first = el;
      });
      if (first) { first.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); first.focus({ preventScroll: true }); return; }

      var btn = $('button[type="submit"]', ob), status = $('.form__status', ob), endpoint = ob.dataset.endpoint;
      var done = function () {
        var box = $('[data-ob-done]');
        $('[data-ob-name]', box).textContent = ob.elements.contact_name.value.trim().split(' ')[0] || 'mate';
        $('[data-ob-unconnected]', box).hidden = !!endpoint;
        ob.hidden = true;
        var prog = $('.ob-progress'); if (prog) prog.hidden = true;
        box.hidden = false;
        box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        box.focus({ preventScroll: true });
        if (endpoint) { try { localStorage.removeItem(OB_KEY); } catch (err) { /* ignore */ } }
      };
      if (!endpoint) { done(); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      var fd = new FormData(ob);
      fd.set('_subject', 'Onboarding: ' + ob.elements.business_name.value.trim() + ' (' + ob.elements.services_summary.value + ')');
      fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          btn.disabled = false; btn.textContent = 'Send my details';
          status.textContent = 'That didn’t send. Your answers are saved, so check your connection and try again, or email ' + ob.dataset.email + '.';
        });
    });
  }

  /* ---------- "What do I need?" quiz ---------- */
  function initQuiz() {
    var qz = $('[data-quiz]');
    if (!qz || qz._ready) return;
    qz._ready = true;
    var P = {};
    try { P = JSON.parse(($('#qz-prices') || {}).textContent || '{}'); } catch (e) { P = {}; }
    var num = function (v) { return parseFloat(String(v || '0').replace(/,/g, '')) || 0; };
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-AU'); };
    var adMo = function (perDay) { return Math.round(num(perDay) * 30.4 / 10) * 10; };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var steps = $$('.qz-step', qz), answers = {}, idx = 0;
    var bar = $('[data-qz-bar]', qz), count = $('[data-qz-count]', qz), back = $('[data-qz-back]', qz), result = $('[data-qz-result]', qz);

    // Steps with data-if only show when that problem was ticked
    var active = function (s) { var c = s.getAttribute('data-if'); return !c || (answers.problems || []).indexOf(c) > -1; };
    var activeList = function () { return steps.filter(active); };
    var refreshNext = function (s) {
      var next = $('[data-qz-next]', s);
      if (next && !s.hasAttribute('data-optional')) next.disabled = !(answers[s.dataset.step] || []).length;
    };
    var paint = function (s) {
      var key = s.dataset.step, multi = s.hasAttribute('data-multi'), val = answers[key];
      $$('.qz-opts button', s).forEach(function (b) {
        var on = multi ? (val || []).indexOf(b.dataset.v) > -1 : val === b.dataset.v;
        b.classList.toggle('is-picked', on);
        if (multi) b.setAttribute('aria-pressed', String(on));
      });
      refreshNext(s);
    };
    var show = function (i) {
      idx = i;
      var list = activeList(), pos = list.indexOf(steps[i]);
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      result.hidden = true;
      bar.style.width = (pos / list.length * 100) + '%';
      count.textContent = 'Question ' + (pos + 1) + ' of ' + list.length;
      count.hidden = false;
      back.hidden = pos === 0;
      paint(steps[i]);
      var head = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 64;
      if (qz.getBoundingClientRect().top < head) qz.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };
    var advance = function (i) {
      for (var k = i + 1; k < steps.length; k++) if (active(steps[k])) return show(k);
      finish();
    };
    var goBack = function () {
      if (!result.hidden) { for (var k = steps.length - 1; k >= 0; k--) if (active(steps[k])) return show(k); }
      for (var j = idx - 1; j >= 0; j--) if (active(steps[j])) return show(j);
    };

    var VISUAL = ['Landscaping', 'Building', 'Concreting', 'Painting', 'Roofing'];
    var PERSON = { Excavation: 'excavation contractor', Plumbing: 'plumber', Electrical: 'electrician', Building: 'builder', Landscaping: 'landscaper', Concreting: 'concreter', Roofing: 'roofer', Painting: 'painter' };
    var tradeWord = function () { return PERSON[answers.trade] || 'tradie'; };
    var workWord = function () { return answers.trade && answers.trade !== 'Other' ? answers.trade.toLowerCase() + ' work' : 'your work'; };

    // Everything we might recommend: price, how it helps, what's included
    var INFO = {
      gads: function (a) { var big = a.budget === 'top'; return { name: 'Google Ads (' + (big ? 'Standard' : 'Starter') + ')', mo: num(big ? P.gads : P.gadsStarter), ad: adMo(P.gMin), adWho: 'Google', svc: 'google-ads',
        how: 'Your ad shows at the top of Google when locals search for things like "' + tradeWord() + ' near me". These people need the job done now, and you only pay when someone clicks or calls.',
        inc: ['Campaign built around your services and suburbs', 'Ads written for you', 'Junk searches blocked so you don’t pay for them', 'Call and quote tracking, so you see what each job cost', 'Monthly report'] }; },
      meta: function () { return { name: 'Meta ads (Facebook and Instagram)', mo: num(P.meta), ad: adMo(P.adMin), adWho: 'Meta', svc: 'meta-ads',
        how: 'Your best jobs shown to homeowners in your area as they scroll, so you’re the first ' + tradeWord() + ' they think of when they need one.',
        inc: ['Video and photo ads made from your jobs', 'Shown only to people in your suburbs', 'Enquiry forms that come straight to your phone', 'Monthly report'] }; },
      receptionist: function () { return { name: 'AI receptionist', mo: num(P.rec), svc: 'ai-receptionist',
        how: 'When you can’t pick up, the AI answers in a natural voice, works out what the customer needs, books the job or quote visit, and texts you the details.',
        inc: ['Answers 24/7, including after hours', 'Books jobs and quote visits into your calendar', 'Texts you a summary of every call', 'Knows your services, areas and prices'] }; },
      seo: function () { return { name: 'SEO and Google profile', mo: num(P.seo), svc: 'seo',
        how: 'We get your Google profile and website showing when people in your suburbs search for a ' + tradeWord() + ', so enquiries come in without paying per click.',
        inc: ['Google Business Profile set up and managed', 'A page for each service and suburb', 'Listings on the main directories', 'Weekly Google posts', 'Monthly report: rankings, calls and enquiries'] }; },
      website: function () { return { name: 'New website', once: num(P.website), mo: num(P.webCare), moLabel: 'website care', svc: 'websites',
        how: 'A fast, mobile-friendly site that shows off your best work and makes it dead easy to call you or ask for a quote. Ongoing care keeps it running and up to date.',
        inc: ['Mobile-first and fast', 'Quote form and click-to-call', 'Photo gallery and reviews', 'Set up for Google from day one', 'Ongoing care: hosting, security, updates, chatbot and small edits'] }; },
      branding: function () { return { name: 'Branding', once: num(P.brand), svc: 'branding',
        how: 'A logo and look that makes you look established everywhere customers see you: your ute, uniforms, quotes and online.',
        inc: ['Logo and brand kit (colours, fonts)', 'Ute signage design', 'Uniform design', 'Business card design'] }; },
      crm: function () { return { name: 'CRM and follow-ups', mo: num(P.follow), svc: 'crm',
        how: 'Every enquiry in one place. Quotes get followed up automatically and happy customers are asked for a review after every job.',
        inc: ['All your leads in one simple pipeline', 'Automatic quote follow-up texts', 'Review requests after each job', 'Appointment reminders'] }; },
      reviews: function () { return { name: 'Review requests', mo: num(P.reviews), svc: 'crm',
        how: 'After each job, your customer gets a friendly text asking for a Google review, with a direct link. More reviews means more trust and better rankings.',
        inc: ['Automatic review text after every job', 'Direct link to your Google review page', 'A gentle reminder if they forget'] }; }
    };
    var BUNDLES = [
      { k: 'growth', name: 'Growth bundle', covers: ['gads', 'meta', 'receptionist', 'crm', 'reviews'], anyOf: ['gads', 'meta'], min: 2, budget: ['top'],
        mo: function () { return num(P.growth); }, ad: function () { return adMo(P.gMin) + adMo(P.adMin); }, adWho: 'Google and Meta',
        how: 'Brings in new enquiries from Google and Facebook, then makes sure none slip through: every lead answered, called back within a minute and followed up.',
        inc: ['Google Ads and Meta ads, managed for you', 'AI lead caller rings new leads within a minute', 'AI receptionist answers every call', 'CRM with quote follow-ups and review requests'] },
      { k: 'foundation', name: 'Foundation bundle', covers: ['website', 'branding'], min: 2,
        once: function () { return num(P.foundation); }, mo: function () { return num(P.webCare); }, moLabel: 'website care (first 3 months free)',
        how: 'Your brand and website designed together, so you look as good as your work everywhere, for less than buying them separately.',
        inc: ['Logo, brand kit, ute and uniform designs', 'A website built to win work (upgradeable)', 'AI chatbot on your site, answering 24/7', 'Ongoing website care: hosting, security, updates and small edits'] },
      { k: 'reception', name: 'Reception bundle', covers: ['receptionist', 'crm', 'reviews'], anyOf: ['receptionist'], min: 2,
        mo: function () { return num(P.reception); },
        how: 'Every call and website enquiry answered, even when you’re on the tools, and every quote followed up automatically.',
        inc: ['AI receptionist answers and books calls 24/7', 'AI chatbot answers website visitors', 'CRM with quote follow-ups and review requests'] },
      { k: 'visibility', name: 'Visibility bundle', covers: ['seo', 'reviews', 'crm'], anyOf: ['seo'], min: 2,
        mo: function () { return num(P.visibility); },
        how: 'Gets you ranking on Google with your profile, suburb pages and a steady flow of new reviews, with your website looked after.',
        inc: ['SEO and Google profile, managed for you', 'Automatic review requests', 'Website care and updates'] }
    ];

    var plan = function (a) {
      var probs = a.problems || [], have = a.have || [], needs = [], why = {}, also = [];
      var add = function (n, reason) { if (needs.indexOf(n) < 0) needs.push(n); (why[n] = why[n] || []).push(reason); };
      if (probs.indexOf('leads') > -1) {
        var ch = a.adsWhere || 'unsure', visual = VISUAL.indexOf(a.trade) > -1, top = a.budget === 'top';
        var g = ch === 'google' || ch === 'both' || (ch === 'unsure' && (!visual || top));
        var m = ch === 'meta' || ch === 'both' || (ch === 'unsure' && (visual || top));
        if (g) add('gads', ch === 'google' || ch === 'both' ? 'You want more enquiries from Google.' : 'You want more enquiries, and Google puts you in front of people searching for a ' + tradeWord() + ' right now.');
        if (m) add('meta', ch === 'meta' || ch === 'both' ? 'You want more enquiries from Facebook and Instagram.' : 'You want more enquiries, and ' + workWord() + ' looks great in photos and video, so Facebook and Instagram suit you.');
      }
      if (probs.indexOf('missed') > -1) add('receptionist', 'You’re missing calls while you’re working, and every missed call is a job going to someone else.');
      if (probs.indexOf('google') > -1) add('seo', 'People can’t find you on Google.');
      if (probs.indexOf('website') > -1) add('website', 'You said your website is missing or holding you back.');
      if (probs.indexOf('look') > -1) add('branding', 'You want your business to look more professional.');
      if (probs.indexOf('followup') > -1) add('crm', 'Your quotes are going cold.');
      if (probs.indexOf('reviews') > -1) add('reviews', 'You need more Google reviews.');
      var hasSite = have.indexOf('site-good') > -1 || have.indexOf('site-old') > -1;
      if (!hasSite) add('website', 'You don’t have a website yet, and customers check one before they call.');
      if (needs.indexOf('website') > -1 && have.indexOf('logo') < 0) add('branding', 'You don’t have a logo yet, and your new website should match your brand.');
      if (needs.indexOf('crm') > -1 && needs.indexOf('reviews') > -1) { why.crm = why.crm.concat(why.reviews); needs.splice(needs.indexOf('reviews'), 1); }
      if (have.indexOf('site-old') > -1 && needs.indexOf('website') < 0) also.push('Your website might be holding you back too. A new one starts from ' + fmt(num(P.website)) + ' to build, plus ' + fmt(num(P.webCare)) + '/month care.');
      if (have.indexOf('gbp') < 0 && needs.indexOf('seo') < 0) also.push('No Google Business Profile yet? That’s the quickest free win on Google. It’s included in SEO and the Visibility bundle.');
      if (have.indexOf('software') > -1 && needs.indexOf('crm') > -1) also.push('Already using job software? We’ll connect follow-ups to it rather than replace it.');
      if ((needs.indexOf('gads') > -1 || needs.indexOf('meta') > -1) && a.budget === 'low') also.push('Ads need at least $' + num(P.gMin) + ' a day (about ' + fmt(adMo(P.gMin)) + ' a month) in ad spend on top of our fee. On a tight budget, starting with SEO or the AI receptionist can be a better first step.');
      if (!needs.length) add(a.budget === 'low' ? 'reviews' : 'seo', 'A good first step for any trade business.');

      var left = needs.slice(), rows = [], chosen = [];
      BUNDLES.forEach(function (b) {
        if (b.budget && b.budget.indexOf(a.budget) < 0) return;
        if (b.anyOf && !b.anyOf.some(function (n) { return left.indexOf(n) > -1; })) return;
        var hit = b.covers.filter(function (n) { return left.indexOf(n) > -1; });
        if (hit.length < b.min) return;
        chosen.push(b);
        var reasons = [];
        hit.forEach(function (n) { (why[n] || []).forEach(function (r) { if (reasons.indexOf(r) < 0) reasons.push(r); }); });
        rows.push({ name: b.name, mo: b.mo ? b.mo() : 0, once: b.once ? b.once() : 0, ad: b.ad ? b.ad() : 0, adWho: b.adWho, moLabel: b.moLabel, note: b.note, how: b.how, inc: b.inc, why: reasons, plan: b.name.replace(' bundle', '') });
        left = left.filter(function (n) { return hit.indexOf(n) < 0; });
      });
      left.forEach(function (n) { var it = INFO[n](a); it.why = why[n] || []; rows.push(it); });
      return { rows: rows, bundles: chosen, also: also };
    };

    var priceOf = function (r) {
      var parts = [];
      if (r.once) parts.push(fmt(r.once) + ' to build');
      if (r.mo) parts.push(fmt(r.mo) + '/month' + (r.moLabel ? ' ' + r.moLabel : ''));
      if (r.ad) parts.push('about ' + fmt(r.ad) + '/month ad spend (paid to ' + r.adWho + ')');
      return parts.join(' + ') + (r.note ? ' ' + r.note : '');
    };
    var finish = function () {
      var p = plan(answers), rows = p.rows;
      var mo = rows.reduce(function (s, r) { return s + (r.mo || 0); }, 0);
      var once = rows.reduce(function (s, r) { return s + (r.once || 0); }, 0);
      var ad = rows.reduce(function (s, r) { return s + (r.ad || 0); }, 0);
      var single = rows.length === 1;
      var short = function (n) { return n.replace(' bundle', '').replace(/ \((Starter|Standard)\)/, '').replace(' (Facebook and Instagram)', '').replace(' and Google profile', '').replace(' and follow-ups', ''); };
      $('[data-r-eyebrow]', result).textContent = single ? 'We’d recommend' : 'Your custom plan';
      $('[data-r-name]', result).textContent = single ? rows[0].name : rows.length <= 3 ? rows.map(function (r) { return short(r.name); }).join(' + ') : short(rows[0].name) + ' + ' + (rows.length - 1) + ' more';
      $('[data-r-why]', result).textContent = single ? 'Here’s why it suits you, how it helps, and what you get:' : 'Based on everything you ticked, here’s what we’d put together for your business, and why:';
      $('[data-r-items]', result).innerHTML = rows.map(function (r) {
        return '<li class="qz-item"><div class="qz-item__head"><b>' + esc(r.name) + '</b><em>' + esc(priceOf(r)) + '</em></div>' +
          (r.why && r.why.length ? '<p class="qz-item__why"><span>Why you need it:</span> ' + esc(r.why.join(' ')) + '</p>' : '') +
          '<p class="qz-item__how"><span>How it helps:</span> ' + esc(r.how) + '</p>' +
          '<p class="qz-item__inc-h">What’s included:</p><ul class="checks checks--sm qz-item__inc">' + r.inc.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></li>';
      }).join('');
      var bandMax = { low: 500, mid: 1500, high: 3000, top: Infinity }[answers.budget] || Infinity;
      var totalHtml = '<p><b>' + (single ? 'Our fee:' : 'Our fees:') + '</b> ' + [once ? fmt(once) + ' to build' : '', mo ? fmt(mo) + '/month' : ''].filter(Boolean).join(' + ') + '</p>';
      if (ad) totalHtml += '<p class="qz-total__allup"><b>All up, including ad spend:</b> about ' + fmt(mo + ad) + '/month' + (once ? ' + ' + fmt(once) + ' to build' : '') + '</p>';
      if (p.bundles.length > 1) totalHtml += '<p class="qz-total__save">Two bundles? You get 10% off the second one.</p>';
      var hasWeb = rows.some(function (r) { return r.svc === 'websites' || r.plan === 'Foundation'; });
      if (mo + ad > bandMax && rows.length === 1) totalHtml += '<p class="qz-total__tip">That\u2019s a bit more than you said you\u2019d spend each month. Text us and we\u2019ll work out the best way to start within your budget.</p>';
      totalHtml += '<p class="qz-total__fine">Setup fees are extra where they apply. Ad spend is paid straight to Google or Meta, from $' + num(P.gMin) + ' a day, and you can raise it any time.' + (hasWeb ? ' Websites always include ongoing care at ' + fmt(num(P.webCare)) + '/month.' : '') + ' We’ll confirm exact pricing by text.</p>';
      if (mo + ad > bandMax && rows.length > 1) {
        var first = rows.filter(function (r) { return r.mo; }).sort(function (x, y) { return (x.mo + (x.ad || 0)) - (y.mo + (y.ad || 0)); })[0];
        if (first) totalHtml += '<p class="qz-total__tip">That’s more than you said you’d spend each month, so start with <b>' + esc(first.name) + '</b> and add the rest as the work comes in.</p>';
      }
      $('[data-r-total]', result).innerHTML = totalHtml;
      var alsoEl = $('[data-r-also]', result);
      alsoEl.textContent = p.also.slice(0, 2).join(' ');
      alsoEl.hidden = !p.also.length;

      var planName = p.bundles.length ? rows[0].plan : '';
      var svcs = [];
      rows.forEach(function (r) { if (r.svc && svcs.indexOf(r.svc) < 0) svcs.push(r.svc); });
      var q = [];
      if (planName) q.push('plan=' + encodeURIComponent(planName));
      if (svcs.length) q.push('services=' + svcs.join(','));
      $('[data-r-go]', result).setAttribute('href', 'book.html' + (q.length ? '?' + q.join('&') : ''));
      $('[data-r-more]', result).setAttribute('href', p.bundles.length ? 'bundles.html' : 'services.html');
      $('[data-r-more]', result).textContent = p.bundles.length ? 'Compare bundles' : 'See all services';

      var label = function (key) {
        var s = $('[data-step="' + key + '"]', qz), v = answers[key];
        if (!s || !active(s)) return 'n/a';
        var names = [].concat(v || []).map(function (x) { var b = $$('.qz-opts button', s).filter(function (bt) { return bt.dataset.v === x; })[0]; return b ? ($('b', b) || b).textContent.trim() : x; });
        return names.join(', ') || 'none';
      };
      var planText = rows.map(function (r) { return r.name; }).join(' + ');
      store.set('tb_quiz', { trade: answers.trade, rec: planText, summary: 'Quiz plan: ' + planText + '. Trade: ' + label('trade') + '. Problems: ' + label('problems') + '. Ads from: ' + label('adsWhere') + '. Has: ' + label('have') + '. Wants: ' + label('jobs') + '. Budget: ' + label('budget') + '.' });

      steps.forEach(function (s) { s.hidden = true; });
      bar.style.width = '100%';
      count.hidden = true;
      back.hidden = false;
      result.hidden = false;
      result.focus({ preventScroll: true });
      qz.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    steps.forEach(function (s, i) {
      var multi = s.hasAttribute('data-multi'), key = s.dataset.step;
      $$('.qz-opts button', s).forEach(function (b) {
        b.addEventListener('click', function () {
          if (multi) {
            var list = (answers[key] || []).slice(), at = list.indexOf(b.dataset.v);
            if (at > -1) list.splice(at, 1); else list.push(b.dataset.v);
            if (b.dataset.v === 'site-good' || b.dataset.v === 'site-old') {
              var other = b.dataset.v === 'site-good' ? 'site-old' : 'site-good', o = list.indexOf(other);
              if (o > -1 && at < 0) list.splice(o, 1);
            }
            answers[key] = list;
            paint(s);
          } else {
            answers[key] = b.dataset.v;
            paint(s);
            setTimeout(function () { advance(i); }, reduceMotion ? 0 : 160);
          }
        });
      });
      var next = $('[data-qz-next]', s);
      if (next) next.addEventListener('click', function () { if (!next.disabled) advance(i); });
    });
    back.addEventListener('click', goBack);
    $('[data-qz-restart]', qz).addEventListener('click', function () { answers = {}; show(0); });
    show(0);
  }
  initQuiz();
  window.TB_initQuiz = initQuiz;

  /* ---------- Thanks page ---------- */
  function fillThanks() {
    var thanks = $('[data-thanks]');
    if (!thanks) return;
    var lead = store.get('tb_lead');
    if (lead && lead.name) $('[data-thanks-name]').textContent = lead.name;
    var how = $('[data-thanks-how]');
    if (how && lead && lead.pref === 'Call me') how.textContent = 'give you a call';
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

  /* ---------- Bundles picker ---------- */
  $$('.pick').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var scope = btn.closest('main') || document;
      var cards = $('[data-bcards]', scope);
      var on = btn.getAttribute('aria-pressed') !== 'true';
      $$('.pick', scope).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      $$('.bcard', scope).forEach(function (c) { c.classList.remove('is-picked'); });
      if (cards) cards.classList.toggle('has-pick', on);
      if (!on) return;
      btn.setAttribute('aria-pressed', 'true');
      var card = $('[data-bundle="' + btn.getAttribute('data-pick') + '"]', scope);
      if (!card) return;
      card.classList.add('is-picked');
      card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: window.innerWidth < 1081 ? 'start' : 'center' });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var REVEAL = ['.section-head > *', '.page-hero__inner > p', '.hero__copy > p', '.hero__copy > .btn-row', '.phone-wrap',
    '.flow__step', '.example', '.setup-note', '.svc', '.plan', '.plans-note', '.calc__inputs .range', '.calc__out', '.calc__note',
    '.faq-group', '.story-hero .photo-ph', '.story-hero > div > p', '.prose > *', '.ba__col', '.maker > *', '.demo__copy > *',
    '.form', '.nexts li', '.side-card', '.cta-strip__inner > *', '.sources', '.center-page__inner > *',
    '.srv__copy', '.srv__msg', '.srv-cta', '.journey', '.option', '.lock', '.area', '.minibundle', '.svc-group__head', '.svc-card', '.notsure > *', '.problem__grid > h2', '.problem__pts li', '.svc-get__list', '.svc-get__ex', '.shot', '.logo-card', '.ute-card', '.bizcard-card', '.fbad', '.bundle', '.combo', '.custom', '.bundle-in', '.auto', '.svc-hero__ico', '.pain', '.cost', '.change__col', '.change__arrow', '.result', '.value', '.facts-row li', '.story-top__photo', '.signoff > *', '.story-quote .signature', '.handle__col', '.duty__col', '.price-block > *', '.hiw-jump', '.more__copy > *', '.more__flow', '.lh-card', '.leads-offer > *', '.pipe__text', '.leads-hero .btn-row', '.pick', '.bcard', '.hs-band__copy > *', '.addon', '.src3__card', '.inbox', '.cx-map', '.cx-side', '.sys'];
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
      var tg = $('[data-toggle]', r); tg.setAttribute('aria-pressed', 'false'); tg.classList.remove('is-ready'); $('[data-toggle-label]', r).textContent = 'Turn on your AI receptionist';
      $('[data-after]', r).classList.remove('is-in'); r._switched = false; r._userToggled = false;
    },
    add: function (r, c) {
      var n = document.createElement('div'); n.className = 'n2';
      n.innerHTML = '<span class="n2__ico"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></span><div class="n2__txt"><b></b><span></span></div><time></time>';
      $('.n2__txt b', n).textContent = c[1]; $('.n2__txt span', n).textContent = c[2]; $('time', n).textContent = c[0];
      n._ok = c; $('[data-list]', r).appendChild(n);
    },
    switchOn: async function (r, tok) {
      if (r._switched) return; r._switched = true;
      var tg = $('[data-toggle]', r); tg.classList.remove('is-ready'); tg.setAttribute('aria-pressed', 'true'); $('[data-toggle-label]', r).textContent = 'AI receptionist on. Tap to turn off';
      var ns = $$('.n2', r);
      try {
        for (var i = 0; i < ns.length; i++) {
          await sleep(260, tok);
          if (!r._switched) return;
          ns[i].classList.add('is-ok'); $('.n2__txt b', ns[i]).textContent = ns[i]._ok[3]; $('.n2__txt span', ns[i]).textContent = ns[i]._ok[4];
        }
      } catch (e) { return; }
      $('[data-missed]', r).textContent = '0'; $('[data-after]', r).classList.add('is-in');
    },
    switchOff: function (r) {
      r._switched = false;
      $('[data-toggle]', r).setAttribute('aria-pressed', 'false'); $('[data-toggle-label]', r).textContent = 'Turn on your AI receptionist';
      $$('.n2', r).forEach(function (n) { n.classList.remove('is-ok'); $('.n2__txt b', n).textContent = n._ok[1]; $('.n2__txt span', n).textContent = n._ok[2]; });
      $('[data-missed]', r).textContent = $$('.n2', r).length;
      $('[data-after]', r).classList.remove('is-in');
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
      if (!r._userToggled) await CP.pileup.switchOn(r, tok);
    },
    init: function (r, run) {
      $('[data-toggle]', r).addEventListener('click', function () {
        r._userToggled = true;
        var have = $$('.n2', r).length;
        if (have < CALLS.length) {
          // Clicked before the day finished: stop the clock and show the full day.
          run.tok.dead = true;
          CALLS.slice(have).forEach(function (c) { CP.pileup.add(r, c); });
          $('[data-time]', r).textContent = '17:00';
          $('[data-toggle]', r).classList.remove('is-ready');
        }
        if (r._switched) CP.pileup.switchOff(r); else CP.pileup.switchOn(r, { dead: false });
      });
    },
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

  // Compare sliders (websites before/after, branding): drag anywhere with mouse or finger,
  // or focus the slider and use the arrow keys.
  $$('[data-cmp]').forEach(function (c) {
    var range = $('.cmp__range', c), dragging = false;
    var setX = function (v) { v = Math.max(0, Math.min(100, v)); range.value = v; c.style.setProperty('--x', v + '%'); };
    var fromEvent = function (e) { var b = c.getBoundingClientRect(); setX((e.clientX - b.left) / b.width * 100); };
    c.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      dragging = true; c._touched = true; c.classList.add('is-dragging');
      try { c.setPointerCapture(e.pointerId); } catch (err) {}
      fromEvent(e); e.preventDefault();
    });
    c.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    var stop = function () { dragging = false; c.classList.remove('is-dragging'); };
    c.addEventListener('pointerup', stop);
    c.addEventListener('pointercancel', stop);
    range.addEventListener('input', function () { c._touched = true; setX(+range.value); });
  });
  var sweep = async function (c) {
    if (reduceMotion || c._touched) return;
    var range = $('.cmp__range', c), tok = { dead: false };
    var to = function (v, ms) { return new Promise(function (res) { var a = +range.value, t0 = performance.now(); (function f(now) { if (c._touched) return res(); var p = Math.min(1, (now - t0) / ms), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; range.value = a + (v - a) * e; c.style.setProperty('--x', range.value + '%'); p < 1 ? requestAnimationFrame(f) : res(); })(t0); }); };
    await to(85, 1100); await to(15, 1400); await to(50, 900);
  };

  // 10. AI job finder: approvals sorted by trade
  var APPROVALS = [
    ['14 Smith St, Kellyville', 'New two-storey home', 'Builder Landscaper Concreter Fencer Electrician Plumber Excavator'],
    ['8 Oak Ave, Castle Hill', 'Removal of two trees', ''],
    ['31 Hill Cres, Rouse Hill', 'Granny flat', 'Builder Landscaper Concreter Electrician Plumber Excavator'],
    ['5 Main St, Norwest', 'Shop signage', ''],
    ['22 Park Rd, Baulkham Hills', 'In-ground pool and retaining walls', 'Landscaper Concreter Pool builder Fencer Electrician Excavator'],
    ['9 River Rd, Beaumont Hills', 'Rear extension and deck', 'Builder Concreter Electrician Plumber'],
    ['40 Ridge Way, Kellyville', 'Four-lot subdivision', 'Builder Concreter Excavator Plumber'],
    ['17 Bay St, Castle Hill', 'Office fit-out', '']
  ];
  var NOUN = { 'Builder': 'builders', 'Landscaper': 'landscapers', 'Concreter': 'concreters', 'Pool builder': 'pool builders', 'Fencer': 'fencers', 'Electrician': 'electricians', 'Plumber': 'plumbers', 'Excavator': 'excavators' };
  CP.approvals = {
    trade: function (r) { var b = $('.hs-trade[aria-checked="true"]', r); return b ? b.dataset.trade : 'Builder'; },
    fits: function (row, t) { return (' ' + row[2] + ' ').indexOf(' ' + t + ' ') > -1 || (t === 'Pool builder' && row[2].indexOf('Pool builder') > -1); },
    sort: function (r) {
      var t = CP.approvals.trade(r), items = $$('.hs-item', r), match = 0, last = null;
      items.forEach(function (li) {
        var ok = CP.approvals.fits(APPROVALS[+li.dataset.i], t);
        li.classList.toggle('is-match', ok); li.classList.toggle('is-skip', !ok);
        $('.hs-item__tag', li).textContent = ok ? 'Match' : 'Not for you';
        if (ok) { match++; last = APPROVALS[+li.dataset.i]; }
      });
      $('[data-hs-found]', r).textContent = items.length;
      $('[data-hs-match]', r).textContent = match;
      $('[data-hs-trade]', r).textContent = t.toLowerCase();
      var letter = $('[data-hs-letter]', r);
      if (last) {
        $('[data-hs-to]', r).textContent = 'To the owner, ' + last[0];
        $('[data-hs-body]', r).textContent = 'Congratulations on your approval for the ' + last[1].toLowerCase() + '. We’re local ' + NOUN[t] + ' and we’d love to quote your job. Call us or scan the code to book a time.';
        letter.classList.remove('is-sent'); void letter.offsetWidth; letter.classList.add('is-sent');
      } else {
        $('[data-hs-to]', r).textContent = 'To the owner';
        $('[data-hs-body]', r).textContent = 'Your letters appear here.';
        letter.classList.remove('is-sent');
      }
    },
    add: function (r, i) {
      var row = APPROVALS[i], li = document.createElement('li');
      li.className = 'hs-item'; li.dataset.i = i;
      li.innerHTML = '<div><b></b><span></span></div><em class="hs-item__tag"></em>';
      $('b', li).textContent = row[1]; $('span', li).textContent = row[0];
      $('[data-hs-list]', r).appendChild(li);
    },
    init: function (r) {
      $$('.hs-trade', r).forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.hs-trade', r).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          CP.approvals.sort(r);
        });
      });
    },
    reset: function (r) { $('[data-hs-list]', r).innerHTML = ''; CP.approvals.sort(r); },
    play: async function (r, tok) {
      for (var i = 0; i < APPROVALS.length; i++) {
        await sleep(i ? 750 : 300, tok);
        CP.approvals.add(r, i); CP.approvals.sort(r);
      }
    },
    still: function (r) { APPROVALS.forEach(function (x, i) { CP.approvals.add(r, i); }); CP.approvals.sort(r); }
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
