/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb contact page site-wide cleanup.
 *
 * Strips the same non-authorable chrome as the proven product-page cleanup
 * (tools/importer/transformers/mongodb-cleanup.js) and blog cleanup
 * (tools/importer/transformers/blog-cleanup.js) so it doesn't pollute the
 * imported contact content. Every selector was verified against
 * migration-work/contact/cleaned.html for the contact template
 * (React/Next.js client-rendered source — webimages/webassets.mongodb.com +
 * s3.amazonaws.com assets, NOT Scene7/Dynamic Media, so no DM transformer).
 *
 * Notes on this capture (per migration-work/contact/metadata.json +
 * page-structure.json):
 * - The scraper already excluded the OneTrust / privacy alertdialog, the cookie
 *   banner, the Intercom messenger, and the Optimizely/segment tracking <script>
 *   chrome. No <script>, <style>, <iframe>, <noscript>, #universal-nav, #nav,
 *   #sub-nav, [role=contentinfo], [role=alertdialog], [role=alert], or
 *   <next-route-announcer> survive in THIS capture. Defensive selectors for all
 *   of them are kept so the transformer stays correct on other mongodb captures.
 * - VERIFIED present in this capture:
 *     line 7    launch/pencil promo banner  -> div.pencil-banner-no-underline
 *               (this page uses .pencil-banner-no-underline, NOT the product/blog
 *               page's div.relative.z-[9999].w-full — both selectors are kept)
 *     line 23   <nav class="css-1ek23uy"> (no id on this page)
 *     line 56   #addsearch
 *     line 777  "Ask MongoDB Assistant" AI chatbot widget
 *               -> #webxp1192-chat-root.aiChatbot (LeafyGreen UI chatbot form,
 *               sits between the H1 and the tab selector; interactive chrome,
 *               NOT authorable content)
 *     line 1209 <footer class="css-1j19lrv"> (incl. in-footer language-selector
 *               widget + "Manage Cookies" / "Your Privacy Choices" leftovers)
 * - No usbrowserspeed/facebook/munchkin/doubleclick tracking URLs survive in
 *   this capture; the tracking-host pass below is kept defensively (and only
 *   matches the tracking endpoints connect.facebook.net / facebook.com/tr, never
 *   a bare "facebook", so any legitimate share link would survive).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Block names this contact template can emit (from page-templates.json: tabs +
// contact-faq, which is authored with accordion semantics). Used for the
// defensive block-table dedup pass below. The source re-renders the chat panel +
// inquiry form inside each of the 3 tab panels, and the FAQ wrapper repeats per
// item, so parsers can emit the same block more than once.
const BLOCK_NAMES = new Set(['tabs', 'accordion']);

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // The "Ask MongoDB Assistant" AI chatbot widget — interactive LeafyGreen UI
    // chrome (search/chatbot), NOT authorable content. Verified line 777:
    // <div id="webxp1192-chat-root" class="aiChatbot">. Remove in beforeTransform
    // so it never gets parsed into a block / default content. Matched by id, by
    // exact class, and defensively by class-substring + bare id.
    WebImporter.DOMUtils.remove(element, [
      '#webxp1192-chat-root.aiChatbot',  // verified line 777: chatbot root
      '[class*="aiChatbot"]',            // defensive: any chatbot-classed node
      '#webxp1192-chat-root',            // defensive: chatbot root by id only
    ]);

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
    // (the tracking endpoints), never a bare "facebook", so legitimate share links survive.
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
      // Ad-network conversion/retargeting pixels observed in the contact capture.
      'adnxs.com',          // AppNexus/Xandr (secure.adnxs.com, ib.adnxs.com)
      'googleadservices.com', // Google Ads conversion pixel
      'bat.bing.com',       // Microsoft/Bing UET tag
      'trkn.us',            // Tremor/Telaria pixel
      'mathtag.com',        // MediaMath pixel
      'adsrvr.org',         // The Trade Desk pixel
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
      '#universal-nav',       // defensive: top utility nav (not in this capture)
      '#nav',                 // defensive: main nav (not in this capture)
      '#sub-nav',             // defensive: secondary nav (not in this capture)
      '#addsearch',           // verified line 56: search input
      'nav',                  // verified line 23: <nav class="css-1ek23uy">
      'footer',               // verified line 1209: footer (incl. in-footer
                              //   language-selector + "Manage Cookies" /
                              //   "Your Privacy Choices" leftovers)
      '[role="contentinfo"]', // footer landmark fallback
    ]);

    // Top launch/pencil promo banner. On THIS page it is the
    // div.pencil-banner-no-underline (verified line 7). The product/blog pages
    // use div.relative.z-[9999].w-full instead — both selectors kept so this
    // transformer is correct across mongodb captures.
    const pencilBanner = element.querySelector('div.pencil-banner-no-underline');
    if (pencilBanner) pencilBanner.remove();
    const promoBanner = element.querySelector('div.relative.z-\\[9999\\].w-full');
    if (promoBanner) promoBanner.remove();

    // Next.js route announcer (a11y live region) — defensive, not in this capture.
    element.querySelectorAll('next-route-announcer').forEach((el) => el.remove());

    // Hidden server-rendered fallback region (verified lines 937-1096): a SECOND
    // "Contact Us" ImageHeader, a duplicate inquiry form (mdb-input web components),
    // a "Locations" block, and four support cards (Help & Support / Pricing /
    // Customer Success / Partnerships). None of this renders in the hydrated page
    // (confirmed against the full-page screenshot) — it is the legacy SSR fallback
    // the React app replaces, so it must not become default content.
    element.querySelectorAll('header[class*="ImageHeader"]').forEach((h) => {
      const wrap = h.closest('div.w-full.relative') || h.parentElement;
      (wrap || h).remove();
    });
    element.querySelectorAll('.exp-bg-corners').forEach((el) => el.remove());

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

    // De-duplicate block tables. The source re-renders the chat panel + inquiry
    // form inside each of the 3 tab panels (contact-type only changes form
    // routing) and double-renders desktop/mobile copies, so parsers can emit the
    // same block more than once.
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
