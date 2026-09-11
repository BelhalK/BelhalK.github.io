(function(){
  "use strict";
  var courtScript = document.createElement('script');
  courtScript.type = 'module';
  courtScript.src = '/assets/courtside-BbkrWxIk.js';
  document.head.appendChild(courtScript);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- custom cursor ---------- */
  (function initCursor(){
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.body.classList.add('has-cursor');
    var dot = document.createElement('div'); dot.className = 'cursor-dot'; dot.style.opacity = '0';
    var ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.style.opacity = '0';
    document.body.appendChild(dot); document.body.appendChild(ring);
    var mx=0,my=0, rx=0, ry=0, primed=false;
    window.addEventListener('mousemove', function(e){
      mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px';
      if (!primed) { primed=true; rx=mx; ry=my; dot.style.opacity=''; ring.style.opacity=''; }
    });
    document.querySelectorAll('a,button,input,summary').forEach(function(el){
      el.addEventListener('mouseenter', function(){ ring.classList.add('grow'); });
      el.addEventListener('mouseleave', function(){ ring.classList.remove('grow'); });
    });
    function raf(){
      rx += (mx-rx)*0.18; ry += (my-ry)*0.18;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      requestAnimationFrame(raf);
    }
    raf();
  })();

  /* ---------- reveal on scroll ---------- */
  (function initReveal(){
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function(el){ el.classList.add('in-view'); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function(el){ io.observe(el); });
  })();

  /* ---------- mobile: quick link back to the homepage ---------- */
  (function initHomeShortcut(){
    var home = document.createElement('a');
    home.href = '/';
    home.className = 'home-fab';
    home.setAttribute('aria-label', 'Back to homepage');
    home.title = 'Home';
    home.innerHTML = '<img src="/assets/hoop.jpg" alt="" aria-hidden="true">';
    document.body.appendChild(home);
  })();

  /* ---------- mobile nav: floating menu button + full-screen sheet ---------- */
  (function initMobileNav(){
    var nav = document.querySelector('.nav');
    var links = document.getElementById('navLinks');
    if (!nav || !links) return;
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'nav-fab';
    fab.setAttribute('aria-label', 'Open navigation menu');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML =
      '<svg class="icon-menu" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#ff5a1f"/><path d="M12 2v20M2 12h20M4.8 4.8c2.8 3.3 2.8 11.1 0 14.4M19.2 4.8c-2.8 3.3-2.8 11.1 0 14.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>' +
      '<svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>';
    nav.appendChild(fab);
    function setOpen(open){
      nav.classList.toggle('open', open);
      fab.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      fab.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-scroll-lock', open);
    }
    fab.addEventListener('click', function(){ setOpen(!nav.classList.contains('open')); });
    links.addEventListener('click', function(e){ if (e.target.closest('.nav-link')) setOpen(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setOpen(false); });
  })();

  /* ---------- filter pills (optional, used by research page) ---------- */
  (function initFilters(){
    var row = document.querySelector('.filter-row');
    if (!row) return;
    var pills = row.querySelectorAll('.filter-pill');
    var items = document.querySelectorAll('[data-cat]');
    pills.forEach(function(pill){
      pill.addEventListener('click', function(){
        pills.forEach(function(p){ p.classList.remove('active'); });
        pill.classList.add('active');
        var filter = pill.getAttribute('data-filter');
        items.forEach(function(item){
          var cats = (item.getAttribute('data-cat') || '').split(' ');
          item.hidden = !(filter === 'all' || cats.indexOf(filter) !== -1);
        });
      });
    });
  })();
})();
