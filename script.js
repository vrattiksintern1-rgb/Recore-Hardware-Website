/* ==========================================================================
   REcore Hardware — site behaviour
   Vanilla JS, no dependencies, no build step.

   Contents
   1.  Config (edit these first)
   2.  Small helpers
   3.  Sticky navbar
   4.  Mobile nav drawer
   5.  Smooth scroll with navbar offset
   6.  Scrollspy (active nav link)
   7.  Scroll reveal animations
   8.  Category cards -> jump to Featured
   9.  Featured products carousel
   10. Gallery lightbox
   11. Enquiry form
   12. Footer year
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. CONFIG — change these and nothing else to update contact details
     ------------------------------------------------------------------ */
  var CONFIG = {
    // Primary WhatsApp number, digits only, with country code, no "+" or spaces.
    whatsapp: '919257158637',        // Radhey bhai — +91 92571 58637
    whatsappAlt: '919610361304',     // Bhagirath bhai — +91 96103 61304 (not used by the form)

    // EDIT ME: the address enquiries should go to in 'email' mode.
    email: 'info@recorehardware.com',

    // 'whatsapp' -> form opens WhatsApp with the message prefilled.
    // 'email'    -> form opens the visitor's mail client instead.
    // Either way nothing is sent from this site — it is a static page.
    formMode: 'whatsapp',

    businessName: 'REcore Hardware'
  };


  /* ------------------------------------------------------------------
     2. SMALL HELPERS
     ------------------------------------------------------------------ */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Current navbar height, so anchored sections never hide behind it.
  function navHeight() {
    var nav = $('#nav');
    return nav ? nav.offsetHeight : 0;
  }

  function scrollToEl(el) {
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.pageYOffset - navHeight() + 1;
    window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }


  /* ------------------------------------------------------------------
     3. STICKY NAVBAR — adds .is-stuck once the page has scrolled
     ------------------------------------------------------------------ */
  var nav = $('#nav');

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.pageYOffset > 20);
  }

  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();


  /* ------------------------------------------------------------------
     4. MOBILE NAV DRAWER
     ------------------------------------------------------------------ */
  var navToggle = $('#navToggle');
  var navLinks  = $('#navLinks');

  function closeNav() {
    if (!navToggle || !navLinks) return;
    navToggle.classList.remove('is-open');
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');
  }

  function openNav() {
    navToggle.classList.add('is-open');
    navLinks.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('nav-open');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      if (navLinks.classList.contains('is-open')) { closeNav(); } else { openNav(); }
    });

    // Tapping any link inside the drawer closes it
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', closeNav);
    });

    // Esc closes the drawer
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    // Reset the drawer if the viewport grows past the mobile breakpoint
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }


  /* ------------------------------------------------------------------
     5. SMOOTH SCROLL — intercepts in-page anchors so the sticky
     navbar height is accounted for (CSS scroll-padding covers the
     rest, this keeps it exact while the navbar resizes).
     ------------------------------------------------------------------ */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;

      var target = document.getElementById(id.slice(1));
      if (!target) return;

      e.preventDefault();
      closeNav();
      scrollToEl(target);

      // Keep the URL shareable without the browser's instant jump
      if (history.pushState) history.pushState(null, '', id);
    });
  });


  /* ------------------------------------------------------------------
     6. SCROLLSPY — highlights the nav link for the section in view
     ------------------------------------------------------------------ */
  var spyLinks = $$('.nav__link');
  var spyTargets = spyLinks
    .map(function (l) { return document.getElementById(l.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function onScrollSpy() {
    var line = window.pageYOffset + navHeight() + 80;
    var currentId = null;

    spyTargets.forEach(function (sec) {
      if (sec.offsetTop <= line) currentId = sec.id;
    });

    // At the very bottom, force the last section active
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 4) {
      currentId = spyTargets.length ? spyTargets[spyTargets.length - 1].id : currentId;
    }

    spyLinks.forEach(function (l) {
      l.classList.toggle('is-active', l.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', onScrollSpy, { passive: true });
  onScrollSpy();


  /* ------------------------------------------------------------------
     7. SCROLL REVEAL — fades elements in once, as they enter view
     ------------------------------------------------------------------ */
  var revealEls = $$('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    // No animation: just show everything
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target); // reveal once, then stop watching
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }


  /* ------------------------------------------------------------------
     8. CATEGORY CARDS — clicking one scrolls to Featured Products
     and preselects that category in the enquiry form.
     ------------------------------------------------------------------ */
  $$('.cat').forEach(function (card) {
    card.addEventListener('click', function () {
      var targetSel = card.getAttribute('data-scroll-to') || '#featured';
      var name = $('.cat__name', card);
      if (name) preselectProduct(name.textContent.trim());
      scrollToEl($(targetSel));
    });
  });

  // Matches a category name against the <select> options; falls back to
  // a loose "starts with" match so short card labels still hit.
  function preselectProduct(label) {
    var select = $('#fProduct');
    if (!select) return;

    var wanted = label.toLowerCase();
    var match = Array.prototype.find.call(select.options, function (opt) {
      var t = opt.text.toLowerCase();
      return t === wanted || t.indexOf(wanted) === 0 || wanted.indexOf(t) === 0;
    });

    if (match) select.value = match.value || match.text;
  }


  /* ------------------------------------------------------------------
     9. FEATURED PRODUCTS CAROUSEL
     Below 900px .prods is a horizontal snap-scroller; these buttons
     page it one card at a time. Above 900px it is a plain grid and
     the buttons are hidden by CSS.
     ------------------------------------------------------------------ */
  var track = $('#prods');
  var prodPrev = $('#prodPrev');
  var prodNext = $('#prodNext');

  if (track && prodPrev && prodNext) {
    function cardStep() {
      var card = $('.prod', track);
      if (!card) return track.clientWidth;
      // card width + the grid gap
      var gap = parseFloat(getComputedStyle(track).columnGap || '18') || 18;
      return card.getBoundingClientRect().width + gap;
    }

    function page(dir) {
      track.scrollBy({ left: dir * cardStep(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    prodPrev.addEventListener('click', function () { page(-1); });
    prodNext.addEventListener('click', function () { page(1); });

    // Grey out the arrows at either end
    function syncArrows() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prodPrev.disabled = track.scrollLeft <= 2;
      prodNext.disabled = track.scrollLeft >= max;
    }

    track.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    syncArrows();
  }

  // "Enquire" on a product card -> prefill the form and scroll to it
  $$('[data-enquire]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var product = btn.getAttribute('data-enquire');
      var message = $('#fMessage');

      preselectProduct(product);
      if (message && !message.value.trim()) {
        message.value = 'I would like pricing and availability for the ' + product + '.';
      }

      scrollToEl($('#contact'));
      // Focus the first empty field so the visitor can start typing
      window.setTimeout(function () {
        var name = $('#fName');
        if (name && !name.value) name.focus({ preventScroll: true });
      }, 650);
    });
  });


  /* ------------------------------------------------------------------
     10. GALLERY LIGHTBOX
     ------------------------------------------------------------------ */
  var galItems = $$('.gal__item');
  var lb       = $('#lightbox');
  var lbImg    = $('#lbImg');
  var lbCap    = $('#lbCap');
  var lbClose  = $('#lbClose');
  var lbPrev   = $('#lbPrev');
  var lbNext   = $('#lbNext');
  var lbIndex  = 0;
  var lastFocused = null;

  function showLightbox(i) {
    if (!galItems.length) return;

    // wrap around at both ends
    lbIndex = (i + galItems.length) % galItems.length;

    var item = galItems[lbIndex];
    var img  = $('img', item);
    var cap  = $('figcaption', item);

    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.getAttribute('alt') || '';
    lbCap.textContent = cap ? cap.textContent : '';

    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function hideLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  if (lb && galItems.length) {
    galItems.forEach(function (item, i) {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', 'Open image ' + (i + 1) + ' of ' + galItems.length);

      item.addEventListener('click', function () {
        lastFocused = item;
        showLightbox(i);
      });

      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          lastFocused = item;
          showLightbox(i);
        }
      });
    });

    lbClose.addEventListener('click', hideLightbox);
    lbPrev.addEventListener('click', function () { showLightbox(lbIndex - 1); });
    lbNext.addEventListener('click', function () { showLightbox(lbIndex + 1); });

    // Click the backdrop (but not the image) to close
    lb.addEventListener('click', function (e) {
      if (e.target === lb) hideLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape')     hideLightbox();
      if (e.key === 'ArrowLeft')  showLightbox(lbIndex - 1);
      if (e.key === 'ArrowRight') showLightbox(lbIndex + 1);
    });
  }


  /* ------------------------------------------------------------------
     11. ENQUIRY FORM
     Static site, so there is no server: on submit we validate, then
     hand the enquiry to WhatsApp (or the mail client) prefilled.
     ------------------------------------------------------------------ */
  var form = $('#enquiryForm');
  var formNote = $('#formNote');

  function setFieldError(input, message) {
    var field = input.closest('.field');
    if (!field) return;
    var err = $('[data-err]', field);
    field.classList.toggle('is-invalid', !!message);
    if (err) err.textContent = message || '';
  }

  function validate() {
    var ok = true;

    var name = $('#fName');
    var phone = $('#fPhone');
    var email = $('#fEmail');

    // Name — at least 2 characters
    if (!name.value.trim() || name.value.trim().length < 2) {
      setFieldError(name, 'Please enter your name.');
      ok = false;
    } else {
      setFieldError(name, '');
    }

    // Phone — 10 to 15 digits, ignoring spaces, dashes, brackets and "+"
    var digits = phone.value.replace(/[^\d]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setFieldError(phone, 'Please enter a valid phone number.');
      ok = false;
    } else {
      setFieldError(phone, '');
    }

    // Email — optional, but must look like an address if filled in
    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      setFieldError(email, 'Please enter a valid email address.');
      ok = false;
    } else {
      setFieldError(email, '');
    }

    if (!ok) {
      var firstBad = $('.field.is-invalid input');
      if (firstBad) firstBad.focus();
    }

    return ok;
  }

  function buildMessage() {
    var lines = [
      'Hello ' + CONFIG.businessName + ',',
      '',
      'Name: ' + $('#fName').value.trim(),
      'Phone: ' + $('#fPhone').value.trim()
    ];

    var email = $('#fEmail').value.trim();
    if (email) lines.push('Email: ' + email);

    var product = $('#fProduct').value;
    if (product) lines.push('Product interest: ' + product);

    var message = $('#fMessage').value.trim();
    if (message) { lines.push('', message); }

    lines.push('', 'Please send me the 2026 catalogue and pricing.');
    return lines.join('\n');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validate()) {
        formNote.textContent = 'Please correct the highlighted fields.';
        formNote.classList.remove('is-ok');
        return;
      }

      var body = buildMessage();
      var url;

      if (CONFIG.formMode === 'email') {
        url = 'mailto:' + CONFIG.email +
              '?subject=' + encodeURIComponent('Website enquiry — ' + CONFIG.businessName) +
              '&body=' + encodeURIComponent(body);
        window.location.href = url;
      } else {
        url = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(body);
        window.open(url, '_blank', 'noopener');
      }

      formNote.textContent = 'Opening ' + (CONFIG.formMode === 'email' ? 'your email app' : 'WhatsApp') + ' with your enquiry…';
      formNote.classList.add('is-ok');
      form.reset();
    });

    // Clear a field's error as soon as the visitor starts fixing it
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { setFieldError(el, ''); });
    });
  }


  /* ------------------------------------------------------------------
     12. FOOTER YEAR
     ------------------------------------------------------------------ */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
