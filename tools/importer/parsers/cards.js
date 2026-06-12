/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards
 * Base block: cards
 * Source: https://www.mongodb.com/products/platform/atlas-database
 * Generated: 2026-06-11
 *
 * The cards block expects a 2-column table where each row is one card:
 *   - cell 1 = image/icon (a single <picture>/<img> => decorated as .cards-card-image)
 *   - cell 2 = text body (title heading + optional eyebrow + description + optional CTA link)
 * Cards without an image collapse to the single-column body form.
 *
 * This page (MongoDB Atlas, Emotion CSS-in-JS) renders the cards block TWICE:
 *   1. Section 9 "Learning hub" — 4-card grid; each card = <section> with icon <img>,
 *      <h3> title, description <p>, and a CTA <a>.
 *   2. Section 10 "Atlas Database use cases" — 3-card grid; each card = <section> with an
 *      illustration <img>, an eyebrow tag (<span>), <h3> title, description <p>, and a CTA <a>.
 *
 * The page-templates.json selector targets each card directly (section:has(h3)). To produce
 * ONE block table per card GRID (rather than a separate single-row block per card), this parser
 * is invoked on a card <section> and reconstructs the full grid from sibling card sections:
 *   - It only runs for the FIRST card of a grid; subsequent siblings are absorbed and removed.
 *   - Card grouping is derived from the shared parent container of sibling <section>s, validated
 *     by the repeated icon/title/description structure (NOT by hashed css-* classes).
 */
export default function parse(element, { document }) {
  // The matched element is a single card <section>. Its parent is the card-grid wrapper.
  const grid = element.parentElement;
  if (!grid) return;

  // Collect every sibling card section in this grid (direct children that contain an h3).
  const cardSections = Array.from(grid.children).filter(
    (child) => child.matches('section') && child.querySelector('h3'),
  );
  if (cardSections.length === 0) return;

  // Guard against a lone <section> that wraps a whole content region (observed on
  // the webinar page: a single top-level <section> contains the page body AND the
  // real card grid nested deeper). A real card grid has 2+ sibling card sections.
  // If this is a solitary section, it is NOT a grid — skip it so its inner content
  // (and the real nested card grid) are handled normally.
  if (cardSections.length < 2) return;

  // Only build the grid once — when this invocation is for the first card section.
  // Later sibling invocations are absorbed into the first card's block, so they no-op.
  if (element !== cardSections[0]) {
    element.remove();
    return;
  }

  // Build one row per card. Row layout: [imageCell, bodyCell] (or [bodyCell] if no image).
  const cells = [];
  cardSections.forEach((card) => {
    // Image / icon: first <img> inside the card (icon for learning-hub, illustration for use cases).
    const img = card.querySelector('img');

    // Title heading.
    const heading = card.querySelector('h3');

    // Eyebrow / tag (use-case cards have a short category label). Avoid the CTA link text and the
    // textlink label span by only treating a leaf <span> that is a direct text label as the eyebrow.
    // It sits alongside the image wrapper, before the title group. Detect via a span that has no
    // descendant h3/p/a and is not part of the textlink/cta structure.
    let eyebrow = null;
    const candidateSpans = Array.from(card.querySelectorAll('span'));
    for (const span of candidateSpans) {
      const text = (span.textContent || '').trim();
      if (!text) continue;
      if (span.querySelector('h3, p, a, img, span')) continue; // leaf-text spans only
      if (span.closest('a')) continue; // skip CTA link label spans
      if (span.classList.contains('textlink-link-icon-class')) continue;
      // The eyebrow must come before the heading in document order.
      if (heading && (span.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        eyebrow = span;
        break;
      }
    }

    // Description paragraph(s).
    const paragraphs = Array.from(card.querySelectorAll('p'));

    // CTA link(s): anchors inside the card (exclude any that are inside the title).
    const links = Array.from(card.querySelectorAll('a')).filter(
      (a) => !(heading && heading.contains(a)),
    );

    // Build the body cell content in reading order: eyebrow, title, description, CTA.
    const body = [];
    if (eyebrow) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = (eyebrow.textContent || '').trim();
      p.append(strong);
      body.push(p);
    }
    if (heading) body.push(heading);
    paragraphs.forEach((p) => body.push(p));
    links.forEach((a) => body.push(a));

    if (img) {
      cells.push([img, body]);
    } else {
      cells.push([body]);
    }
  });

  // Remove the absorbed sibling card sections (all but the first, which is `element`).
  cardSections.slice(1).forEach((card) => card.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
