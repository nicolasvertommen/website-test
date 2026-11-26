(function () {
  const GA_ID = 'G-M1K8YC77KC';
  const KEY = 'nero_analytics';

  function loadGoogleAnalytics() {
    if (window.gtag) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  function track(name, params) {
    if (window.gtag) window.gtag('event', name, params || {});
  }

  function readChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function saveChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function showBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML =
      '<p>Wij gebruiken Google Analytics om te zien welke onderdelen van de site nuttig zijn. ' +
      'Zonder jouw akkoord meten we niets. <a href="privacybeleid.html">Privacybeleid</a></p>' +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="cookie-no">Weigeren</button>' +
      '<button type="button" class="cookie-yes">Akkoord</button>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelector('.cookie-yes').addEventListener('click', () => {
      saveChoice('yes');
      loadGoogleAnalytics();
      banner.remove();
    });
    banner.querySelector('.cookie-no').addEventListener('click', () => {
      saveChoice('no');
      banner.remove();
    });
  }

  const choice = readChoice();
  if (choice === 'yes') loadGoogleAnalytics();
  if (choice !== 'yes' && choice !== 'no') showBanner();

  document.addEventListener('click', (e) => {
    const gmaps = e.target.closest('.map-gmaps');
    if (gmaps) {
      track('route_google_maps', { station: gmaps.closest('.map-location').dataset.venue });
      return;
    }
    const chip = e.target.closest('.map-chip');
    if (chip) {
      track('map_filter', { category: chip.dataset.cat });
      return;
    }
    const station = e.target.closest('.map-location');
    if (station) {
      track('station_select', { station: station.dataset.venue });
      return;
    }
    const near = e.target.closest('#mapNearBtn');
    if (near) {
      track('near_me_click');
      return;
    }
    const map = e.target.closest('[data-open-map]');
    if (map) {
      track('open_station_map');
      return;
    }
    const partner = e.target.closest('[data-open-partner]');
    if (partner) {
      track('partner_open', { page: location.pathname });
      return;
    }
    if (e.target.closest('[data-next-step]')) {
      track('partner_step_1_done');
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'partnerForm') track('partner_submit');
  });
})();
