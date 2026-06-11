/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb site-wide cleanup.
 *
 * Removes non-authorable site chrome so it doesn't pollute imported content.
 * Every selector below was verified against migration-work/cleaned.html for the
 * Atlas Database product-detail page (Emotion CSS-in-JS / Next.js source).
 *
 * Notes on this source:
 * - The scraper (per metadata.json renderNote) already excluded the OneTrust /
 *   privacy alertdialog ([role="alertdialog"], region[aria-label="Cookie banner"])
 *   and the Intercom messenger widget from the captured DOM. Defensive selectors
 *   for those are still listed so the transformer stays correct if a future
 *   capture of another mongodb page includes them.
 * - No <script>, <style>, <iframe> or role="alert" elements survive in the
 *   captured DOM; the safe-element pass below still strips them defensively.
 * - The footer (<footer class="css-1j19lrv">) contains the language selector,
 *   "Manage Cookies", and "Your Privacy Choices" leftovers, so removing <footer>
 *   removes all of those.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / consent / chat widgets that would block or pollute block parsing.
    // Defensive: not present in this capture (scraper excluded them) but stable
    // selectors for mongodb's OneTrust + Intercom integrations.
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
    // Non-authorable site chrome (verified in captured DOM).
    WebImporter.DOMUtils.remove(element, [
      '#universal-nav',  // verified line 36: top utility nav
      '#nav',            // verified line 794: main nav
      '#sub-nav',        // verified line 786: secondary nav
      '#addsearch',      // verified line 70: search input
      'nav',             // verified lines 37, 794, 828: all nav elements
      'footer',          // verified line 2416: footer (incl. language selector,
                         //   "Manage Cookies", "Your Privacy Choices" leftovers)
      '[role="contentinfo"]', // footer landmark fallback
    ]);

    // Top launch/pencil promo banner — first body-level div carrying the promo
    // (LAUNCH / AI DATA blog links). Verified line 2: <div class="relative z-[9999] w-full">.
    // Targeted by exact class string to avoid matching #universal-nav, which uses
    // a different class ("sticky top-inc00 z-[9999] w-full").
    const promoBanner = element.querySelector('div.relative.z-\\[9999\\].w-full');
    if (promoBanner) promoBanner.remove();

    // Next.js route announcer (a11y live region) — verified line 2569. Non-authorable.
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

    // De-duplicate block tables. The source renders some components twice
    // (React desktop `lg:block` + mobile `lg:hidden` copies, and Radix tab
    // portals), so parsers emit the same block more than once. Two cases:
    //   (a) exact duplicates — identical normalized text.
    //   (b) near-duplicates — same opening label but different richness (e.g.
    //       section-7 accordion: a no-code desktop copy + a code-bearing mobile
    //       copy). Keep the LONGER (richer) copy, drop the shorter.
    //
    // IMPORTANT: at afterTransform time the importer has NOT yet converted block
    // tables to `<div class="blockname">` — they are still in the authored table
    // form: <div><div>blockname</div>...</div> where the FIRST cell's text is the
    // block name. So we detect blocks by that first-cell convention, not by class.
    // createBlock produces a <table> whose first header cell text is the block
    // name (the div-based form only appears after serialization). Detect blocks
    // as <table> elements and read the name from the first cell.
    const BLOCK_NAMES = new Set(['hero', 'slalom', 'codepanel', 'accordion', 'quotecase', 'cards', 'endcap']);
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

    // Remove orphaned block fragments left as bare sibling <p>/<a> runs next to a
    // kept block table. The quotecase Radix content portal renders the eyebrow/
    // quote/CTA OUTSIDE the widget root, so the parser emits the block table AND
    // leaves those paragraphs behind in the same section. Detect a kept block's
    // table, then drop following-sibling <p> elements whose text is already
    // contained in that table (the duplicate fragment).
    byLabel.forEach((table) => {
      const tableText = (table.textContent || '').replace(/\s+/g, ' ').trim();
      let sib = table.nextElementSibling;
      while (sib && sib.tagName === 'P') {
        const sibText = (sib.textContent || '').replace(/\s+/g, ' ').trim();
        const next = sib.nextElementSibling;
        if (sibText && tableText.includes(sibText)) {
          sib.remove();
        }
        sib = next;
      }
    });
  }
}
