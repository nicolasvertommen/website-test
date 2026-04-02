/* ============================================
   NERO — Landing Page Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Scroll-triggered animations (all types) ----
  const animatedSelectors = '.fade-up, .fade-left, .fade-right, .scale-in';

  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -30px 0px'
  };

  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // Support explicit delay via data-delay attribute
        const delay = parseInt(el.dataset.delay || '0', 10);

        // Or auto-stagger siblings
        let autoDelay = 0;
        if (!el.dataset.delay) {
          const parent = el.parentElement;
          const siblings = Array.from(parent.querySelectorAll(animatedSelectors));
          const index = siblings.indexOf(el);
          autoDelay = index * 100;
        }

        setTimeout(() => {
          el.classList.add('visible');
        }, delay || autoDelay);

        animObserver.unobserve(el);
      }
    });
  }, observerOptions);

  document.querySelectorAll(animatedSelectors).forEach(el => animObserver.observe(el));

  // Also animate section-title underlines
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        titleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.section-title').forEach(el => titleObserver.observe(el));

  // ---- Scroll progress bar ----
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }

  // ---- Nav scroll state ----
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    updateScrollProgress();
  }, { passive: true });

  // ---- Mobile menu toggle ----
  const toggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (toggle) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  }

  // ---- Animated stat counters ----
  const statNums = document.querySelectorAll('.stat-num[data-count]');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        animateCount(el, 0, target, 1400);
        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => countObserver.observe(el));

  function animateCount(el, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      if (anchor.hasAttribute('data-open-map') || anchor.hasAttribute('data-open-partner')) return;

      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ---- Hero floating particles ----
  const particleContainer = document.getElementById('heroParticles');
  if (particleContainer) {
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.bottom = '-10px';
      particle.style.width = (Math.random() * 4 + 2) + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDuration = (Math.random() * 6 + 6) + 's';
      particle.style.animationDelay = (Math.random() * 8) + 's';
      particle.style.background = Math.random() > 0.5 ? 'var(--green)' : 'var(--cyan)';
      particleContainer.appendChild(particle);
    }
  }

  // ---- Parallax scroll layers ----
  const parallaxElements = [
    { selector: '.hero-glow-1', speed: 0.03 },
    { selector: '.hero-glow-2', speed: -0.04 },
    { selector: '.station-glow', speed: 0.02 },
    { selector: '.product-card-large', speed: 0.015 },
    { selector: '.render-glow', speed: 0.02 },
  ];

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxElements.forEach(({ selector, speed }) => {
      const el = document.querySelector(selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Only animate if near viewport
      if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
        el.style.transform = el.style.transform.replace(/translateY\([^)]*\)/, '') || '';
        const offset = scrollY * speed;
        // Preserve existing transforms by adding parallax
        el.style.setProperty('--parallax-y', offset + 'px');
      }
    });
  }

  // Use lighter parallax via CSS custom property
  if (window.matchMedia('(min-width: 768px)').matches) {
    window.addEventListener('scroll', () => {
      requestAnimationFrame(updateParallax);
    }, { passive: true });
  }

  // ---- Hero visual parallax (enhanced) ----
  const heroVisual = document.querySelector('.hero-visual');
  const heroContent = document.querySelector('.hero-content');
  if (heroVisual && window.matchMedia('(min-width: 768px)').matches) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        // Hero image floats up slowly
        heroVisual.style.transform = `translateY(${y * 0.06}px)`;
        // Hero content moves slightly slower for depth
        if (heroContent) {
          heroContent.style.transform = `translateY(${y * 0.03}px)`;
          heroContent.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.8));
        }
      }
    }, { passive: true });
  }

  // ---- Tilt effect on step cards ----
  if (window.matchMedia('(min-width: 768px) and (hover: hover)').matches) {
    document.querySelectorAll('.step-card, .testimonial-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ---- Mouse glow follow on CTA card ----
  const ctaCard = document.querySelector('.cta-card');
  if (ctaCard) {
    ctaCard.addEventListener('mousemove', (e) => {
      const rect = ctaCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const glow = ctaCard.querySelector('.cta-glow');
      if (glow) {
        glow.style.left = x + 'px';
        glow.style.top = y + 'px';
        glow.style.transform = 'translate(-50%, -50%)';
      }
    });
  }

  // ---- Magnetic hover on CTA buttons ----
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn-primary.btn-lg, .btn-glow').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) translateY(-2px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ---- FAQ Accordion ----
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');

      document.querySelectorAll('.faq-item.active').forEach(activeItem => {
        activeItem.classList.remove('active');
        activeItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---- Modals ----
  const mapModal = document.getElementById('mapModal');
  const partnerModal = document.getElementById('partnerModal');

  function openModal(modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Initialize Leaflet map when map modal opens
    if (modal === mapModal) {
      setTimeout(() => {
        initLeafletMap();
      }, 100);
    }
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-map]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(mapModal);
    });
  });

  document.querySelectorAll('[data-open-partner]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(partnerModal);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      closeModal(overlay);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(modal => {
        closeModal(modal);
      });
    }
  });

  // ---- Leaflet Map ----
  const venues = [
    { id: 'berlin',   name: 'Berlin Antwerp',    lat: 51.2204, lng: 4.3997, address: 'Kleine Markt 1, 2000 Antwerpen' },
    { id: 'tabanco',  name: 'Tabanco',            lat: 51.2116, lng: 4.3952, address: 'Scheldestraat 36, 2000 Antwerpen' },
    { id: 'cantine',  name: 'Cantine Antwerp',    lat: 51.2109, lng: 4.3952, address: 'Scheldestraat 77, 2000 Antwerpen' },
    { id: 'barbossa', name: 'Caff\u00e8 Barbossa', lat: 51.2185, lng: 4.4062, address: 'Sint-Jorispoort 1, 2000 Antwerpen' },
    { id: 'zorro',    name: 'Bar Zorro',           lat: 51.2215, lng: 4.4010, address: 'Hendrik Conscienceplein 5, 2000 Antwerpen' },
    { id: 'kikibeach',    name: 'Kiki Beach',        lat: 51.3447, lng: 3.2593, address: 'Zeedijk-Duinbergen 387, 8301 Knokke-Heist' },
    { id: 'indibeach',    name: 'Indi Beach',        lat: 51.3535, lng: 3.2898, address: 'Zeedijk-Het Zoute 648, 8300 Knokke-Heist' },
    { id: 'knokkestrand', name: 'Knokke Strand',     lat: 51.3539, lng: 3.2918, address: 'Zeedijk-Het Zoute 664, 8300 Knokke-Heist' },
    { id: 'yssisbeach',   name: 'Yssis Beach',       lat: 51.3501, lng: 3.2822, address: 'Zeedijk-Albertstrand 542, 8300 Knokke-Heist' },
  ];

  let leafletMap = null;
  const leafletMarkers = {};

  function createNeroIcon() {
    return L.divIcon({
      className: 'nero-marker',
      html: '<div class="nero-marker-inner"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -34],
    });
  }

  function initLeafletMap() {
    if (leafletMap) {
      leafletMap.invalidateSize();
      return;
    }

    leafletMap = L.map('leafletMap', {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([51.28, 3.85], 9);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(leafletMap);

    const icon = createNeroIcon();

    venues.forEach(venue => {
      const marker = L.marker([venue.lat, venue.lng], { icon })
        .addTo(leafletMap)
        .bindPopup(
          `<h4>${venue.name}</h4><p>Nero station &middot; ${venue.address}</p>`,
          { className: 'nero-popup', closeButton: false }
        );

      marker.on('click', () => {
        highlightSidebar(venue.id);
      });

      leafletMarkers[venue.id] = marker;
    });

    // Fit bounds to show all markers
    const group = L.featureGroup(Object.values(leafletMarkers));
    leafletMap.fitBounds(group.getBounds().pad(0.3));
  }

  function highlightSidebar(venueId) {
    const mapLocations = document.querySelectorAll('.map-location');
    mapLocations.forEach(loc => {
      loc.classList.toggle('active', loc.dataset.venue === venueId);
      if (loc.dataset.venue === venueId) {
        loc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Sidebar click → fly to marker
  const mapLocations = document.querySelectorAll('.map-location');
  mapLocations.forEach(loc => {
    loc.addEventListener('click', () => {
      const venueId = loc.dataset.venue;
      mapLocations.forEach(l => l.classList.remove('active'));
      loc.classList.add('active');

      const marker = leafletMarkers[venueId];
      if (marker && leafletMap) {
        leafletMap.flyTo(marker.getLatLng(), 16, { duration: 0.8 });
        marker.openPopup();
      }
    });
  });

  const mapSearchInput = document.getElementById('mapSearch');
  if (mapSearchInput) {
    mapSearchInput.addEventListener('input', () => {
      const query = mapSearchInput.value.toLowerCase().trim();
      mapLocations.forEach(loc => {
        const venue = loc.dataset.venue.toLowerCase();
        const name = loc.querySelector('h4').textContent.toLowerCase();
        loc.style.display = (venue.includes(query) || name.includes(query)) ? '' : 'none';
      });
    });
  }

  // ---- Partner form submission (Formspree) ----
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqegdknv';

  const partnerForm = document.getElementById('partnerForm');
  const formSuccess = document.getElementById('formSuccess');

  if (partnerForm) {
    partnerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = partnerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Bezig met verzenden…';
      submitBtn.disabled = true;

      try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: new FormData(partnerForm),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          partnerForm.style.display = 'none';
          formSuccess.style.display = 'block';
        } else {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          alert('Er ging iets mis. Probeer het opnieuw of stuur een mail naar nerocharge@outlook.com.');
        }
      } catch (err) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        alert('Geen verbinding. Controleer je internet en probeer opnieuw.');
      }
    });
  }

  // ---- Cursor-following glow on benefit cards ----
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.benefit-group').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.background = `radial-gradient(circle 200px at ${x}px ${y}px, rgba(0,232,123,0.04), transparent), var(--white)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.background = '';
      });
    });
  }
});
