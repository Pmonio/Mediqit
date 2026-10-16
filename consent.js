(() => {
  const choiceKey = 'mediqit-ad-consent-v1';
  const validChoices = new Set(['granted', 'denied']);
  let configPromise;
  let tagLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', true);

  const readChoice = () => {
    try {
      const value = localStorage.getItem(choiceKey);
      return validChoices.has(value) ? value : null;
    } catch {
      return null;
    }
  };

  const saveChoice = (choice) => {
    try { localStorage.setItem(choiceKey, choice); } catch {}
  };

  const applyChoice = (choice) => {
    window.gtag('consent', 'update', {
      ad_storage: choice,
      ad_user_data: choice,
      ad_personalization: choice,
      analytics_storage: 'denied',
    });
    document.documentElement.dataset.adConsent = choice;
  };

  const getConfig = () => {
    if (!configPromise) {
      configPromise = fetch('/api/ads-config', { cache: 'no-store', credentials: 'same-origin' })
        .then((response) => response.ok ? response.json() : null)
        .catch(() => null);
    }
    return configPromise;
  };

  const loadTag = async () => {
    const config = await getConfig();
    if (!config?.enabled || tagLoaded) return config;
    tagLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.tagId)}`;
    document.head.append(script);
    window.gtag('js', new Date());
    window.gtag('config', config.tagId, { allow_enhanced_conversions: false });
    return config;
  };

  const closeBanner = () => document.getElementById('cookie-consent')?.remove();

  const choose = (choice) => {
    saveChoice(choice);
    applyChoice(choice);
    closeBanner();
  };

  const showBanner = () => {
    if (document.getElementById('cookie-consent')) return;
    const banner = document.createElement('section');
    banner.id = 'cookie-consent';
    banner.className = 'cookie-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'cookie-title');
    banner.innerHTML = `
      <div>
        <strong id="cookie-title">Advertising cookies</strong>
        <p>We use the Google tag to measure whether our ads lead to launch-list sign-ups. The site works the same if you decline. <a href="/privacy#cookies">Read our privacy notice</a>.</p>
      </div>
      <div class="cookie-actions">
        <button type="button" data-cookie-choice="denied">Decline</button>
        <button type="button" class="cookie-accept" data-cookie-choice="granted">Accept</button>
      </div>`;
    banner.addEventListener('click', (event) => {
      const button = event.target.closest('[data-cookie-choice]');
      if (button) choose(button.dataset.cookieChoice);
    });
    document.body.append(banner);
    banner.querySelector('[data-cookie-choice="granted"]')?.focus({ preventScroll: true });
  };

  const addFooterControls = () => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    if (!footer.querySelector('.business-identity')) {
      const identity = document.createElement('span');
      identity.className = 'business-identity';
      identity.textContent = 'Mediqit Healthcare Solutions · Nigeria';
      const copyright = footer.querySelector('.copyright');
      if (copyright) copyright.append(identity);
      else footer.append(identity);
    }
    if (!footer.querySelector('[data-cookie-settings]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cookie-settings';
      button.dataset.cookieSettings = '';
      button.textContent = 'Cookie settings';
      button.addEventListener('click', showBanner);
      (footer.querySelector('.footer-links') || footer).append(button);
    }
  };

  window.mediqitAds = {
    get choice() { return readChoice(); },
    openSettings: showBanner,
    async trackSignup() {
      const config = await loadTag();
      if (!config?.enabled) return false;
      window.gtag('event', 'conversion', {
        send_to: `${config.tagId}/${config.signupLabel}`,
        value: 1.0,
        currency: 'NGN',
      });
      return true;
    },
  };

  const existingChoice = readChoice();
  if (existingChoice) applyChoice(existingChoice);
  loadTag();

  const ready = () => {
    addFooterControls();
    if (!readChoice()) showBanner();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
