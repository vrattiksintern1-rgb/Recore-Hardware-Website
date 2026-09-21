/* ==========================================================================
   REcore Hardware — site behaviour
   Vanilla JS, no dependencies.

   Contents
   1.  Config (edit these first)
   2.  Small helpers
   2b. Event tracking (GA4 + Meta Pixel)
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

    // Where enquiries are delivered (Round 1, item A2).
    email: 'sales@recorehardware.in',

    // Round 1, item B3 — successful submissions land here. Formspree performs
    // the redirect itself via the _next hidden field in index.html; this
    // constant is the fallback used if the form is ever submitted by fetch.
    thankYouUrl: '/thank-you/',

    businessName: 'REcore Hardware'
  };


  /* ------------------------------------------------------------------
     2. SMALL HELPERS
     ------------------------------------------------------------------ */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ------------------------------------------------------------------
     2b. EVENT TRACKING  —  Round 1, item C1

     One helper for both GA4 and the Meta Pixel. Both are no-ops until the
     agency's IDs are pasted into index.html, so this is safe to call from
     anywhere and never throws if the tags are absent.
     ------------------------------------------------------------------ */
  function trackEvent(name, params) {
    params = params || {};
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params);
      }
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', name, params);
      }
    } catch (err) {
      /* Tracking must never break the page for a dealer on a slow handset. */
    }
  }

  /* WhatsApp float, nav WhatsApp CTAs, and both click-to-call numbers.
     Delegated from the document so links added later are covered too. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;

    var href = link.getAttribute('href') || '';

    if (href.indexOf('wa.me') !== -1) {
      trackEvent('whatsapp_click', {
        location: link.classList.contains('wa-float') ? 'Floating button'
                : link.classList.contains('nav__cta') ? 'Navbar'
                : link.classList.contains('nav__drawer-cta') ? 'Mobile drawer'
                : 'Contact section'
      });
      return;
    }

    if (href.indexOf('tel:') === 0) {
      trackEvent('call_click', { phone_number: href.replace('tel:', '') });
    }
  }, true);



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
     11. ENQUIRY FORM  —  Round 1, items B1, B2, B3

     The form POSTs natively to the backend declared in its action
     attribute (Formspree). We validate first and let the browser do the
     submit, so the backend's own redirect to /thank-you/ fires and the
     conversion event on that page is recorded. Nothing is sent to
     WhatsApp on submit any more: WhatsApp is the secondary button.
     ------------------------------------------------------------------ */
  var form = $('#enquiryForm');
  var formNote = $('#formNote');
  var formSubmit = $('#enquirySubmit');
  var formWhatsApp = $('#enquiryWhatsApp');

  // True while the backend endpoint is still the unreplaced placeholder.
  // In that state we refuse to submit rather than lose the enquiry silently.
  function endpointReady(f) {
    var action = f.getAttribute('action') || '';
    return action.indexOf('__') === -1 && /^https?:\/\//.test(action);
  }

  function setFieldError(input, message) {
    var field = input.closest('.field');
    if (!field) return;
    var err = $('[data-err]', field);
    field.classList.toggle('is-invalid', !!message);
    if (err) err.textContent = message || '';
  }

  function setNote(text, state) {
    if (!formNote) return;
    formNote.textContent = text;
    formNote.classList.toggle('is-ok', state === 'ok');
    formNote.classList.toggle('is-err', state === 'err');
  }

  /* A valid Indian mobile is exactly 10 digits and starts 6, 7, 8 or 9.
     An optional +91 / 0091 / 91 / 0 prefix is stripped before checking, so
     a dealer typing +91 98765 43210 is accepted (Round 1, item B2). */
  function indianMobile(raw) {
    var digits = String(raw).replace(/[^\d]/g, '');
    digits = digits.replace(/^(?:0091|91|0)(?=[6-9]\d{9}$)/, '');
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  }

  function requireText(el, message, min) {
    var value = el.value.trim();
    if (value.length < (min || 1)) { setFieldError(el, message); return false; }
    setFieldError(el, '');
    return true;
  }

  function validate() {
    var ok = true;

    var name        = $('#fName');
    var phone       = $('#fPhone');
    var email       = $('#fEmail');
    var firm        = $('#fFirm');
    var city        = $('#fCity');
    var requirement = $('#fRequirement');

    if (!requireText(name, 'Please enter your name.', 2)) ok = false;

    // Phone — 10-digit Indian mobile (B2)
    if (!indianMobile(phone.value)) {
      setFieldError(phone, 'Enter a 10-digit Indian mobile number.');
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

    // The three dealer-qualifying fields (B2) — all required
    if (!requireText(firm, 'Please enter your firm or shop name.', 2)) ok = false;
    if (!requireText(city, 'Please enter your city.', 2)) ok = false;

    if (!requirement.value) {
      setFieldError(requirement, 'Please choose your monthly requirement.');
      ok = false;
    } else {
      setFieldError(requirement, '');
    }

    if (!ok) {
      var firstBad = $('.field.is-invalid input, .field.is-invalid select');
      if (firstBad) firstBad.focus();
    }

    return ok;
  }

  function buildMessage() {
    var lines = [
      'Hello ' + CONFIG.businessName + ',',
      '',
      'Name: ' + $('#fName').value.trim(),
      'Firm / Shop: ' + $('#fFirm').value.trim(),
      'City: ' + $('#fCity').value.trim(),
      'Phone: ' + $('#fPhone').value.trim()
    ];

    var email = $('#fEmail').value.trim();
    if (email) lines.push('Email: ' + email);

    var requirement = $('#fRequirement').value;
    if (requirement) lines.push('Monthly requirement: ' + requirement);

    var product = $('#fProduct').value;
    if (product) lines.push('Product interest: ' + product);

    var message = $('#fMessage').value.trim();
    if (message) { lines.push('', message); }

    lines.push('', 'Please send me the 2026 catalogue and pricing.');
    return lines.join('\n');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      if (!validate()) {
        e.preventDefault();
        setNote('Please correct the highlighted fields.', 'err');
        return;
      }

      if (!endpointReady(form)) {
        e.preventDefault();
        setNote(
          'The enquiry form is not connected yet. Please call +91 92571 58637 ' +
          'or use the WhatsApp button below.',
          'err'
        );
        // Loud in the console so this can never reach production unnoticed.
        if (window.console) {
          console.error(
            '[REcore] Enquiry form endpoint is still a placeholder. ' +
            'Replace __FORMSPREE_FORM_ID__ in the form action in index.html.'
          );
        }
        return;
      }

      // Valid and wired: let the browser POST. The backend redirects to
      // /thank-you/, where the GA4 conversion and the Pixel Lead event fire.
      trackEvent('enquiry_submit', { form_name: 'General enquiry' });
      setNote('Sending your enquiry…', 'ok');
      if (formSubmit) {
        formSubmit.disabled = true;
        formSubmit.textContent = 'Sending…';
      }
    });

    // Secondary route: hand the same enquiry to WhatsApp (Round 1, B1).
    if (formWhatsApp) {
      formWhatsApp.addEventListener('click', function () {
        if (!validate()) {
          setNote('Please correct the highlighted fields.', 'err');
          return;
        }
        trackEvent('whatsapp_click', { location: 'Enquiry form' });
        window.open(
          'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(buildMessage()),
          '_blank',
          'noopener'
        );
        setNote('Opening WhatsApp with your enquiry…', 'ok');
      });
    }

    // Clear a field's error as soon as the visitor starts fixing it
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { setFieldError(el, ''); });
      el.addEventListener('change', function () { setFieldError(el, ''); });
    });
  }


  /* ------------------------------------------------------------------
     12. FOOTER YEAR
     ------------------------------------------------------------------ */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
