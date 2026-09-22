(function(){
  var root = document.documentElement;
  var btns = document.querySelectorAll('.theme-toggle');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function apply(theme){ root.setAttribute('data-theme', theme); }

  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      apply(next);
      try{ localStorage.setItem('sms-theme', next); }catch(e){}
    });
  });

  // If the user hasn't manually chosen a theme on this device, keep following the OS setting live
  mq.addEventListener('change', function(e){
    var manual = null;
    try{ manual = localStorage.getItem('sms-theme'); }catch(err){}
    if(!manual){ apply(e.matches ? 'dark' : 'light'); }
  });
})();
