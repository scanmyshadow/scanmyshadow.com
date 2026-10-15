/* Scan My Shadow: shared blog conversion hooks (free email check)
   Include once per post, directly after the TL;DR slot:
     <div class="sms-cta" data-sms-cta="tldr">...fallback link...</div>
     <script src="/assets/blog-cta.js"></script>
   Optional mid-article slot anywhere later:  <div class="sms-cta" data-sms-cta="mid"></div>
   Renders: TL;DR hook box, mid-article box, phone sticky bar. Copy picked by post type.
   Hands the typed email to /digital-footprint-checker/ via sessionStorage (never the URL); the checker auto-runs. */
(function(){
  if (window.__smsCta) return; window.__smsCta = true;

  var DEST = 'https://www.scanmyshadow.com/digital-footprint-checker/';
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- copy, by post type ---------- */
  var COPY = {
    roundup:  { t:'Most of these scams start with an email that was <em>already leaked</em>. Is yours one of them?',
                m:'Every story above began the same way: the scammer <em>already had the contact details</em>. Check yours before someone uses them.' },
    recovery: { t:'Scammers often <em>come back</em> using the same leaked details. See if your email is still out there.',
                m:'Recovery starts with knowing what is out there. <em>See which breaches your email is in.</em>' },
    stats:    { t:'Behind these numbers are real people whose details <em>leaked first</em>. Is your email one of them?',
                m:'Most of these losses began with someone&#x27;s details in the wrong hands. <em>See if yours already are.</em>' },
    story:    { t:'Scams like this often start with contact details <em>leaked in a data breach</em>. Is your email out there?',
                m:'Scammers rarely pick people at random. They work from <em>leaked contact lists</em>. Check if your email is on one.' },
    phone:    { t:'Your phone number and email often <em>leak together</em>. Start with a free email check.',
                m:'If your email shows up in a breach, your phone number <em>often leaked with it</em>. Check your email free.' },
    breach:   { t:'Your email may already be in a <em>known data breach</em>. Find out in about 30 seconds.',
                m:'Don&#x27;t guess. <em>See exactly which breaches</em> your email is in, and what leaked.' },
    scam:     { t:'Scammers start with details that have <em>already leaked</em>. Is your email one of them?',
                m:'Your best defence is knowing what scammers <em>already know about you</em>. Check your email free.' },
    general:  { t:'Your email is the key to most of your online life. <em>Has it already leaked?</em>',
                m:'Quick check before you read on: is your email in a <em>known data breach</em>? Free, about 30 seconds.' }
  };
  var BTN = { tldr:'Check my email free', mid:'Check if my email leaked' };

  function kind(){
    var h1 = document.querySelector('h1'); h1 = h1 ? h1.textContent : '';
    var tags = [].map.call(document.querySelectorAll('.tag-pill,.tags span,.tags a,.tag'), function(e){ return e.textContent; }).join(' | ');
    var s = (h1 + ' | ' + tags + ' | ' + location.pathname).toLowerCase();
    function has(re){ return re.test(s); }
    if (has(/roundup|scam news:/)) return 'roundup';
    if (has(/recovery|recover |after a scam|been scammed|got scammed|victim of|lost money|money back/)) return 'recovery';
    if (has(/statistic|\| data \||\| report \||in numbers|\d{4} data|data:|losses by|by category|by age group/)) return 'stats';
    if (has(/scam news|real stor|scam alert|seasonal alert|court case|fraud alert|\bfbi\b|\bftc\b|\bacma\b|\bscamwatch\b|police|arrest|warns?\b/)) return 'story';
    if (has(/phone|whatsapp|\bsim\b|\bsms\b|smishing|caller|\bupi\b|mobile number/)) return 'phone';
    if (has(/breach|pwned|leak|email|password|account takeover|dark web/)) return 'breach';
    if (has(/scam|fraud|phishing|imperson|fake|con\b|hoax/)) return 'scam';
    return 'general';
  }
  var K = kind();

  /* ---------- styles (namespaced) ---------- */
  var css = ''+
  '.sms-hook{position:relative;overflow:hidden;box-sizing:border-box;background:var(--purple-mist,#F1EEFE);border:1px solid rgba(123,92,250,.28);border-radius:20px;padding:22px 20px 18px;margin:0 0 30px;box-shadow:0 10px 30px rgba(123,92,250,.14);font-family:Inter,system-ui,sans-serif;text-align:left}'+
  '.sms-cta[data-sms-cta=tldr]{margin-top:16px}'+
  '.sms-hook .sms-head{display:flex;align-items:center;gap:14px;margin:0 0 14px}'+
  '.sms-hook .sms-ping{position:relative;flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:#6D4DF3;color:#fff;display:flex;align-items:center;justify-content:center}'+
  '.sms-hook .sms-ping svg{width:21px;height:21px;position:relative;z-index:2}'+
  '.sms-hook .sms-ping i{position:absolute;inset:0;border-radius:50%;border:2px solid var(--purple,#7B5CFA);animation:smsPing 3s ease-out infinite;z-index:1}'+
  '.sms-hook .sms-ping i:nth-child(2){animation-delay:1.5s}'+
  '@keyframes smsPing{0%{transform:scale(1);opacity:.75}100%{transform:scale(1.9);opacity:0}}'+
  '.sms-hook .sms-title{font-family:"Space Grotesk",Inter,sans-serif;font-weight:700;font-size:19px;line-height:1.3;color:var(--ink,#15121F);margin:0;letter-spacing:-.01em}'+
  '.sms-hook .sms-title em{font-style:normal;color:var(--purple-deep,#5A3FE0)}'+
  '.sms-hook form{display:flex;gap:8px;flex-wrap:wrap;margin:0}'+
  '.sms-hook input[type=email]{flex:1 1 220px;min-width:0;box-sizing:border-box;font:500 16px Inter,sans-serif;padding:14px 16px;border-radius:13px;border:1.5px solid rgba(123,92,250,.35);background:var(--bg,#fff);color:var(--ink,#15121F);outline:none;margin:0}'+
  '.sms-hook input[type=email]:focus{border-color:var(--purple,#7B5CFA);box-shadow:0 0 0 4px rgba(123,92,250,.18)}'+
  '.sms-hook button{flex:1 1 auto;font:700 15.5px Inter,sans-serif;color:#fff;background:#6D4DF3;border:none;border-radius:13px;padding:14px 20px;cursor:pointer;margin:0;animation:smsGlow 2.6s ease-in-out infinite}'+
  '.sms-hook button:hover{background:var(--purple-deep,#5A3FE0)}'+
  '@keyframes smsGlow{0%,100%{box-shadow:0 6px 18px rgba(123,92,250,.30)}50%{box-shadow:0 6px 28px rgba(123,92,250,.60)}}'+
  '.sms-hook .sms-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}'+
  '.sms-hook .sms-trust{display:flex;flex-wrap:wrap;gap:6px 14px;margin:12px 0 0;font-size:12.5px;line-height:1.4;color:var(--ink-soft,#605C73)}'+
  '.sms-hook .sms-trust span{display:inline-flex;align-items:center;gap:5px}'+
  '.sms-hook .sms-trust svg{width:13px;height:13px;color:var(--purple,#7B5CFA)}'+
  '.sms-hook .sms-legal{margin:8px 0 0;font-size:11.5px;line-height:1.45;color:var(--ink-soft,#605C73)}'+
  '.sms-hook .sms-err{margin:8px 0 0;font-size:13px;line-height:1.4;color:#DC2626;font-weight:600}'+
  '.sms-hook.mid{background:#15121F;border:none}'+
  'html[data-theme="dark"] .sms-hook.mid{background:#241E38}'+
  '.sms-hook.mid .sms-title{color:#fff}.sms-hook.mid .sms-title em{color:#B39DFF}'+
  '.sms-hook.mid .sms-trust{color:#B8B4CC}.sms-hook.mid .sms-legal{color:#8B87A3}'+
  '.sms-hook.mid input[type=email]{background:#fff;color:#15121F;border-color:transparent}'+
  '.sms-sticky{box-sizing:border-box;position:fixed;left:10px;right:10px;bottom:10px;max-width:calc(100vw - 20px);z-index:90;display:flex;align-items:center;gap:10px;background:#15121F;color:#fff;border-radius:16px;padding:10px 10px 10px 14px;box-shadow:0 14px 40px rgba(0,0,0,.35);transform:translateY(140%);transition:transform .35s ease;font-family:Inter,system-ui,sans-serif}'+
  'html[data-theme="dark"] .sms-sticky{background:#241E38}'+
  '.sms-sticky.show{transform:translateY(0)}'+
  '.sms-sticky .sms-dot{width:9px;height:9px;border-radius:50%;background:#F59E0B;flex:0 0 9px;animation:smsDot 1.8s infinite}'+
  '@keyframes smsDot{0%{box-shadow:0 0 0 0 rgba(245,158,11,.6)}70%{box-shadow:0 0 0 9px rgba(245,158,11,0)}100%{box-shadow:0 0 0 0 rgba(245,158,11,0)}}'+
  '.sms-sticky .sms-txt{flex:1;min-width:0;font-size:13px;line-height:1.3;color:#DEDDEC}.sms-sticky .sms-txt b{color:#fff}'+
  '.sms-sticky a{flex:0 0 auto;background:#6D4DF3;color:#fff!important;font:700 14px Inter,sans-serif;padding:11px 16px;border-radius:11px;text-decoration:none!important}'+
  '@media(min-width:900px){.sms-sticky{display:none}}'+
  '@media(max-width:640px){.sms-hook .sms-title{font-size:18px}}'+
  /* free-first bottom card (static markup, styled here) */
  '.price-step{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#B39DFF;background:rgba(123,92,250,.18);padding:5px 10px;border-radius:999px;margin-bottom:12px}'+
  '.price-free-h{font-family:"Space Grotesk",Inter,sans-serif;font-weight:700;font-size:26px;line-height:1.15;color:#fff;margin:0 0 16px;letter-spacing:-.02em}'+
  '.price-next{margin-top:12px;font-size:12px;line-height:1.5;color:#A5A2C0;text-align:center}'+
  '.price-next .price-tag{font-size:12px!important;color:#DEDDEC!important;font-weight:600;margin-left:0}'+
  '.price-card .price-left:has(.price-step){width:250px}'+
  '@media(max-width:640px){.price-card .price-left:has(.price-step){width:100%}.price-free-h{font-size:24px}}'+
  /* AA contrast for existing template text + buttons (no markup change) */
  ':root{--ink-faint:#6B6781}'+
  '.nav-pill,.btn-price{background:#6D4DF3!important}.nav-pill:hover,.btn-price:hover{background:#5A3FE0!important}'+
  'p[style*="color:#888"]{color:#737373!important}'+
  '@media(prefers-reduced-motion:reduce){.sms-hook .sms-ping i,.sms-hook button,.sms-sticky .sms-dot{animation:none}}';
  var st = document.createElement('style'); st.id = 'sms-cta-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  var SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3z"/><path d="m9 12 2 2 4-4"/></svg>';

  function ga(name, params){ if (typeof gtag === 'function') { try { gtag('event', name, params || {}); } catch(e){} } }

  function render(slot){
    if (slot.getAttribute('data-sms-done')) return;
    var pos = slot.getAttribute('data-sms-cta'); if (!COPY[K] || !BTN[pos]) return;
    slot.setAttribute('data-sms-done', '1');
    slot.innerHTML =
      '<div class="sms-hook' + (pos === 'mid' ? ' mid' : '') + '">' +
        '<div class="sms-head"><span class="sms-ping" aria-hidden="true"><i></i><i></i>' + SHIELD + '</span>' +
        '<div class="sms-title">' + COPY[K][pos === 'mid' ? 'm' : 't'] + '</div></div>' +
        '<form novalidate>' +
          '<input type="email" name="email" placeholder="you@example.com" autocomplete="email" inputmode="email" spellcheck="false" aria-label="Your email address">' +
          '<input type="text" name="hp" class="sms-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<button type="submit">' + BTN[pos] + '</button>' +
        '</form>' +
        '<div class="sms-err" hidden></div>' +
        '<div class="sms-trust"><span>' + TICK + ' Free</span><span>' + TICK + ' About 30 seconds</span><span>' + TICK + ' No sign-up</span><span>' + TICK + ' Email not stored</span></div>' +
        '<div class="sms-legal">By tapping the button you confirm this is your own email, or that you have permission to check it.</div>' +
      '</div>';
    var f = slot.querySelector('form');
    f.addEventListener('submit', function(ev){
      ev.preventDefault();
      var inp = f.querySelector('input[type=email]'), hp = f.querySelector('.sms-hp');
      var err = slot.querySelector('.sms-err'), v = (inp.value || '').trim();
      if (!RE.test(v)) { err.textContent = v ? 'That doesn’t look like a valid email.' : 'Enter your email to run the free check.'; err.hidden = false; inp.focus(); return; }
      err.hidden = true;
      try { sessionStorage.setItem('sms_prefill', JSON.stringify({ e:v, hp:(hp && hp.value) || '', t:Date.now() })); } catch(e){}
      var done = false, go = function(){ if (done) return; done = true; location.href = DEST; };
      if (typeof gtag === 'function') {
        try { gtag('event', 'blog_hook_submit', { position:pos, cta_kind:K, event_callback:go, event_timeout:600 }); setTimeout(go, 700); return; } catch(e){}
      }
      go();
    });
  }

  function renderAll(){ [].forEach.call(document.querySelectorAll('.sms-cta[data-sms-cta]'), render); }
  renderAll(); // TL;DR slot is already parsed (script sits right after it) -> no layout jump

  function late(){
    renderAll();
    if (document.querySelector('.sms-sticky')) return;
    var bar = document.createElement('div');
    bar.className = 'sms-sticky'; bar.setAttribute('aria-hidden', 'true'); bar.inert = true;
    bar.innerHTML = '<span class="sms-dot"></span><span class="sms-txt">Your email: <b>not checked yet</b></span><a href="' + DEST + '">Check free</a>';
    var a = bar.querySelector('a'); a.tabIndex = -1;
    a.addEventListener('click', function(){ ga('blog_sticky_cta_click', { cta_kind:K }); });
    document.body.appendChild(bar);
    var top = document.querySelector('.sms-cta[data-sms-cta=tldr]');
    var watch = [].slice.call(document.querySelectorAll('.sms-hook,.price-card,.pricing-box'));
    var vis = new Set();
    function upd(){
      var passed = top ? top.getBoundingClientRect().bottom < 0 : window.scrollY > 600;
      var on = passed && vis.size === 0;
      bar.classList.toggle('show', on); bar.setAttribute('aria-hidden', on ? 'false' : 'true'); bar.inert = !on; a.tabIndex = on ? 0 : -1;
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); }); upd(); });
      watch.forEach(function(w){ io.observe(w); });
    }
    window.addEventListener('scroll', upd, { passive:true });
  }
  function a11y(){ [].forEach.call(document.querySelectorAll('.foot-col h4'), function(h){ h.setAttribute('role','presentation'); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', a11y); else a11y();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', late); else late();
})();
