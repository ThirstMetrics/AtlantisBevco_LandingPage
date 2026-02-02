/* ============================================
   ATLANTIS BEVCO - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* --- Mobile Menu Toggle --- */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const isActive = hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';
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

  /* --- Hero Rotating Text --- */
  const rotatingPhrases = [
    'Exceptional Spirits',
    'Fine Wines',
    'Craft Brands',
    'World-Class Selection',
    'Exceptional Service',
    'Custom RTD',
    'Vintage Bordeaux'
  ];

  const rotatingEl = document.querySelector('.hero-rotating-text');
  if (rotatingEl) {
    let currentIndex = 0;

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

  /* --- Swiper Brand Scroller --- */
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

  /* --- Fade-in on Scroll (Intersection Observer) --- */
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
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
    // Fallback: just show everything
    fadeElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* --- Smooth Scroll for Anchor Links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var navHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 0;
        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* --- Contact Form Handling (mailto) --- */
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
