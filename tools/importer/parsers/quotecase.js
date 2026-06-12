/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quotecase. Base block: quotecase.
 * Source: https://www.mongodb.com/products/platform/atlas-database (section 8, "Atlas Database customer successes")
 * Generated: 2026-06-11
 *
 * Source is a React/Radix logo-tab switcher (MongoDB uses Emotion CSS-in-JS, hashed `css-*`
 * classes — NOT relied upon as stable hooks; structural/positional selection is used instead).
 *
 * Block contract (blocks/quotecase): each authored row = one customer case with cells
 *   [logo image] [stats] [eyebrow + quote + attribution + CTA].
 * 2+ rows generate a logo-tab switcher; a single row renders as a static panel.
 *
 * IMPORTANT: in the static export only the ACTIVE tab's full panel ([id*='-content-0'], Cisco)
 * is present in the DOM. The other tabs (Shutterfly, Beamable) only expose their logo in the
 * tab strip ([id*='-trigger-N']) — their full panels are not rendered. We therefore capture:
 *   - every logo we can find (one row per logo so all tabs survive the switcher), and
 *   - the full panel content for any case whose panel IS present.
 */

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

/**
 * Resolve the SINGLE canonical quotecase region root, regardless of which matched element
 * the hook passes in ([role='tablist'], a -trigger- button, a heading, etc.).
 *
 * The hook may invoke the parser once per matched element (page-templates lists two
 * selectors) and the source page also contains OTHER Radix widgets (the accordion and
 * codepanel) that reuse the same `-trigger-`/`-content-` id pattern. To stay deterministic,
 * idempotent, and isolated to the customer-success widget we anchor on the unique
 * `#customer-success` container that wraps the logo tab switcher. Every matched element
 * resolves to that same single root; anything outside it returns null and is skipped.
 */
function resolveRoot(element, document) {
  // Preferred: the stable, unique container id for this widget.
  const byId = (document && document.querySelector)
    ? document.querySelector('#customer-success')
    : null;
  if (byId) return byId;

  // Fallback (id absent): nearest ancestor that holds a logo tab strip whose triggers contain
  // images AND a content panel with the quote class — distinguishes it from accordion/codepanel.
  const isRegion = (el) => el
    && el.querySelector
    && el.querySelector('[id*="-trigger-"] img')
    && el.querySelector('[id*="-content-"] [class*="css-8awcyh"], [id*="-content-"] blockquote');

  let node = element;
  for (let i = 0; node && i < 15; i += 1) {
    if (isRegion(node)) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Build the [logo, stats, content] cells for a single content panel element.
 */
function buildCaseFromPanel(panel, document) {
  const logo = panel.querySelector('img[alt]:not([alt="" i]), img');
  const stats = Array.from(panel.querySelectorAll('[class*="css-pulw89"]'));

  // Stats cell: number(s) + label(s). Fall back to whole stat container if classes differ.
  const statsCell = [];
  stats.forEach((stat) => {
    statsCell.push(stat);
  });

  // Content cell: eyebrow + quote + attribution + CTA.
  const eyebrow = panel.querySelector('[class*="css-3pu2gp"]');
  const quote = panel.querySelector('[class*="css-8awcyh"], blockquote');
  // Attribution: the block of name + title spans (parent of css-1untns5).
  let attribution = panel.querySelector('[class*="css-1untns5"]');
  if (attribution && attribution.parentElement) attribution = attribution.parentElement;
  const cta = panel.querySelector('a[href]');

  const contentCell = [];
  if (eyebrow && norm(eyebrow.textContent)) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = norm(eyebrow.textContent);
    p.append(em);
    contentCell.push(p);
  }
  if (quote && norm(quote.textContent)) {
    const bq = document.createElement('blockquote');
    bq.textContent = norm(quote.textContent);
    contentCell.push(bq);
  }
  if (attribution && norm(attribution.textContent)) {
    contentCell.push(attribution);
  }
  if (cta && norm(cta.textContent)) {
    const link = document.createElement('a');
    link.href = cta.getAttribute('href');
    link.textContent = norm(cta.textContent) || 'Read Case Study';
    const p = document.createElement('p');
    p.append(link);
    contentCell.push(p);
  }

  return {
    logo,
    cells: [
      logo ? [logo] : '',
      statsCell.length ? statsCell : '',
      contentCell.length ? contentCell : '',
    ],
  };
}

export default function parse(element, { document }) {
  const root = resolveRoot(element, document);

  // The hook may invoke this parser once per matched element (page-templates lists multiple
  // selectors: [role='tablist'] and a -trigger- variant) and the page hosts other Radix
  // widgets reusing the same id pattern. There is exactly ONE quotecase region per page, so
  // once we have emitted the block we suppress every subsequent invocation. On the skip path
  // we only remove the (small) matched element — never the shared root — so we never delete
  // unrelated content. The single successful invocation replaces the whole root region below.
  const flagHost = (document.body || document.documentElement);
  const alreadyParsed = flagHost && flagHost.dataset && flagHost.dataset.quotecaseParsed === 'true';
  if (!root || alreadyParsed) {
    // Suppressed invocation: remove the matched element and any quotecase content fragment it
    // carries (eyebrow/quote/CTA) so a Radix content portal rendered outside the root leaves
    // no orphan text in the serialized output.
    if (element !== root) {
      const fragment = element.closest
        ? element.closest('[id*="-content-"]')
        : null;
      const toRemove = fragment || element;
      if (toRemove && toRemove.remove) toRemove.remove();
    }
    return;
  }
  if (flagHost && flagHost.dataset) flagHost.dataset.quotecaseParsed = 'true';

  // 1. Tab strip logos — one per customer case (order = tab order).
  const triggers = Array.from(root.querySelectorAll('[id*="-trigger-"]'));
  const tabLogos = triggers
    .map((t) => t.querySelector('img'))
    .filter(Boolean);

  // 2. Full content panels actually present in the static export.
  const panels = Array.from(root.querySelectorAll('[id*="-content-"]'))
    .filter((p) => p.querySelector('[class*="css-8awcyh"], blockquote, [class*="css-pulw89"]'));

  const rows = [];
  const usedLogoSrcs = new Set();

  // Emit one row per full panel (rich case content).
  panels.forEach((panel) => {
    const built = buildCaseFromPanel(panel, document);
    if (built.logo) usedLogoSrcs.add(built.logo.getAttribute('src'));
    rows.push(built.cells);
  });

  // For tabs that only expose a logo (no panel in the static export), emit a logo-only row
  // so every tab still appears in the generated switcher.
  tabLogos.forEach((logo) => {
    const src = logo.getAttribute('src');
    if (usedLogoSrcs.has(src)) return;
    usedLogoSrcs.add(src);
    rows.push([[logo], '', '']);
  });

  // Defensive fallback: nothing matched — emit a single empty case so the block still renders.
  if (!rows.length) rows.push(['', '', '']);

  const cells = rows;
  const block = WebImporter.Blocks.createBlock(document, { name: 'quotecase', cells });

  // Replace the matched element with the block (the harness tracks output via this element).
  // Then strip the rest of the widget region so no inner fragment lingers: if the root still
  // exists and is not the element we just replaced, clear/remove it.
  element.replaceWith(block);
  if (root && root !== element && !block.contains(root) && !root.contains(block) && root.remove) {
    root.remove();
  }
}
