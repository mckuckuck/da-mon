/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb blog-article site-wide cleanup.
 *
 * Strips the same non-authorable chrome as tools/importer/transformers/mongodb-cleanup.js
 * (the proven product-page cleanup) so it doesn't pollute imported blog content.
 * Every selector was re-verified against migration-work/blog/cleaned.html for the
 * blog-article template (React/Next.js source, contentstack/Next.js CDN — NOT
 * Scene7/Dynamic Media, so no DM transformer is needed).
 *
 * Notes on this capture (per migration-work/blog/metadata.json + page-structure.json):
 * - The scraper already excluded the OneTrust / privacy alertdialog, the cookie
 *   banner, the Intercom messenger, and all Optimizely/tracking <script> chrome.
 *   No <script>, <style>, <iframe>, <noscript>, #nav, #sub-nav, [role=contentinfo],
 *   [role=alertdialog], or [role=alert] survive in this capture. Defensive selectors
 *   for all of them are kept so the transformer stays correct on other blog captures.
 * - VERIFIED present in this capture:
 *     line 2    launch/pencil promo banner  -> div.relative.z-[9999].w-full
 *     line 36   #universal-nav (class "sticky top-inc00 z-[9999] w-full")
 *     line 37   <nav>
 *     line 70   #addsearch
 *     line 1035 <footer> (incl. in-footer language-selector widget leftovers)
 *     line 1188 <next-route-announcer>
 * - The ONLY "facebook" URL in this capture is the legitimate facebook.com/sharer.php
 *   SHARE link inside the authorable <aside> rail (line 972). The tracking-host list
 *   below intentionally matches the tracking endpoints `connect.facebook.net` and
 *   `facebook.com/tr` only (never a bare "facebook"), so the share button survives.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Block names this blog template can emit (from page-templates.json). Included
// for the defensive block-table dedup pass below; the blog has few duplicate
// blocks, but the source double-renders desktop/mobile copies of the rail.
const BLOCK_NAMES = new Set(['aside', 'sidebar']);

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
    // the <aside> rail is preserved.
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
      '#universal-nav',       // verified line 36: top utility nav (sticky bar)
      '#nav',                 // defensive: main nav (not in this capture)
      '#sub-nav',             // defensive: secondary nav (not in this capture)
      '#addsearch',           // verified line 70: search input
      'nav',                  // verified line 37: nav element
      'footer',               // verified line 1035: footer (incl. in-footer
                              //   language-selector widget leftovers)
      '[role="contentinfo"]', // footer landmark fallback
    ]);

    // Top launch/pencil promo banner — first body-level div carrying the promo
    // (LAUNCH / AI DATA blog links). Verified line 2: <div class="relative z-[9999] w-full">.
    // Targeted by exact class string to avoid matching #universal-nav, which uses
    // a different class ("sticky top-inc00 z-[9999] w-full").
    const promoBanner = element.querySelector('div.relative.z-\\[9999\\].w-full');
    if (promoBanner) promoBanner.remove();

    // Next.js route announcer (a11y live region) — verified line 1188. Non-authorable.
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
    // components (React desktop `lg:block` + mobile `lg:hidden` copies), so the
    // rail can emit the same block twice. The blog has few duplicates, but keep
    // this pass for the aside/sidebar block names.
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
