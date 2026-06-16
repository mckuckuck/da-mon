/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: slalom
 * Base block: slalom
 * Source: MongoDB product/platform pages (atlas-database, cloud, ...)
 * Generated: 2026-06-11
 *
 * Target structure (per blocks/slalom/slalom.js):
 *   row 1: text  -> heading + paragraph(s) + optional CTA (a, wrapped in <p>)
 *   row 2: image -> the section illustration <img>
 *   CSS handles left/right alternation, so the parser does NOT encode side.
 *
 * Invocation: invoked once per heading matched by the page-templates instance
 * selector. The pages use Emotion CSS-in-JS (hashed css-* classes, NOT stable),
 * so we identify slalom feature sections STRUCTURALLY rather than by fixed text:
 * a heading whose section contains a paragraph AND a single illustration image
 * laid out side-by-side, and which is NOT one item of a multi-item card grid.
 * A short list of known headings is kept only as a fast-path accept.
 */

const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

// Fast-path: headings we already know are slalom features (atlas-database page).
const KNOWN_SLALOM_HEADINGS = new Set([
  'ai ready',
  'accelerate innovation with the document model',
  'scale apps with confidence',
  'optimize deployments effortlessly',
  'enterprise-grade security without complexity',
].map(normalize));

/**
 * Find the nearest ancestor of `heading` whose subtree contains an <img>.
 * Returns null if none within a small climb budget.
 */
function findImageContainer(heading) {
  let c = heading.parentElement;
  let hops = 0;
  while (c && hops < 8) {
    if (c.querySelector('img')) return c;
    c = c.parentElement;
    hops += 1;
  }
  return null;
}

/**
 * Heuristic: is this heading one item of a repeated card grid (cards block),
 * rather than a standalone slalom feature? A card grid has 3+ sibling items
 * that each contain a heading of the same level. We detect by looking at the
 * heading's grid-ancestor: if that ancestor holds 3+ headings of this level,
 * treat it as a grid (NOT slalom).
 */
function isCardGridItem(heading) {
  const level = heading.tagName; // e.g. H3
  let c = heading.parentElement;
  let hops = 0;
  while (c && hops < 6) {
    const sameLevel = c.querySelectorAll(level).length;
    if (sameLevel >= 3) return true;
    c = c.parentElement;
    hops += 1;
  }
  return false;
}

/**
 * Structural acceptance test for a slalom feature heading.
 */
function isSlalomHeading(heading) {
  if (KNOWN_SLALOM_HEADINGS.has(normalize(heading.textContent))) return true;
  // Only consider h2/h3 feature headings.
  if (!/^H[23]$/.test(heading.tagName)) return false;
  // Must not be part of a card grid.
  if (isCardGridItem(heading)) return false;
  // Must have an image-bearing container AND a paragraph of body copy nearby.
  const container = findImageContainer(heading);
  if (!container) return false;
  const imgs = container.querySelectorAll('img');
  if (imgs.length !== 1) return false; // a single illustration, not a gallery/grid
  const hasParagraph = !!container.querySelector('p')
    || Array.from(container.querySelectorAll('div')).some(
      (d) => !d.querySelector('a, img, h1, h2, h3, div') && (d.textContent || '').trim().length > 30,
    );
  return hasParagraph;
}

export default function parse(element, { document }) {
  // element is the matched heading. Self-filter to slalom feature sections.
  const heading = element;
  if (!isSlalomHeading(heading)) {
    // Not a slalom section heading (belongs to another block). Leave untouched.
    return;
  }

  // Climb to the section/row container that also holds the illustration image.
  // The hashed classes are unstable, so locate the container structurally:
  // the nearest ancestor whose subtree contains an <img>.
  let container = heading.parentElement;
  while (container && !container.querySelector('img')) {
    container = container.parentElement;
  }
  if (!container) container = heading.parentElement;

  // The text column is the nearest ancestor of the heading that holds the
  // paragraph/CTA but NOT the image. Walk up until adding the next ancestor
  // would pull in the <img>; that ancestor is the text column boundary.
  let textCol = heading.parentElement;
  while (
    textCol
    && textCol.parentElement
    && textCol.parentElement !== container
    && !textCol.parentElement.querySelector('img')
  ) {
    textCol = textCol.parentElement;
  }
  if (!textCol) textCol = heading.parentElement;

  // --- Row 1: text content ---
  // Build the cell from CLONES so the block owns its nodes; the original
  // container subtree is removed after replaceWith to avoid leaving duplicate
  // content (heading/paragraph/image) elsewhere in the document — which would
  // otherwise cause the importer to drop or mis-serialize the block.
  const contentCell = [heading.cloneNode(true)];

  // Paragraph(s): real <p> elements (sections 3-6) or the body copy <div>
  // (section 2 "AI Ready" uses a <div> instead of <p>). Within the text column,
  // prefer <p>; fall back to the body-copy <div> that carries the description.
  const paragraphs = Array.from(textCol.querySelectorAll('p'));
  if (paragraphs.length) {
    paragraphs.forEach((p) => contentCell.push(p.cloneNode(true)));
  } else {
    // Fallback: a leaf <div> with substantial text that is not the heading and
    // does not contain a link (the description copy in section 2).
    const textDivs = Array.from(textCol.querySelectorAll('div')).filter((d) => {
      if (d.querySelector('a, img, h1, h2, h3, div')) return false;
      return (d.textContent || '').trim().length > 30;
    });
    if (textDivs.length) {
      const p = document.createElement('p');
      p.textContent = textDivs[0].textContent.trim();
      contentCell.push(p);
    }
  }

  // Optional CTA: a single meaningful link in the text column. Wrap in <p> so
  // the block decorates it as a button (p > a:only-child). Use textContent to
  // strip the nested icon markup.
  const ctaAnchor = textCol.querySelector('a[href]');
  if (ctaAnchor) {
    const href = ctaAnchor.getAttribute('href');
    const label = (ctaAnchor.textContent || '').trim();
    if (href && label) {
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = label;
      const ctaPara = document.createElement('p');
      ctaPara.append(link);
      contentCell.push(ctaPara);
    }
  }

  // --- Row 2: image ---
  const img = container.querySelector('img');
  const mediaCell = img ? [img.cloneNode(true)] : [''];

  const cells = [contentCell, mediaCell];

  const block = WebImporter.Blocks.createBlock(document, { name: 'slalom', cells });
  // Replace the matched <h2> with the block (the import/validation harness
  // tracks the block at the heading's original position, so we must replace the
  // element itself, NOT an ancestor). Cells are clones, so now remove the
  // leftover original content (paragraphs, CTA, image) from the surrounding
  // container to avoid duplicate content in the output.
  const origParagraphs = paragraphs;
  const origImg = img;
  const origCta = ctaAnchor;
  element.replaceWith(block);
  origParagraphs.forEach((p) => { if (p && p.isConnected) p.remove(); });
  if (origImg && origImg.isConnected) {
    // remove the image's smallest wrapper that holds only the image
    let imgNode = origImg;
    while (
      imgNode.parentElement
      && imgNode.parentElement !== container
      && imgNode.parentElement.children.length === 1
    ) {
      imgNode = imgNode.parentElement;
    }
    imgNode.remove();
  }
  if (origCta && origCta.isConnected) origCta.remove();
}
