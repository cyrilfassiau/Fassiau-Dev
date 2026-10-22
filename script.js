

(function () {
  'use strict';

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
      } catch (e) { }
      syncToggleLabel();
    });

    
    systemDark.addEventListener('change', function () {
      if (!document.documentElement.hasAttribute('data-theme')) syncToggleLabel();
    });
  }

 

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
            contactStatus.textContent = 'Merci, votre message a bien été envoyé\u202F!';
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
})();
