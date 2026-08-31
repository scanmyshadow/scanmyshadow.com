// Scan My Shadow — shared geo-IP price localization
// Swaps every element with class="price-tag" from ₹498 to $9.99 for non-India visitors.
// Include on any page with: <script src="/assets/geo-price.js"></script>
(function(){
  window.SMS_CURRENCY = 'INR'; // default: India-first, also the fallback if geo-IP fails

  fetch('https://ipwho.is/')
    .then(function(res){ return res.json(); })
    .then(function(data){
      if(data && data.success !== false && data.country_code && data.country_code !== 'IN'){
        window.SMS_CURRENCY = 'USD';
        document.querySelectorAll('.price-tag').forEach(function(el){
          el.textContent = '$9.99';
        });
        var badgeTitle = document.getElementById('privacyBadgeTitle');
        var badgeDesc = document.getElementById('privacyBadgeDesc');
        if(badgeTitle) badgeTitle.textContent = 'Privacy-first';
        if(badgeDesc) badgeDesc.textContent = "Consent-first, with your data deleted immediately after your report.";
      }
    })
    .catch(function(){
      // geo-IP failed or blocked — keep INR default per agreed fallback
    });
})();
