(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     1. ELEMENTS
     ══════════════════════════════════════════════════════ */
  var header    = document.getElementById('siteHeader');
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  var overlay   = document.getElementById('navOverlay');

  /* All nav anchor items (both desktop and mobile share same list) */
  var navItems  = Array.prototype.slice.call(document.querySelectorAll('.nav-item[data-nav]'));

  /* All sections that should drive nav highlight */
  var sections  = Array.prototype.slice.call(document.querySelectorAll('section[id]'));

  /* All elements that should fade in on scroll */
  var fadeEls   = Array.prototype.slice.call(document.querySelectorAll('.fade-in'));

  /* ══════════════════════════════════════════════════════
     2. MOBILE MENU
     ══════════════════════════════════════════════════════ */
  var menuOpen = false;

  function openMenu() {
    menuOpen = true;
    navLinks.classList.add('open');
    overlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    /* Focus first nav item for keyboard accessibility */
    var first = navLinks.querySelector('.nav-item');
    if (first) first.focus();
  }

  function closeMenu() {
    menuOpen = false;
    navLinks.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (menuOpen) { closeMenu(); } else { openMenu(); }
  }

  /* Bind hamburger */
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }

  /* Close on overlay click */
  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  /* Close on nav link click (mobile: link click navigates + closes) */
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      /* Only close if mobile menu is actually open */
      if (menuOpen) closeMenu();
    });
  });

  /* Close on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });

  /* ══════════════════════════════════════════════════════
     3. NAV ACTIVE STATE via IntersectionObserver
     ══════════════════════════════════════════════════════
     Strategy: observe each section. The last one that crossed
     into the top 30% of the viewport sets the active nav item.
     Using rootMargin to trigger slightly before center.
  */
  var activeSection = '';

  function setActiveNav(id) {
    if (id === activeSection) return;
    activeSection = id;

    navItems.forEach(function (item) {
      if (item.getAttribute('data-nav') === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /* Map section id → entry ratio for comparison */
  var sectionRatios = {};

  var navObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        sectionRatios[entry.target.id] = entry.intersectionRatio;
      });

      /*
       * Find the section with the highest intersection ratio.
       * Ties broken by DOM order (first wins).
       * This avoids scroll-direction checks and setTimeout.
       */
      var best = null;
      var bestRatio = 0;

      sections.forEach(function (sec) {
        var ratio = sectionRatios[sec.id] || 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = sec.id;
        }
      });

      if (best && bestRatio > 0) {
        setActiveNav(best);
      }
    },
    {
      /* Observe across the full viewport */
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
    }
  );

  sections.forEach(function (sec) {
    sectionRatios[sec.id] = 0;
    navObserver.observe(sec);
  });

  /* ══════════════════════════════════════════════════════
     4. FADE-IN via IntersectionObserver
     ══════════════════════════════════════════════════════
     Triggered once per element — observer disconnects after
     visible class is applied. No continuous repaint.
  */
  if (fadeEls.length > 0) {
    var fadeObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            /* Stop observing — animation only fires once */
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    fadeEls.forEach(function (el) {
      fadeObserver.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════════
     5. NAV HEADER BORDER on scroll
     ══════════════════════════════════════════════════════
     Adds a class when page is scrolled so the border
     becomes more visible. Uses IntersectionObserver on a
     sentinel element — zero scroll event cost.
  */
  var sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:' + (window.innerHeight * 0.5) + 'px;height:1px;width:1px;pointer-events:none;';
  document.body.insertBefore(sentinel, document.body.firstChild);

  new IntersectionObserver(
    function (entries) {
      if (header) {
        /* When sentinel exits viewport top, page has scrolled past half-screen */
        header.classList.toggle('scrolled', !entries[0].isIntersecting);
      }
    },
    { threshold: 0 }
  ).observe(sentinel);

  /* ══════════════════════════════════════════════════════
     6. PRINT
     ══════════════════════════════════════════════════════ */
  window.downloadResume = function () {
    window.print();
  };

})();
