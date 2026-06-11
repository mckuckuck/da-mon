/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero
 * Base block: hero
 * Source: https://www.mongodb.com/products/platform/atlas-database
 * Generated: 2026-06-11
 *
 * The repo `hero` block is default-content driven (empty decorate, CSS styling).
 * Per the EDS hero convention the block table is a single cell containing an
 * optional background/illustration image followed by the heading, supporting
 * paragraph and CTA links.
 *
 * The hero section is identified as the section containing the page H1.
 * The inline CLI code panel that visually sits in the hero area is handled by
 * the SEPARATE `codepanel` parser (.code-panel-container) and is intentionally
 * NOT captured here.
 *
 * Selectors validated against source HTML:
 *   - h1                         -> "Atlas Database"
 *   - supporting paragraph       -> <p> sibling of the H1 within the hero section
 *   - CTA links                  -> "Get Started" (/cloud/atlas/register),
 *                                   "Contact sales" (/company/contact)
 *   - illustration image         -> <img alt="An illustration of a database and document model">
 */
export default function parse(element, { document }) {
  // The matched element may be the bare H1 (per the `h1` instance selector) or
  // the hero container. Resolve to the H1, then to the surrounding hero scope.
  const headingEl = element.matches('h1') ? element : element.querySelector('h1');
  const scope = headingEl ? (headingEl.closest('section') || element) : element;

  // The matched `element` cannot be moved into the new block (replaceWith would
  // fail because the block would then contain `element`). Clone the heading so
  // the original H1 stays in the DOM until we replace it.
  const heading = headingEl ? headingEl.cloneNode(true) : null;

  // Supporting paragraph: prefer the first paragraph within the hero scope.
  const description = scope.querySelector('p');

  // CTA links within the hero scope. Exclude any links that live inside the
  // code panel (handled by the separate codepanel parser).
  const ctaLinks = Array.from(scope.querySelectorAll('a[href]')).filter(
    (a) => !a.closest('.code-panel-container'),
  );

  // Optional illustration / background image clearly part of the hero.
  const heroImage = scope.querySelector(
    'img[alt*="illustration" i], img[alt*="document model" i], picture',
  );

  // Build the single hero content cell: [image?] + heading + paragraph + CTAs.
  // Per the EDS hero convention the block is ONE row with ONE cell containing
  // default content (optional background image, heading, subheading, CTAs).
  const content = [];
  if (heroImage) content.push(heroImage);
  if (heading) content.push(heading);
  if (description) content.push(description);
  content.push(...ctaLinks);

  // Single row, single column: wrap the content array in a one-element row so
  // all nodes stack inside one cell rather than spreading across columns.
  const cells = [[content]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
