/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb homepage cleanup.
 *
 * Strips non-authorable chrome and the responsive / SSR duplicate component copies that
 * would otherwise leak in as default content. The homepage is a React/Next.js + Emotion
 * app (hashed css-* classes are not stable), so chrome is targeted by ids, landmarks, and
 * stable component-prefix classes (p13n-*, webxp-471-*, bnr__*).
 *
 * Verified against migration-work/homepage/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const TRACKING_HOSTS = [
  'usbrowserspeed.com', 'dpmsrv.com', 'evs.blue.mongodb.com', 'connect.facebook.net',
  'facebook.com/tr', 'munchkin.marketo', 'mktoresp.com', 'doubleclick.net',
  'google-analytics.com', 'googletagmanager.com', 'googleadservices.com', 'adnxs.com',
  'bat.bing.com', 'trkn.us', 'mathtag.com', 'adsrvr.org', 'cookielaw.org',
  'intercomcdn.com', 'downloads.intercomcdn.com',
];

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Interactive / decorative hero chrome: the @lg-chat AI assistant widget, the
    // persona toggle control, the promo/pencil launch banner, the spotlight bg video,
    // and the decorative hero background image. None are authorable content.
    WebImporter.DOMUtils.remove(element, [
      '#p13n-hp-chat-root',          // @lg-chat LeafyGreen AI assistant (SDK chrome)
      '.p13n-hp-role-toggle-container', // Builder/Business-Leader persona toggle
      '.p13n-promo-banner',          // "New: MongoDB 8.3" launch banner
      '.p13n-spotlight',             // spotlight bg video + rive canvas
      '.hero-bg',                    // decorative hero gradient image
      '.p13n-trust-logos',           // small hero trust-logo strip (decorative)
    ]);

    // Responsive duplicate of "Deploy Your Way": the mobile .bnr__ slider mirrors the
    // desktop .webxp-471 carousel (the parser builds the cards block from .webxp-471).
    WebImporter.DOMUtils.remove(element, ['.bnr__inner']);

    // Mobile "ddp" duplicate of the use-case section: a ddp heading + ddp-tabs button row
    // + a <select> dropdown mirroring the desktop radix tablist (which the parser builds
    // from [id^="radix-:r0:-trigger-"]). Remove the whole ddp wrapper + its mobile chrome.
    WebImporter.DOMUtils.remove(element, [
      '.ddp-experiment-wrapper',
      '.ddp-tabs-wrapper',
      '.ddp-tabs-selector',
      '.ddp-top-description',
      '.ddp-mobile-link',
      '[class*="ddp-tab"]',
    ]);

    // "TRUSTED BY" logo strip that sits inside the use-case section (a small partner-logo
    // rail, decorative — not authorable content). Anchored on its label span text.
    const trustedLabel = Array.from(element.querySelectorAll('span')).find(
      (s) => /^trusted by$/i.test((s.textContent || '').trim()),
    );
    if (trustedLabel) {
      // Climb to the rail container (holds the label + the logo images) and remove it.
      let rail = trustedLabel;
      for (let i = 0; i < 4 && rail.parentElement; i += 1) {
        rail = rail.parentElement;
        if (rail.querySelectorAll('img').length >= 3) break;
      }
      rail.remove();
    }

    // SSR/CSR duplicate of the primary pathfinder ("Your AI Data Platform is Ready").
    // The authored copy is a .wn-section (p.wn-title); this duplicate uses an <h2>
    // (h2.css-1es21qo) inside a hashed-class block. Remove that whole duplicate block
    // by climbing from its <h2> to the nearest reasonably-bounded ancestor.
    const dupHeading = Array.from(element.querySelectorAll('h2')).find(
      (h) => /your ai data platform is ready/i.test((h.textContent || '').trim())
        && !h.closest('.wn-section'),
    );
    if (dupHeading) {
      // Climb up to the block wrapper that holds the START HERE column + image but not
      // the rest of the page. Heuristic: the ancestor whose text contains both the
      // duplicate heading and "START HERE" but does NOT contain a use-case tablist.
      let node = dupHeading;
      let target = dupHeading;
      for (let i = 0; i < 8 && node.parentElement; i += 1) {
        node = node.parentElement;
        const text = node.textContent || '';
        if (/start here/i.test(text) && !node.querySelector('[id^="radix-:r0:-trigger-"]')) {
          target = node;
        } else if (node.querySelector('[id^="radix-:r0:-trigger-"]')) {
          break;
        }
      }
      target.remove();
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Site chrome: top nav, footer, search input, and footer landmark.
    WebImporter.DOMUtils.remove(element, [
      '#universal-nav',
      '#nav',
      '#sub-nav',
      '#addsearch',
      'nav',
      'footer',
      '[role="contentinfo"]',
    ]);

    // Top launch/pencil promo banner (the "LAUNCH … / AI DATA …" blog-link strip).
    // Verified line 6: <div class="relative z-[9999] w-full">. Targeted by exact class.
    const promoBanner = element.querySelector('div.relative.z-\\[9999\\].w-full');
    if (promoBanner) promoBanner.remove();

    // OneTrust cookie-consent banner + its copy/close-icon ("This website uses cookies…
    // Manage Cookies / Accept Cookies"). Present in the live capture (cookielaw.org).
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#ot-sdk-container',
      '[id*="onetrust"]',
      '[class*="onetrust"]',
      '[class*="ot-sdk"]',
    ]);

    // Safe, never-authorable elements.
    WebImporter.DOMUtils.remove(element, [
      'script', 'style', 'iframe', 'noscript', 'link', 'source', 'canvas', 'video',
      'next-route-announcer',
    ]);

    // Tracking pixels / beacons (some carry unescaped brackets that crash the
    // regex-based link/image rules).
    element.querySelectorAll('a[href], img[src], [data-src]').forEach((node) => {
      const url = node.getAttribute('href') || node.getAttribute('src') || node.getAttribute('data-src') || '';
      if (TRACKING_HOSTS.some((h) => url.includes(h)) || /[[\]]/.test(url)) {
        node.remove();
      }
    });

    // De-duplicate block tables (desktop/mobile or SSR/CSR copies that parsers may emit
    // more than once). Blocks are <table> at afterTransform time; first cell = block name.
    const BLOCK_NAMES = new Set(['hero', 'quotecase', 'pathfinder', 'logowall', 'cards', 'tabs']);
    const byLabel = new Map();
    element.querySelectorAll('table').forEach((table) => {
      const firstCell = table.querySelector('th, td');
      if (!firstCell) return;
      const nameText = (firstCell.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const baseName = nameText.split('(')[0].trim();
      if (!BLOCK_NAMES.has(baseName)) return;
      const text = (table.textContent || '').replace(/\s+/g, ' ').trim();
      const key = `${baseName}::${text.slice(0, 80)}`;
      const existing = byLabel.get(key);
      if (!existing) {
        byLabel.set(key, table);
      } else if (text.length > (existing.textContent || '').replace(/\s+/g, ' ').trim().length) {
        existing.remove();
        byLabel.set(key, table);
      } else {
        table.remove();
      }
    });
  }
}
