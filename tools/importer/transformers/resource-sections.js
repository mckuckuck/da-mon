/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb resource-article section breaks + Section Metadata.
 *
 * The resource-article (resources/basics/databases/nosql-explained) page has a
 * dark hero band followed by a light long-form body. Per
 * migration-work/nosql/page-structure.json, section 1 (the hero) renders on a dark
 * background (bg-inverse-container) and sections 2-5 render light. In
 * tools/importer/page-templates.json this is encoded as the hero block's
 * `"section": "dark"` (there is no top-level `sections` array), so this transformer
 * derives the section model directly from the captured DOM rather than from
 * payload.template.sections.
 *
 * Behavior (runs in afterTransform only):
 *   1. style:dark on the HERO section only — insert a `Section Metadata` block
 *      (cells { style: 'dark' }) at the end of the hero, and an `<hr>` AFTER the
 *      hero to close the dark band before the light body begins.
 *   2. Minimal, heading-anchored section breaks for the light body — insert an
 *      `<hr>` before each top-level body H2 (the article's section headings) so the
 *      long-form body is split at natural heading boundaries. No Section Metadata is
 *      added to the light sections (light is the default; only the hero needs a style).
 *
 * Selectors verified against migration-work/nosql/cleaned.html:
 *   line 789  <section class="px-sm bg-inverse-container ..."> ... <h1>What is NoSQL?</h1>  (dark hero)
 *   line 831+ <h2 ... id="..."> body section headings (light)  e.g. id="what-is-nosql",
 *             "what-is-a-nosql-database", "brief-history-of-nosql-databases", "summary", etc.
 *   line 1511 <h2>FAQs</h2>            (FAQ section heading)
 *   line 1859 <h2>Get started with Atlas today</h2>  (endcap heading)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const document = element.ownerDocument;

  // --- 1. Hero (dark) section ---------------------------------------------
  // The hero is the band carrying the page H1 "What is NoSQL?". Prefer the
  // bg-inverse-container section hook; fall back to the closest ancestor section
  // of the first H1; fall back to the H1 itself.
  let hero = element.querySelector('section.bg-inverse-container');
  if (!hero) {
    const h1 = element.querySelector('h1');
    if (h1) hero = h1.closest('section') || h1;
  }

  if (hero) {
    // Section Metadata (style: dark) for the hero. createBlock emits a <table>
    // whose first cell is the block name; the importer serializes it later.
    const meta = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style: 'dark' },
    });
    // Place the metadata at the end of the hero band, then close the dark band
    // with an <hr> immediately after the hero so the light body starts fresh.
    hero.appendChild(meta);

    const heroBreak = document.createElement('hr');
    if (hero.parentNode) hero.parentNode.insertBefore(heroBreak, hero.nextSibling);
  }

  // --- 2. Light body: heading-anchored section breaks ----------------------
  // Insert an <hr> before each body section heading (top-level H2) so the
  // long-form body, FAQ, and endcap are split at natural heading boundaries.
  // Skip any H2 inside the hero (the hero H1 is the only heading there, but guard
  // anyway), skip headings that already follow an <hr> (e.g. the hero break we
  // just inserted), and skip block-table headings so we don't split inside a
  // parsed block.
  const heroEl = hero;
  element.querySelectorAll('h2').forEach((h2) => {
    // Never break inside the hero band.
    if (heroEl && (heroEl === h2 || heroEl.contains(h2))) return;
    // Never break inside a parsed block table.
    if (h2.closest('table')) return;

    // Anchor the break at the highest-level ancestor of this heading that is a
    // direct/!near child of main, so the <hr> lands between sections, not deep
    // inside wrapper divs. Walk up while the parent is not `element` (main).
    let anchor = h2;
    while (anchor.parentElement && anchor.parentElement !== element) {
      anchor = anchor.parentElement;
    }
    if (anchor.parentElement !== element) return; // heading not under main; skip

    // Don't double up <hr> (e.g. if the hero break already sits right before this
    // anchor, or a previous iteration inserted one).
    const prev = anchor.previousElementSibling;
    if (prev && prev.tagName === 'HR') return;

    const hr = document.createElement('hr');
    element.insertBefore(hr, anchor);
  });
}
