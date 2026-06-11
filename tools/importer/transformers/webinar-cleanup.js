/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb webinar (on-demand) site-wide cleanup.
 *
 * Strips the same non-authorable chrome as the proven product-page cleanup
 * (tools/importer/transformers/mongodb-cleanup.js) and the blog cleanup
 * (tools/importer/transformers/blog-cleanup.js) so it doesn't pollute imported
 * webinar content. Every selector below was re-verified against
 * migration-work/webinar/cleaned.html for the webinar template (React/Next.js
 * source, webimages.mongodb.com / contentstack CDN — NOT Scene7 / Dynamic Media,
 * so no DM transformer is needed).
 *
 * Notes on this capture (per migration-work/webinar/metadata.json + page-structure.json):
 * - The scraper already excluded the OneTrust / privacy alertdialog, the cookie
 *   banner, the Intercom messenger, and all tracking <script> chrome. No
 *   <script>, <style>, <iframe>, <noscript>, #nav, #sub-nav, [role=contentinfo],
 *   [role=alertdialog], or [role=alert] survive in this capture. Defensive
 *   selectors for all of them are kept so the transformer stays correct on other
 *   webinar captures.
 * - VERIFIED present in this capture:
 *     line 4    launch/pencil promo banner  -> div.relative.z-[9999].w-full
 *     line 38   #universal-nav (class "sticky top-inc00 z-[9999] w-full")
 *     line 39   <nav>
 *     line 72   #addsearch
 *     line 1031 <footer> (incl. in-footer language-selector / cookie leftovers)
 *     line 1186 <next-route-announcer>
 * - The ONLY twitter / linkedin / facebook URLs in this capture are the legitimate
 *   SHARE links inside the authorable <aside> rail (verified lines 860, 863, 866):
 *     twitter.com/intent/tweet?...   linkedin.com/shareArticle?...   facebook.com/sharer.php?...
 *   The tracking-host list below intentionally matches the tracking endpoints
 *   `connect.facebook.net` and `facebook.com/tr` only (never a bare "facebook"),
 *   so all three share buttons survive.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Block names this webinar template can emit (from page-templates.json). Used by
// the defensive block-table dedup pass below; the React source double-renders
// desktop (`lg:block`) + mobile (`lg:hidden`) copies of the rail and the related
// grid, so a block can be emitted twice.
const BLOCK_NAMES = new Set(['video', 'sidebar', 'cards']);

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
    // (the tracking endpoints) so the authorable facebook.com/sharer.php share link in
    // the <aside> rail (verified line 866) is preserved. The twitter.com/intent and
    // linkedin.com/shareArticle share links are never matched by this list either.
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
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (verified in this capture, plus defensive
    // selectors for chrome the scraper already stripped on this page).
    WebImporter.DOMUtils.remove(element, [
      '#universal-nav',       // verified line 38: top utility nav (sticky bar)
      '#nav',                 // defensive: main nav (not in this capture)
      '#sub-nav',             // defensive: secondary nav (not in this capture)
      '#addsearch',           // verified line 72: search input
      'nav',                  // verified line 39: nav element
      'footer',               // verified line 1031: footer (incl. in-footer
                              //   language-selector / cookie leftovers)
      '[role="contentinfo"]', // footer landmark fallback
    ]);

    // Top launch/pencil promo banner — first body-level div carrying the promo.
    // Verified line 4: <div class="relative z-[9999] w-full">. Targeted by exact
    // class string to avoid matching #universal-nav, which uses a different class
    // ("sticky top-inc00 z-[9999] w-full").
    const promoBanner = element.querySelector('div.relative.z-\\[9999\\].w-full');
    if (promoBanner) promoBanner.remove();

    // Next.js route announcer (a11y live region) — verified line 1186. Non-authorable.
    element.querySelectorAll('next-route-announcer').forEach((el) => el.remove());

    // Safe, never-authorable elements + tracking/experiment chrome.
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'iframe',
      'noscript',
      'link',
      'source',
      '[role="alert"]',
    ]);

    // De-duplicate block tables defensively. The source double-renders some
    // components (React desktop `lg:block` + mobile `lg:hidden` copies), so a
    // parser can emit the same block twice (video, sidebar, cards).
    //
    // At afterTransform time the importer has NOT yet converted block tables to
    // `<div class="blockname">` — they are still <table> elements whose first cell
    // text is the block name. Detect blocks by that first-cell convention. For
    // exact + near duplicates with the same label, keep the LONGER (richer) copy.
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
