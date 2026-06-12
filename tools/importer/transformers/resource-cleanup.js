/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb resource-article (resources/basics) site-wide cleanup.
 *
 * Strips the same non-authorable chrome as tools/importer/transformers/mongodb-cleanup.js
 * and tools/importer/transformers/blog-cleanup.js (the proven product/blog cleanups) so it
 * doesn't pollute imported article content. Every selector was re-verified against
 * migration-work/nosql/cleaned.html for the resource-article template (React/Next.js
 * source, contentstack/webimages CDN — NOT Scene7/Dynamic Media, so no DM transformer
 * is needed).
 *
 * Notes on this capture (per migration-work/nosql/metadata.json + page-structure.json):
 * - The scraper already excluded the OneTrust / privacy alertdialog, the cookie banner,
 *   the Intercom messenger, and the Optimizely/experiment + tracking <script> chrome.
 *   Defensive selectors for all of them are kept so the transformer stays correct on
 *   other resource captures.
 * - VERIFIED present in this capture:
 *     line 2     launch/pencil promo banner  -> div.relative.z-[9999].w-full
 *     line 36    #universal-nav (class "sticky top-inc00 z-[9999] w-full")
 *     line 37    <nav>
 *     line 70    #addsearch
 *     line 1109  <iframe src="https://charts.mongodb.com/...">  (LEGITIMATE Charts embed)
 *     line 1934  <footer> (incl. in-footer language-selector widget leftovers)
 *
 * 🚨 CRITICAL — DO NOT strip <iframe> globally on this page.
 *   This article contains a legitimate MongoDB Charts iframe
 *   (iframe[src*='charts.mongodb.com'], verified line 1109) that the `embed` parser
 *   needs. The embed parser runs during parsing (between the two hooks) and replaces
 *   that iframe with an `embed` block table before afterTransform cleanup — but to be
 *   safe we never blanket-remove <iframe>. Instead we remove ONLY iframes that are NOT
 *   charts.mongodb.com (e.g. tracking iframes). Unlike mongodb-cleanup.js /
 *   blog-cleanup.js (whose captures had no surviving iframe), 'iframe' is intentionally
 *   ABSENT from the safe-element removal list below.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Block names this resource-article template can emit (from page-templates.json).
// Used by the defensive block-table dedup pass below; the React source double-renders
// some desktop/mobile component copies, so a block can be emitted more than once.
const BLOCK_NAMES = new Set(['hero', 'codepanel', 'table', 'embed', 'accordion', 'sidebar', 'endcap']);

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / consent / chat widgets that would block or pollute block parsing.
    // Defensive: scraper already excluded these from this capture, but these are
    // stable selectors for mongodb's OneTrust + Intercom integrations.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',                  // OneTrust container (if present)
      '[role="alertdialog"]',                   // privacy / cookie dialog
      'region[aria-label="Cookie banner"]',     // cookie banner region
      '[aria-label="Cookie banner"]',           // cookie banner region (no role)
      '.intercom-lightweight-app',              // Intercom messenger root
      '[class*="intercom"]',                    // any Intercom chrome
      '[aria-label="Open Intercom Messenger"]', // Intercom launcher button
    ]);

    // Tracking pixels / beacons injected by 3rd-party analytics. These carry
    // hrefs/srcs with unescaped brackets (e.g. usbrowserspeed.com ...puid=...[1164]a[NA]...)
    // that crash WebImporter's link/image rules ("Range out of order in character class").
    // Remove the offending nodes before any built-in rule processes them.
    //
    // IMPORTANT: facebook is matched ONLY as `connect.facebook.net` / `facebook.com/tr`
    // (the tracking endpoints) so any authorable facebook.com/sharer.php share link
    // would be preserved.
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
    ];
    element.querySelectorAll('a[href], img[src], [data-src]').forEach((node) => {
      const url = node.getAttribute('href') || node.getAttribute('src') || node.getAttribute('data-src') || '';
      // Known tracking hosts, OR any url with unescaped brackets that breaks regex-based rules.
      if (TRACKING_HOSTS.some((h) => url.includes(h)) || /[[\]]/.test(url)) {
        node.remove();
      }
    });

    // Tracking <iframe> beacons (e.g. doubleclick / facebook tracking pixels rendered
    // as iframes). 🚨 NEVER touch the charts.mongodb.com embed — only remove iframes
    // whose src is NOT charts.mongodb.com. The embed parser claims the charts iframe
    // later in the pipeline. Done in beforeTransform so a broken tracking-iframe src
    // (unescaped brackets) can't crash the built-in rules during parsing.
    element.querySelectorAll('iframe').forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      if (!src.includes('charts.mongodb.com')) {
        iframe.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (verified in this capture, plus defensive selectors
    // for chrome the scraper already stripped on this page).
    WebImporter.DOMUtils.remove(element, [
      '#universal-nav',       // verified line 36: top utility nav (sticky bar)
      '#nav',                 // defensive: main nav (not in this capture)
      '#sub-nav',             // defensive: secondary nav (not in this capture)
      '#addsearch',           // verified line 70: search input
      'nav',                  // verified line 37: nav element
      'footer',               // verified line 1934: footer (incl. in-footer
                              //   language-selector widget leftovers)
      '[role="contentinfo"]', // footer landmark fallback
    ]);

    // Top launch/pencil promo banner — first body-level div carrying the promo
    // (LAUNCH / AI DATA blog links). Verified line 2: <div class="relative z-[9999] w-full">.
    // Targeted by exact class string to avoid matching #universal-nav, which uses
    // a different class ("sticky top-inc00 z-[9999] w-full").
    const promoBanner = element.querySelector('div.relative.z-\\[9999\\].w-full');
    if (promoBanner) promoBanner.remove();

    // Next.js route announcer (a11y live region) — defensive: not present in this
    // capture but stripped on other mongodb captures. Non-authorable.
    element.querySelectorAll('next-route-announcer').forEach((el) => el.remove());

    // Safe, never-authorable elements + tracking/experiment chrome.
    // 🚨 'iframe' is INTENTIONALLY OMITTED here — the charts.mongodb.com embed must
    // survive for the embed parser. Tracking iframes were already removed in
    // beforeTransform (everything that is NOT charts.mongodb.com).
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
      'source',
      '[role="alert"]',
    ]);

    // De-duplicate block tables defensively. The source double-renders some components
    // (React desktop `lg:block` + mobile `lg:hidden` copies, and Radix tab/accordion
    // portals), so parsers can emit the same block more than once.
    //
    // At afterTransform time the importer has NOT yet converted block tables to
    // `<div class="blockname">` — they are still <table> elements whose first cell text
    // is the block name. Detect blocks by that first-cell convention. For exact +
    // near duplicates with the same label, keep the LONGER (richer) copy, drop the shorter.
    const byLabel = new Map();
    element.querySelectorAll('table').forEach((table) => {
      const firstCell = table.querySelector('th, td');
      if (!firstCell) return;
      const nameText = (firstCell.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!BLOCK_NAMES.has(nameText)) return;
      const text = (table.textContent || '').replace(/\s+/g, ' ').trim();
      const label = `${nameText}::${text.slice(0, 120)}`;
      const existing = byLabel.get(label);
      if (!existing) {
        byLabel.set(label, table);
        return;
      }
      if (text.length > (existing.textContent || '').replace(/\s+/g, ' ').trim().length) {
        existing.remove();
        byLabel.set(label, table);
      } else {
        table.remove();
      }
    });
  }
}
