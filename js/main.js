/* ============================================
   ATLANTIS BEVCO - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ==========================================
     AGE VERIFICATION GATE
     ========================================== */
  var ageGate = document.getElementById('age-gate');
  var ageYes = document.getElementById('age-yes');
  var ageNo = document.getElementById('age-no');

  if (ageGate) {
    // Check if already verified this session
    if (sessionStorage.getItem('age-verified') === 'true') {
      ageGate.classList.add('hidden');
    } else {
      // Prevent scrolling while gate is visible
      document.body.style.overflow = 'hidden';
    }

    if (ageYes) {
      ageYes.addEventListener('click', function () {
        sessionStorage.setItem('age-verified', 'true');
        ageGate.classList.add('hidden');
        document.body.style.overflow = '';
        // Show cookie banner after age gate is dismissed
        showCookieBanner();
      });
    }

    if (ageNo) {
      ageNo.addEventListener('click', function () {
        // Redirect to a generic safe page
        window.location.href = 'https://www.responsibility.org/';
      });
    }
  }

  /* ==========================================
     COOKIE CONSENT BANNER
     ========================================== */
  var cookieBanner = document.getElementById('cookie-banner');
  var cookieAccept = document.getElementById('cookie-accept');
  var cookieDecline = document.getElementById('cookie-decline');

  function showCookieBanner() {
    if (!cookieBanner) return;
    var consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      cookieBanner.classList.remove('hidden');
    }
  }

  // Only show cookie banner if age gate is already verified
  if (sessionStorage.getItem('age-verified') === 'true') {
    showCookieBanner();
  }

  if (cookieAccept) {
    cookieAccept.addEventListener('click', function () {
      localStorage.setItem('cookie-consent', 'accepted');
      cookieBanner.classList.add('hidden');
      // Enable GA if it was deferred
      enableAnalytics();
    });
  }

  if (cookieDecline) {
    cookieDecline.addEventListener('click', function () {
      localStorage.setItem('cookie-consent', 'declined');
      cookieBanner.classList.add('hidden');
      disableAnalytics();
    });
  }

  function enableAnalytics() {
    // GA4 is loaded by default; this ensures it stays active
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }

  function disableAnalytics() {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
  }

  // Apply stored consent on load
  var storedConsent = localStorage.getItem('cookie-consent');
  if (storedConsent === 'declined') {
    disableAnalytics();
  }

  /* ==========================================
     NAVBAR - SCROLL BEHAVIOR
     ========================================== */
  var navbar = document.querySelector('.navbar');
  var isCatalogPage = document.body.getAttribute('data-page') === 'catalog';
  var isHomePage = document.querySelector('.hero') !== null;

  // Catalog page: auto-hide navbar on scroll
  if (isCatalogPage && navbar) {
    var lastScrollY = window.scrollY;
    var scrollThreshold = 5;

    window.addEventListener('scroll', function () {
      var currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar
        navbar.classList.add('navbar-hidden');
      } else if (currentScrollY < lastScrollY - scrollThreshold) {
        // Scrolling up - show navbar
        navbar.classList.remove('navbar-hidden');
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  // Homepage: transparent to solid on scroll
  if (isHomePage && navbar) {
    function handleNavbarScroll() {
      if (window.scrollY > 60) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    // Run once on load in case page is already scrolled
    handleNavbarScroll();
  }

  /* ==========================================
     MOBILE MENU TOGGLE
     ========================================== */
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isActive = hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';

      // When mobile menu opens, ensure navbar is solid
      if (isActive) {
        navbar.classList.add('navbar-scrolled');
      } else if (isHomePage && window.scrollY <= 60) {
        navbar.classList.remove('navbar-scrolled');
      }
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ==========================================
     HERO ROTATING TEXT
     ========================================== */
  var rotatingPhrases = [
    'Exceptional Spirits',
    'Fine Wines',
    'Craft Brands',
    'World-Class Selection',
    'Exceptional Service',
    'Custom RTD',
    'Vintage Bordeaux'
  ];

  var rotatingEl = document.querySelector('.hero-rotating-text');
  if (rotatingEl) {
    var currentIndex = 0;

    function rotateText() {
      rotatingEl.classList.remove('fade-in');
      rotatingEl.classList.add('fade-out');

      setTimeout(function () {
        currentIndex = (currentIndex + 1) % rotatingPhrases.length;
        rotatingEl.textContent = rotatingPhrases[currentIndex];
        rotatingEl.classList.remove('fade-out');
        rotatingEl.classList.add('fade-in');
      }, 400);
    }

    setInterval(rotateText, 3000);
  }

  /* ==========================================
     SWIPER BRAND SCROLLER
     ========================================== */
  if (typeof Swiper !== 'undefined' && document.querySelector('.brand-scroller')) {
    new Swiper('.brand-scroller', {
      slidesPerView: 2,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      breakpoints: {
        480: {
          slidesPerView: 3,
          spaceBetween: 24
        },
        768: {
          slidesPerView: 4,
          spaceBetween: 28
        },
        1024: {
          slidesPerView: 5,
          spaceBetween: 32
        }
      }
    });
  }

  /* ==========================================
     FADE-IN ON SCROLL (Intersection Observer)
     ========================================== */
  var fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    fadeElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ==========================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ========================================== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var navHeight = navbar ? navbar.offsetHeight : 0;
        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ==========================================
     CONTACT FORM HANDLING (mailto)
     ========================================== */
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('contact-name').value.trim();
      var company = document.getElementById('contact-company').value.trim();
      var email = document.getElementById('contact-email').value.trim();
      var inquiry = document.getElementById('contact-inquiry').value;
      var message = document.getElementById('contact-message').value.trim();

      var subject = encodeURIComponent(inquiry + ' - ' + name + (company ? ' (' + company + ')' : ''));
      var body = encodeURIComponent(
        'Name: ' + name + '\n' +
        'Company: ' + (company || 'N/A') + '\n' +
        'Email: ' + email + '\n' +
        'Inquiry Type: ' + inquiry + '\n\n' +
        message
      );

      window.location.href = 'mailto:info@atlantisbevco.com?subject=' + subject + '&body=' + body;
    });
  }

});
