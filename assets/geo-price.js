// Scan My Shadow: shared price localization
// Default is USD ($9.99). India (time zone Asia/Kolkata OR geo-IP country IN) sees INR (\u20b9498).
// Include on any page with: <script src="/assets/geo-price.js"></script>
(function(){
  var BADGES=[['privacyBadgeTitle','Privacy-first'],['privacyBadgeDesc','Consent-first, with your data deleted immediately after your report.'],['privacyBadgeTitleMobile','Privacy-first'],['privacyBadgeDescMobile','Consent-first, with your data deleted immediately after your report.']];
  var PRICES={INR:'\u20b9498',USD:'$9.99'};
  function tzIsIndia(){ try{ var tz=Intl.DateTimeFormat().resolvedOptions().timeZone; return tz==='Asia/Kolkata'||tz==='Asia/Calcutta'; }catch(e){ return false; } }
  function apply(cur){
    window.SMS_CURRENCY = cur;
    document.querySelectorAll('.price-tag').forEach(function(el){ el.textContent = PRICES[cur]; });
    BADGES.forEach(function(b){
      var el=document.getElementById(b[0]); if(!el) return;
      if(el.getAttribute('data-orig')===null) el.setAttribute('data-orig',el.textContent);
      el.textContent = (cur==='USD') ? b[1] : el.getAttribute('data-orig');
    });
  }
  apply(tzIsIndia() ? 'INR' : 'USD'); // instant, no network: India by time zone, everyone else USD
  fetch('https://ipwho.is/')
    .then(function(res){ return res.json(); })
    .then(function(data){
      // India if EITHER the time zone or the geo-IP says India, so Indian buyers are never charged in USD
      if(data && data.success !== false && data.country_code === 'IN' && window.SMS_CURRENCY !== 'INR'){ apply('INR'); }
    })
    .catch(function(){ /* geo-IP failed or blocked: the time zone result stands */ });
})();
