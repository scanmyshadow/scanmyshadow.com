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
                m:'Recovery starts with knowing what is out there. <em>See how many breaches your email is in.</em>' },
    stats:    { t:'Behind these numbers are real people whose details <em>leaked first</em>. Is your email one of them?',
                m:'Most of these losses began with someone&#x27;s details in the wrong hands. <em>See if yours already are.</em>' },
    story:    { t:'Scams like this often start with contact details <em>leaked in a data breach</em>. Is your email out there?',
                m:'Scammers rarely pick people at random. They work from <em>leaked contact lists</em>. Check if your email is on one.' },
    phone:    { t:'Your phone number and email often <em>leak together</em>. Start with a free email check.',
                m:'If your email shows up in a breach, your phone number <em>often leaked with it</em>. Check your email free.' },
    breach:   { t:'Your email may already be in a <em>known data breach</em>. Find out in about 30 seconds.',
                m:'Don&#x27;t guess. <em>See how many breaches</em> your email is in, and what leaked.' },
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
  '.sms-hook{--h-ink:#15121F;--h-soft:#605C73;--h-mist:#F1EEFE;--h-bg:#FFFFFF;--h-deep:#5A3FE0;--h-purple:#6D4DF3}'+
  'html[data-theme="dark"] .sms-hook{--h-ink:#F5F3FA;--h-soft:#B8B4CC;--h-mist:#241E38;--h-bg:#0F0D17;--h-deep:#B39DFF;--h-purple:#8B6FFF}'+
  '.sms-hook{position:relative;overflow:hidden;box-sizing:border-box;background:var(--h-mist);border:1px solid rgba(123,92,250,.28);border-radius:20px;padding:22px 20px 18px;margin:0 0 30px;box-shadow:0 10px 30px rgba(123,92,250,.14);font-family:Inter,system-ui,sans-serif;text-align:left}'+
  '.sms-cta[data-sms-cta=tldr]{margin-top:16px}'+
  '.sms-hook .sms-head{display:flex;align-items:center;gap:14px;margin:0 0 14px}'+
  '.sms-hook .sms-ping{position:relative;flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:#6D4DF3;color:#fff;display:flex;align-items:center;justify-content:center}'+
  '.sms-hook .sms-ping svg{width:21px;height:21px;position:relative;z-index:2}'+
  '.sms-hook .sms-ping i{position:absolute;inset:0;border-radius:50%;border:2px solid var(--h-purple);animation:smsPing 3s ease-out infinite;z-index:1}'+
  '.sms-hook .sms-ping i:nth-child(2){animation-delay:1.5s}'+
  '@keyframes smsPing{0%{transform:scale(1);opacity:.75}100%{transform:scale(1.9);opacity:0}}'+
  '.sms-hook .sms-title{font-family:"Space Grotesk",Inter,sans-serif;font-weight:700;font-size:19px;line-height:1.3;color:var(--h-ink);margin:0;letter-spacing:-.01em}'+
  '.sms-hook .sms-title em{font-style:normal;color:var(--h-deep)}'+
  '.sms-hook form{display:flex;gap:8px;flex-wrap:wrap;margin:0}'+
  '.sms-hook input[type=email]{flex:1 1 220px;min-width:0;box-sizing:border-box;font:500 16px Inter,sans-serif;padding:14px 16px;border-radius:13px;border:1.5px solid rgba(123,92,250,.35);background:var(--h-bg);color:var(--h-ink);outline:none;margin:0}'+
  '.sms-hook input[type=email]:focus{border-color:var(--h-purple);box-shadow:0 0 0 4px rgba(123,92,250,.18)}'+
  '.sms-hook button{flex:1 1 auto;font:700 15.5px Inter,sans-serif;color:#fff;background:#6D4DF3;border:none;border-radius:13px;padding:14px 20px;cursor:pointer;margin:0;animation:smsGlow 2.6s ease-in-out infinite}'+
  '.sms-hook button:hover{background:var(--h-deep)}'+
  '@keyframes smsGlow{0%,100%{box-shadow:0 6px 18px rgba(123,92,250,.30)}50%{box-shadow:0 6px 28px rgba(123,92,250,.60)}}'+
  '.sms-hook .sms-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}'+
  '.sms-hook .sms-trust{display:flex;flex-wrap:wrap;gap:6px 14px;margin:12px 0 0;font-size:12.5px;line-height:1.4;color:var(--h-soft)}'+
  '.sms-hook .sms-trust span{display:inline-flex;align-items:center;gap:5px}'+
  '.sms-hook .sms-trust svg{width:13px;height:13px;color:var(--h-purple)}'+
  '.sms-hook .sms-legal{margin:8px 0 0;font-size:11.5px;line-height:1.45;color:var(--h-soft)}'+
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
  /* blog-1 bottom card, namespaced copy for posts whose template lacks it (.sms-pw) */
  '.sms-pw{display:flex;justify-content:center;margin:48px 0 8px;font-family:Inter,system-ui,sans-serif}'+
  '.sms-pc{position:relative;overflow:hidden;box-sizing:border-box;width:100%;max-width:680px;background:#15121F;color:#fff;border-radius:24px;padding:36px 40px;box-shadow:0 30px 80px rgba(21,18,31,.18);text-align:left}'+
  'html[data-theme="dark"] .sms-pc{background:#241E38;box-shadow:0 30px 80px rgba(0,0,0,.55)}'+
  '.sms-pc .sms-pi{position:relative;z-index:2;display:flex;align-items:center;gap:40px}'+
  '.sms-pc .sms-pl{flex:0 0 auto;width:250px}'+
  '.sms-pc .sms-pr{flex:1;min-width:0;border-left:1px solid rgba(255,255,255,.1);padding-left:36px}'+
  '.sms-pc .sms-list{list-style:none;margin:0 0 18px;padding:0}'+
  '.sms-pc .sms-list li{display:flex;align-items:flex-start;gap:10px;padding:7px 0;margin:0;font-size:13px;line-height:1.5;color:#DEDDEC}'+
  '.sms-pc .sms-list li:before{content:none}'+
  '.sms-pc .sms-list{border:0!important;background:none!important;padding:0!important;margin:0 0 18px!important;box-shadow:none!important}'+
  '.sms-pc .sms-list li{border:0!important;background:none!important;box-shadow:none!important;list-style:none!important;font-family:Inter,system-ui,sans-serif!important;padding:7px 0!important;margin:0!important;font-size:13px!important;line-height:1.5!important;color:#DEDDEC!important}'+
  '.sms-pc,.sms-pc p,.sms-pc div,.sms-pc a{font-family:Inter,system-ui,sans-serif}'+
  '.sms-pc .price-free-h{font-family:"Space Grotesk",Inter,sans-serif!important;font-size:26px;line-height:1.15!important;font-weight:700!important}'+
  '.sms-pc .sms-list li svg{width:15px;height:15px;color:#8B6FFF;flex-shrink:0;margin-top:1px}'+
  '.sms-pc .sms-btn{display:block;width:100%;box-sizing:border-box;text-align:center;background:#6D4DF3;color:#fff!important;border:none;border-radius:13px;padding:14px;font:600 14.5px Inter,sans-serif;cursor:pointer;text-decoration:none!important;margin-top:20px}'+
  '.sms-pc .sms-btn:hover{background:#5A3FE0}'+
  '.sms-pc .price-free-h{margin:0 0 16px}'+
  '.sms-pc .sms-aurora{position:absolute;inset:0;z-index:0;pointer-events:none}'+
  '.sms-pc .sms-aurora span{position:absolute;border-radius:50%;filter:blur(60px);opacity:.5;mix-blend-mode:screen}'+
  '.sms-pc .sms-aurora .a1{width:400px;height:400px;background:radial-gradient(circle,#7B5CFA,transparent 68%);top:-140px;left:6%;animation:smsDrift1 16s ease-in-out infinite}'+
  '.sms-pc .sms-aurora .a2{width:340px;height:340px;background:radial-gradient(circle,#9D6BFF,transparent 66%);bottom:-150px;right:4%;animation:smsDrift2 19s ease-in-out infinite}'+
  '.sms-pc .sms-aurora .a3{width:280px;height:280px;background:radial-gradient(circle,#5A3FE0,transparent 70%);top:28%;left:44%;opacity:.38;animation:smsDrift3 22s ease-in-out infinite}'+
  '@keyframes smsDrift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(56px,38px) scale(1.12)}}'+
  '@keyframes smsDrift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-46px,-28px) scale(1.08)}}'+
  '@keyframes smsDrift3{0%,100%{transform:translate(0,0) scale(1);opacity:.32}50%{transform:translate(-38px,28px) scale(1.15);opacity:.48}}'+
  '.sms-pc .sms-particles{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}'+
  '.sms-pc .sms-particles i{position:absolute;bottom:-10px;width:3px;height:3px;border-radius:50%;background:rgba(180,150,255,.7);box-shadow:0 0 6px rgba(155,120,255,.9);animation:smsRise linear infinite}'+
  '@keyframes smsRise{0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:.7}100%{transform:translateY(-380px);opacity:0}}'+
  '.sms-pc .sms-sheen{position:absolute;top:0;left:-60%;width:40%;height:100%;z-index:1;pointer-events:none;background:linear-gradient(105deg,transparent,rgba(255,255,255,.06),transparent);transform:skewX(-18deg);animation:smsSheen 8s ease-in-out infinite}'+
  '@keyframes smsSheen{0%{left:-60%}55%,100%{left:130%}}'+
  '@media(max-width:640px){.sms-pc .price-free-h{font-size:24px!important}.sms-pc .sms-pi{flex-direction:column;align-items:stretch;gap:24px}.sms-pc .sms-pl{width:100%}.sms-pc .sms-pr{border-left:none;border-top:1px solid rgba(255,255,255,.1);padding-left:0;padding-top:20px}}'+
  '@media(prefers-reduced-motion:reduce){.sms-pc .sms-aurora span,.sms-pc .sms-particles i,.sms-pc .sms-sheen{animation:none}}'+
  /* footer: template shows light+dark logos together in light mode */
  'html:not([data-theme="dark"]) img.logo-dark-img{display:none!important}'+
  /* older template cards: same size and shape as blog 1 */
  /* legacy inline blue CTA text: AA contrast */
  '[style*="color: #007bff"],[style*="color:#007bff"]{color:#0056B3!important}'+
  '.price-wrap .price-card{border-radius:24px!important;max-width:680px!important;padding:36px 40px!important}'+
  '.price-card .price-list li{font-size:13px!important}.price-card .btn-price{font-size:14.5px!important}'+
  '.price-card .price-free-h,.sms-pc .price-free-h{color:#fff!important}'+
  /* light pricing-box variant */
  '.pricing-box .price-step{color:#5A3FE0;background:rgba(123,92,250,.12)}'+
  '.pricing-box .price-free-h{color:var(--ink,#15121F)}'+
  '.pricing-box .price-next{color:var(--ink-soft,#605C73);margin:0 0 16px}'+
  '.pricing-box .price-next .price-tag{color:var(--ink,#15121F)!important}'+
  '.pricing-box .scan-btn{background:#6D4DF3!important;color:#fff!important}'+
  'html[data-theme="dark"] .pricing-box .price-step{color:#B39DFF;background:rgba(123,92,250,.18)}'+
  /* AA contrast for existing template text + buttons (no markup change) */
  ':root{--ink-faint:#6B6781}'+
  'html:not([data-theme="dark"]){--purple:#6D4DF3;--accent:#6D4DF3}'+
  'main>article p a,main>article li a{text-decoration:underline;text-underline-offset:2px}'+
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

  function particles(){
    [].forEach.call(document.querySelectorAll('[data-sms-particles]'), function(box){
      if (box.childElementCount) return;
      for (var i = 0; i < 14; i++) {
        var p = document.createElement('i'), sc = 0.6 + Math.random() * 1.3;
        p.style.left = (Math.random() * 100) + '%'; p.style.animationDuration = (7 + Math.random() * 7) + 's';
        p.style.animationDelay = (-Math.random() * 10) + 's'; p.style.width = (3 * sc) + 'px'; p.style.height = (3 * sc) + 'px';
        box.appendChild(p);
      }
    });
  }
  function renderAll(){ [].forEach.call(document.querySelectorAll('.sms-cta[data-sms-cta]'), render); }
  renderAll(); // TL;DR slot is already parsed (script sits right after it) -> no layout jump

  function late(){
    renderAll(); particles();
    if (document.querySelector('.sms-sticky')) return;
    var bar = document.createElement('div');
    bar.className = 'sms-sticky'; bar.setAttribute('aria-hidden', 'true'); bar.inert = true;
    bar.innerHTML = '<span class="sms-dot"></span><span class="sms-txt">Your email: <b>not checked yet</b></span><a href="' + DEST + '">Check free</a>';
    var a = bar.querySelector('a'); a.tabIndex = -1;
    a.addEventListener('click', function(){ ga('blog_sticky_cta_click', { cta_kind:K }); });
    document.body.appendChild(bar);
    var top = document.querySelector('.sms-cta[data-sms-cta=tldr]');
    var watch = [].slice.call(document.querySelectorAll('.sms-hook,.price-card,.pricing-box,.sms-pc,footer'));
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
  function a11y(){
    [].forEach.call(document.querySelectorAll('.foot-col h4'), function(h){ h.setAttribute('role','presentation'); });
    // empty links in older posts (no text, no image): hide from screen readers and keyboard
    [].forEach.call(document.querySelectorAll('article a[href], .post-content a[href]'), function(a){
      if (!a.textContent.trim() && !a.querySelector('img,svg') && !a.getAttribute('aria-label')) { a.setAttribute('aria-hidden','true'); a.tabIndex = -1; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', a11y); else a11y();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', late); else late();
})();
