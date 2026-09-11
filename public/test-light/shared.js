(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- custom cursor ---------- */
  (function initCursor(){
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.body.classList.add('has-cursor');
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    var mx=0,my=0, rx=0, ry=0;
    window.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });
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
