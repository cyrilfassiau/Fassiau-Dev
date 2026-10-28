

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

 

  var island = document.getElementById('island');
  var islandToggle = document.getElementById('island-toggle');
  var islandCompact = document.getElementById('island-compact');
  var islandPanel = document.getElementById('island-panel');
  var chipLabel = document.getElementById('island-chip-label');
  var chipIcon = document.getElementById('island-chip-icon');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fitIsland = function () {};

  if (island && islandToggle && islandCompact && islandPanel) {
    var isOpen = function () { return island.classList.contains('is-open'); };

    // La forme s'anime entre deux tailles reelles : on mesure le contenu de
    // l'etat vise (pilule ou panneau) et on lui donne ses dimensions.
    fitIsland = function () {
      var target = isOpen() ? islandPanel : islandCompact;
      island.style.setProperty('--island-w', target.offsetWidth + 'px');
      island.style.setProperty('--island-h', target.offsetHeight + 'px');
    };

    var fitWithoutAnimation = function () {
      island.classList.add('no-anim');
      fitIsland();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { island.classList.remove('no-anim'); });
      });
    };

    var openIsland = function () {
      island.classList.add('is-open');
      islandToggle.setAttribute('aria-expanded', 'true');
      island.parentElement.classList.add('has-open-island');
      islandToggle.setAttribute('aria-label', 'Fermer le menu');
      fitIsland();
    };

    var closeIsland = function () {
      island.classList.remove('is-open');
      islandToggle.setAttribute('aria-expanded', 'false');
      island.parentElement.classList.remove('has-open-island');
      islandToggle.setAttribute('aria-label', 'Ouvrir le menu');
      fitIsland();
    };

    islandToggle.addEventListener('click', function () {
      if (isOpen()) closeIsland();
      else openIsland();
    });

    // Toute la pilule fermee est cliquable, pas seulement le bouton.
    islandCompact.addEventListener('click', openIsland);

    islandPanel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeIsland);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        closeIsland();
        islandToggle.focus();
      }
    });

    document.addEventListener('pointerdown', function (e) {
      if (isOpen() && !island.contains(e.target)) closeIsland();
    });

    // Le focus clavier quitte l'ilot : on le referme.
    island.addEventListener('focusout', function (e) {
      if (isOpen() && e.relatedTarget && !island.contains(e.relatedTarget)) closeIsland();
    });

    window.addEventListener('resize', fitWithoutAnimation);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWithoutAnimation);
    fitWithoutAnimation();
  }

  // Affiche dans la pilule la section en cours.
  var updateChip = function (link) {
    if (!chipLabel || !chipIcon) return;
    var label = link.textContent.trim();
    if (chipLabel.textContent === label) return;

    chipLabel.textContent = label;
    chipIcon.setAttribute('href', '#' + link.getAttribute('data-icon'));
    if (chipLabel.animate && !reduceMotion.matches) {
      chipLabel.animate(
        [{ opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0)' }],
        { duration: 260, easing: 'ease-out' }
      );
    }
    if (island && !island.classList.contains('is-open')) fitIsland();
  };

 

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link[href^="#"]'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      navLinks.forEach(function (link) {
        var on = link.getAttribute('href') === '#' + id;
        link.classList.toggle('active', on);
        if (on) {
          link.setAttribute('aria-current', 'location');
          updateChip(link);
        } else {
          link.removeAttribute('aria-current');
        }
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
