/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb Atlas register (sign-up) page cleanup.
 *
 * The register page is a minimal sign-up/login page (NOT a marketing page): a logo,
 * a sign-up form (handled by the Forms workflow -> form block), and a slim legal
 * footer, with an interactive AI helper widget in the right panel. Everything except
 * the form and its intro headings is page chrome and must not become authorable content.
 *
 * Selectors verified against migration-work/register/cleaned.html (React/Emotion app;
 * hashed css-* classes are NOT stable, so chrome is targeted by ids / semantic
 * landmarks / stable exp-* hooks instead).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Interactive AI helper widget (right panel) — JS/AI-driven chrome requiring a
    // backend service, not static authorable content. Verified exp-ai-* / exp-input-bar.
    WebImporter.DOMUtils.remove(element, [
      '.exp-ai-wrapper',
      '.exp-input-bar',
      '[class*="exp-ai"]',
      '[class*="exp-input-bar"]',
    ]);

    // Invisible reCAPTCHA Enterprise + Optimizely internal frames (tracking/anti-bot
    // chrome). Remove before built-in rules touch their iframes/anchors.
    WebImporter.DOMUtils.remove(element, [
      '.grecaptcha-badge',
      '[class*="grecaptcha"]',
      '.g-recaptcha-response',
      'iframe[src*="recaptcha"]',
      'iframe[src*="optimizely"]',
    ]);

    // OneTrust cookie-consent banner ("This website uses cookies… Manage Cookies /
    // Accept Cookies"). Present in the live capture (cookielaw.org assets). Strip it
    // so its copy doesn't become default content.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#ot-sdk-container',
      '[id*="onetrust"]',
      '[class*="onetrust"]',
      '[class*="ot-sdk"]',
    ]);

    // Tracking pixels / beacons (ad-network conversion + retargeting). Their URLs
    // can carry unescaped brackets (usbrowserspeed) that crash WebImporter's
    // regex-based link/image rules, so remove them before any rule runs. Same host
    // set proven on the contact/product cleanups.
    const TRACKING_HOSTS = [
      'usbrowserspeed.com',
      'dpmsrv.com',
      'evs.blue.mongodb.com',
      'connect.facebook.net',
      'facebook.com/tr',
      'munchkin.marketo',
      'mktoresp.com',
      'doubleclick.net',
      'google-analytics.com',
      'googletagmanager.com',
      'googleadservices.com',
      'adnxs.com',
      'bat.bing.com',
      'trkn.us',
      'mathtag.com',
      'adsrvr.org',
      'cookielaw.org',
    ];
    element.querySelectorAll('a[href], img[src], [data-src]').forEach((node) => {
      const url = node.getAttribute('href') || node.getAttribute('src') || node.getAttribute('data-src') || '';
      if (TRACKING_HOSTS.some((h) => url.includes(h)) || /[[\]]/.test(url)) {
        node.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Top brand logo (auto-blocked as nav by EDS) and slim legal footer
    // (© + Company/Privacy/Terms links) — both page chrome, not section content.
    WebImporter.DOMUtils.remove(element, [
      'footer',
      '.exp-footer-wrapper',
      '[class*="exp-footer"]',
      '[role="contentinfo"]',
    ]);

    // The MongoDB logo image(s) at the very top of the left panel (alt="MongoDB logo").
    element.querySelectorAll('img[alt="MongoDB logo"]').forEach((img) => {
      const link = img.closest('a');
      (link || img).remove();
    });

    // Safe, never-authorable elements.
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'iframe',
      'noscript',
      'link',
      'source',
    ]);
  }
}
