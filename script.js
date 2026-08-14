/* ============================================================
   Anirban Sikdar — Portfolio
   script.js  ·  Vanilla JS, zero dependencies
   ------------------------------------------------------------
    1. Helpers
    2. Theme toggle
    3. Mobile navigation
    4. Scroll: header, progress, to-top, nav highlight, rail
    5. Scroll-reveal
    6. Split-character headline
    7. Stat counters
    8. Rotating specialisation
    9. Pointer FX: aura, card lighting, magnetic buttons, tilt
   10. Console typing animation
   11. Copy email + toast
   12. Footer year
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var THEME_KEY = 'as-theme';

  /* ==========================================================
     1. HELPERS
     ========================================================== */
  function $(sel, scope) { return (scope || document).querySelector(sel); }

  function $$(sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  /** Collapse repeated calls into one per animation frame. */
  function rafThrottle(fn) {
    var queued = false;
    var lastArgs;
    return function () {
      lastArgs = arguments;
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        fn.apply(null, lastArgs);
      });
    };
  }

  /** Fire a callback the first time each element enters the viewport. */
  function onFirstView(elements, callback, threshold) {
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(callback);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        callback(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: threshold || 0.15, rootMargin: '0px 0px -6% 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ==========================================================
     2. THEME TOGGLE
     The inline <head> script already set data-theme before the
     first paint; this handles switching and persistence only.
     ========================================================== */
  var themeToggle = $('#themeToggle');
  var themeMeta = $('#themeColorMeta');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#08090b' : '#fcfcfd');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label',
        'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
    }
  }

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* private mode */ }
    });
  }

  /* ==========================================================
     3. MOBILE NAVIGATION
     ========================================================== */
  var navToggle = $('#navToggle');
  var nav = $('#primaryNav');

  function setNav(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('is-open'));
    });

    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () { setNav(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        navToggle.focus();
      }
    });

    window.addEventListener('resize', rafThrottle(function () {
      if (window.innerWidth > 900) setNav(false);
    }));
  }

  /* ==========================================================
     4. SCROLL BEHAVIOUR
     ========================================================== */
  var header = $('#siteHeader');
  var progress = $('#scrollProgress');
  var toTop = $('#toTop');
  var timeline = $('#timeline');
  var railFill = $('#tlFill');

  var navLinks = $$('.nav-link');

  // Pair each nav link with the section it targets.
  var watched = navLinks
    .map(function (link) {
      var href = link.getAttribute('href') || '';
      var section = href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
      return section ? { link: link, section: section } : null;
    })
    .filter(Boolean);

  function updateActiveLink(scrollY) {
    if (!watched.length) return;

    var probe = scrollY + window.innerHeight * 0.3;
    var active = null;

    watched.forEach(function (item) {
      if (item.section.offsetTop <= probe) active = item;
    });

    // The bottom of the page always belongs to the final section.
    if (scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      active = watched[watched.length - 1];
    }

    navLinks.forEach(function (link) { link.classList.remove('is-active'); });
    if (active) active.link.classList.add('is-active');
  }

  /** Fill the timeline rail in step with scroll position. */
  function updateRail() {
    if (!timeline || !railFill) return;
    var rect = timeline.getBoundingClientRect();
    var trigger = window.innerHeight * 0.55;
    var pct = clamp((trigger - rect.top) / rect.height, 0, 1);
    railFill.style.height = (pct * 100).toFixed(2) + '%';
  }

  var onScroll = rafThrottle(function () {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 640);

    if (progress) {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = clamp(scrollable > 0 ? (y / scrollable) * 100 : 0, 0, 100) + '%';
    }

    updateActiveLink(y);
    updateRail();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ==========================================================
     5. SCROLL-REVEAL
     ========================================================== */
  var revealItems = $$('.reveal');

  if (reduceMotion) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    onFirstView(revealItems, function (el) { el.classList.add('is-visible'); }, 0.12);
  }

  /* ==========================================================
     6. SPLIT-CHARACTER HEADLINE
     Wraps every character in its own span so each can blur in
     on a staggered delay. Words stay intact so wrapping is
     never broken mid-word, and nested markup (<em>) survives.
     ========================================================== */
  var splitTarget = $('[data-split]');

  if (splitTarget && !reduceMotion) {
    var charIndex = 0;

    function splitNode(node) {
      var frag = document.createDocumentFragment();

      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;

            if (!part.trim()) {
              frag.appendChild(document.createTextNode(part));
              return;
            }

            var word = document.createElement('span');
            word.className = 'word';

            part.split('').forEach(function (character) {
              var span = document.createElement('span');
              span.className = 'ch';
              span.style.setProperty('--i', charIndex++);
              span.textContent = character;
              word.appendChild(span);
            });

            frag.appendChild(word);
          });
        } else if (child.nodeType === 1) {
          var clone = child.cloneNode(false);
          clone.appendChild(splitNode(child));
          frag.appendChild(clone);
        }
      });

      return frag;
    }

    var split = splitNode(splitTarget);
    splitTarget.textContent = '';
    splitTarget.appendChild(split);

    window.requestAnimationFrame(function () {
      splitTarget.classList.add('is-in');
    });
  }

  /* ==========================================================
     7. STAT COUNTERS
     ========================================================== */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';

    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }

    var duration = 1400;
    var startTime = null;

    function step(now) {
      if (startTime === null) startTime = now;
      var t = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);              // easeOutCubic
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  onFirstView($$('[data-count]'), runCounter, 0.5);

  /* ==========================================================
     8. ROTATING SPECIALISATION
     ========================================================== */
  var rotator = $('#rotator');

  if (rotator && !reduceMotion) {
    var words = [
      'Automation Frameworks',
      'API Validation',
      'Performance Testing',
      'Security Testing'
    ];

    var spans = [$('.rotator-word', rotator)];

    for (var w = 1; w < words.length; w++) {
      var span = document.createElement('span');
      span.className = 'rotator-word';
      span.textContent = words[w];
      rotator.appendChild(span);
      spans.push(span);
    }

    var current = 0;

    window.setInterval(function () {
      var leaving = spans[current];
      current = (current + 1) % spans.length;
      var entering = spans[current];

      leaving.classList.remove('is-active');
      leaving.classList.add('is-leaving');
      entering.classList.remove('is-leaving');
      entering.classList.add('is-active');

      window.setTimeout(function () { leaving.classList.remove('is-leaving'); }, 500);
    }, 2800);
  }

  /* ==========================================================
     9. POINTER FX
     One delegated pointermove drives the page aura and the
     card border/glow coordinates, so there is a single
     rAF-throttled listener rather than one per card.
     ========================================================== */
  var aura = $('#aura');

  if (finePointer) {
    var onPointerMove = rafThrottle(function (event) {
      if (aura) {
        if (!aura.classList.contains('is-on')) aura.classList.add('is-on');
        aura.style.setProperty('--ax', event.clientX + 'px');
        aura.style.setProperty('--ay', event.clientY + 'px');
      }

      var card = event.target.closest ? event.target.closest('.card') : null;
      if (card) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (event.clientY - rect.top) + 'px');
      }
    });

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    /* --- Magnetic buttons --- */
    $$('.magnetic').forEach(function (btn) {
      var inner = $('.btn-inner', btn);

      btn.addEventListener('pointermove', function (event) {
        var rect = btn.getBoundingClientRect();
        var dx = (event.clientX - rect.left) / rect.width - 0.5;
        var dy = (event.clientY - rect.top) / rect.height - 0.5;
        btn.style.transform = 'translate(' + (dx * 6).toFixed(2) + 'px, ' +
                              (dy * 4 - 2).toFixed(2) + 'px)';
        if (inner) {
          inner.style.transform = 'translate(' + (dx * 5).toFixed(2) + 'px, ' +
                                   (dy * 3).toFixed(2) + 'px)';
        }
      });

      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
        if (inner) inner.style.transform = '';
      });
    });

    /* --- Console tilt --- */
    var tiltEl = $('[data-tilt]');

    if (tiltEl && !reduceMotion) {
      var stage = tiltEl.parentElement;

      stage.addEventListener('pointermove', function (event) {
        var rect = stage.getBoundingClientRect();
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;
        tiltEl.style.setProperty('--ty', (px * 11).toFixed(2));
        tiltEl.style.setProperty('--tx', (-py * 8).toFixed(2));
      });

      stage.addEventListener('pointerleave', function () {
        tiltEl.style.setProperty('--ty', '-6');
        tiltEl.style.setProperty('--tx', '2.5');
      });
    }
  }

  /* ==========================================================
     10. CONSOLE TYPING ANIMATION
     Lines are token arrays rather than HTML strings, so
     characters can be typed one at a time without ever
     splitting a tag.
     ========================================================== */
  var consoleOut = $('#consoleOut');

  var CONSOLE_LINES = [
    [{ t: '$ ', c: 'dim' }, { t: 'mvn test -DsuiteXmlFile=regression.xml' }],
    [],
    [{ t: '✔ ', c: 'ok' }, { t: 'LoginTest' }, { t: '            4 tests', c: 'dim' }],
    [{ t: '✔ ', c: 'ok' }, { t: 'BidPlacementTest' }, { t: '   12 tests', c: 'dim' }],
    [{ t: '✔ ', c: 'ok' }, { t: 'AutoBidLogicTest' }, { t: '    9 tests', c: 'dim' }],
    [{ t: '✔ ', c: 'ok' }, { t: 'RaceRuleEngineTest' }, { t: '  6 tests', c: 'dim' }],
    [{ t: '▲ ', c: 'warn' }, { t: 'RankRecalcTest' }, { t: '      1 retried', c: 'dim' }],
    [{ t: '✔ ', c: 'ok' }, { t: 'AuctionCloseTest' }, { t: '    7 tests', c: 'dim' }],
    [],
    [{ t: 'BUILD SUCCESS', c: 'ok' }, { t: '  ·  38 passed, 0 failed', c: 'dim' }]
  ];

  function renderConsole(instant) {
    if (!consoleOut) return;

    consoleOut.textContent = '';

    var caret = document.createElement('span');
    caret.className = 'caret';

    // Flatten the token list into a per-character work queue.
    var queue = [];
    CONSOLE_LINES.forEach(function (line, lineIndex) {
      line.forEach(function (token) {
        token.t.split('').forEach(function (character) {
          queue.push({ ch: character, cls: token.c, line: lineIndex });
        });
      });
      queue.push({ newline: true, line: lineIndex });
    });

    if (instant) {
      CONSOLE_LINES.forEach(function (line, lineIndex) {
        line.forEach(function (token) {
          var span = document.createElement('span');
          if (token.c) span.className = token.c;
          span.textContent = token.t;
          consoleOut.appendChild(span);
        });
        if (lineIndex < CONSOLE_LINES.length - 1) {
          consoleOut.appendChild(document.createTextNode('\n'));
        }
      });
      consoleOut.appendChild(caret);
      return;
    }

    var i = 0;
    var activeSpan = null;
    var activeClass = null;

    function tick() {
      if (i >= queue.length) {
        consoleOut.appendChild(caret);
        return;
      }

      var item = queue[i++];
      var delay = 11;

      if (item.newline) {
        consoleOut.appendChild(document.createTextNode('\n'));
        activeSpan = null;
        delay = 90;                       // brief pause between lines
      } else {
        if (!activeSpan || activeClass !== item.cls) {
          activeSpan = document.createElement('span');
          if (item.cls) activeSpan.className = item.cls;
          activeClass = item.cls;
          consoleOut.appendChild(activeSpan);
        }
        activeSpan.textContent += item.ch;
      }

      window.setTimeout(tick, delay);
    }

    tick();
  }

  if (consoleOut) {
    if (reduceMotion) {
      renderConsole(true);
    } else {
      onFirstView([consoleOut], function () { renderConsole(false); }, 0.25);
    }
  }

  /* ==========================================================
     11. COPY EMAIL + TOAST
     ========================================================== */
  var toast = $('#toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  var copyBtn = $('#copyEmail');

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email') || '';
      var label = $('#copyEmailLabel');

      function succeeded() {
        showToast('Email copied to clipboard');
        if (!label) return;
        label.textContent = 'Copied!';
        window.setTimeout(function () { label.textContent = 'Copy email'; }, 2000);
      }

      // execCommand covers file:// and older browsers where
      // navigator.clipboard is unavailable.
      function fallbackCopy() {
        var field = document.createElement('textarea');
        field.value = email;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.top = '-1000px';
        document.body.appendChild(field);
        field.select();

        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(field);

        if (ok) succeeded();
        else showToast(email);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(succeeded, fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }

  /* ==========================================================
     12. FOOTER YEAR
     ========================================================== */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Initial paint: header state, progress, active link, rail. */
  onScroll();
})();
