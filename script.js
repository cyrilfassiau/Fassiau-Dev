/* ==========================================================================
   Cyril Fassiau - fassiau-dev.com
   No scroll listeners anywhere: every scroll-driven behaviour below runs on
   IntersectionObserver so it stays off the main thread.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------------
     1. THEME
     Three states: no stored value follows the system, otherwise the stored
     choice wins. The pre-paint resolution lives inline in the document head.
     ------------------------------------------------------------------------ */

  var themeToggle = document.getElementById('theme-toggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    var forced = document.documentElement.getAttribute('data-theme');
    if (forced === 'light' || forced === 'dark') return forced;
    return systemDark.matches ? 'dark' : 'light';
  }

  function syncToggleLabel() {
    if (!themeToggle) return;
    var next = currentTheme() === 'dark' ? 'clair' : 'sombre';
    themeToggle.setAttribute('aria-label', 'Basculer en thème ' + next);
  }

  if (themeToggle) {
    syncToggleLabel();

    themeToggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('cf-theme', next);
      } catch (e) { /* private mode: the choice just will not persist */ }
      syncToggleLabel();
    });

    // follow the OS while the user has not made an explicit choice
    systemDark.addEventListener('change', function () {
      if (!document.documentElement.hasAttribute('data-theme')) syncToggleLabel();
    });
  }

  /* ------------------------------------------------------------------------
     2. MOBILE MENU
     ------------------------------------------------------------------------ */

  var menuBtn = document.getElementById('mobile-menu-btn');
  var mainNav = document.getElementById('main-nav');

  if (menuBtn && mainNav) {
    var openMenu = function () {
      mainNav.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Fermer le menu');
    };

    var closeMenu = function () {
      mainNav.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Ouvrir le menu');
    };

    menuBtn.addEventListener('click', function () {
      if (mainNav.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    mainNav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        closeMenu();
        menuBtn.focus();
      }
    });

    window.matchMedia('(min-width: 768px)').addEventListener('change', function (e) {
      if (e.matches) closeMenu();
    });
  }

  /* ------------------------------------------------------------------------
     3. NAVBAR ELEVATION
     A 1px sentinel at the top of the document replaces the old scroll handler.
     ------------------------------------------------------------------------ */

  var navbar = document.getElementById('navbar');

  if (navbar && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      navbar.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ------------------------------------------------------------------------
     4. SCROLL SPY
     The .active styling has existed since the first build but nothing ever
     applied the class.
     ------------------------------------------------------------------------ */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link[href^="#"]'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    };

    var visible = new Map();

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
        else visible.delete(entry.target.id);
      });

      var best = null;
      var bestRatio = 0;
      visible.forEach(function (ratio, id) {
        if (ratio >= bestRatio) { bestRatio = ratio; best = id; }
      });

      if (best) setActive(best);
    }, { threshold: [0.15, 0.4, 0.7], rootMargin: '-72px 0px -35% 0px' });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------------------------------------------
     5. SCROLL REVEAL
     ------------------------------------------------------------------------ */

  var revealables = document.querySelectorAll('.reveal');

  if (!revealables.length) {
    // nothing to do
  } else if (!('IntersectionObserver' in window) || prefersReducedMotion.matches) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------------
     6. CONTACT FORM (Netlify)
     ------------------------------------------------------------------------ */

  var contactForm = document.getElementById('contact-form');
  var contactStatus = document.getElementById('contact-form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = contactForm.querySelector('.contact-submit');
      var data = new FormData(contactForm);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
      }

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString()
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Erreur réseau');
          contactForm.reset();
          if (contactStatus) {
            contactStatus.textContent = 'Merci, votre message a bien été envoyé !';
            contactStatus.classList.remove('is-error');
            contactStatus.classList.add('is-success');
          }
        })
        .catch(function () {
          if (contactStatus) {
            contactStatus.textContent = "Une erreur s'est produite, merci de réessayer ou de m'écrire directement par email.";
            contactStatus.classList.remove('is-success');
            contactStatus.classList.add('is-error');
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer le message';
          }
        });
    });
  }

  /* ------------------------------------------------------------------------
     7. HERO WAVE FIELD
     The site signature. Now gated three ways: it never starts under reduced
     motion, it pauses when the hero scrolls out of view, and it pauses when
     the tab is hidden. Previously it ran forever in background tabs.
     ------------------------------------------------------------------------ */

  var heroBg = document.querySelector('.hero-bg');
  var paths = document.querySelectorAll('#waves path');

  if (heroBg && paths.length && !prefersReducedMotion.matches) {
    var waves = [];

    paths.forEach(function (path, index) {
      var original = path.getAttribute('d');
      var numbers = original.match(/-?\d+(\.\d+)?/g).map(Number);

      waves.push({
        path: path,
        numbers: numbers,
        speed: 0.0012 + index * 0.000045,
        phase: index * 0.5
      });
    });

    var frameId = null;
    var inView = true;

    function animate(time) {
      waves.forEach(function (wave) {
        var n = wave.numbers;
        var offset1 = Math.sin(time * wave.speed + wave.phase) * 12;
        var offset2 = Math.sin(time * wave.speed * 0.7 + wave.phase) * 8;

        wave.path.setAttribute('d',
          'M ' + n[0] + ',' + n[1] +
          ' C ' + n[2] + ',' + (n[3] + offset1) +
          ' ' + n[4] + ',' + (n[5] + offset2) +
          ' ' + n[6] + ',' + (n[7] + offset1) +
          ' S ' + n[8] + ',' + (n[9] + offset2) +
          ' ' + n[10] + ',' + n[11]
        );
      });

      frameId = requestAnimationFrame(animate);
    }

    function start() {
      if (frameId === null) frameId = requestAnimationFrame(animate);
    }

    function stop() {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    }

    function sync() {
      if (inView && !document.hidden) start();
      else stop();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        sync();
      }, { threshold: 0 }).observe(heroBg);
    }

    document.addEventListener('visibilitychange', sync);

    prefersReducedMotion.addEventListener('change', function (e) {
      if (e.matches) stop();
      else sync();
    });

    sync();
  }
})();
