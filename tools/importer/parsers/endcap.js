/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: endcap
 * Base block: endcap
 * Source: https://www.mongodb.com/products/platform/atlas-database
 * Generated: 2026-06-11
 *
 * The endcap block is the end-of-page conversion CTA. It expects a 2-column,
 * single-row table:
 *   - cell 1 (col1) = heading + supporting paragraph + CTA links
 *                     (first link = primary, subsequent links = secondary).
 *   - cell 2 (col2, optional) = an eyebrow label + a benefit <ul>.
 *
 * On this page (MongoDB Atlas, Emotion CSS-in-JS with hashed css-* classes — NOT
 * relied upon), section 12 "Get started with Atlas today" renders as:
 *   - col1 wrapper: <h2> heading, a sibling text block (the supporting paragraph),
 *           and two CTAs ("Try Free" primary, "Contact sales" secondary). The CTA
 *           anchors are wrapped in decorative nested spans, so visible link text is
 *           normalized into clean anchors.
 *   - col2 wrapper: an eyebrow label ("REGISTER TODAY, START BUILDING:") and a
 *           benefit <ul>.
 *
 * INVOCATION MODEL: page-templates.json targets `h2` (Emotion css-* classes are
 * unstable, so the section is identified by ordinal + heading text — the same
 * convention used by the slalom parser). parse() runs once per <h2>. We
 * self-filter: only the "Get started with Atlas today" heading builds a block;
 * every other h2 no-ops.
 *
 * The validator captures the created block as the node left WHERE THE MATCHED
 * ELEMENT WAS (it reads element.nextSibling.previousSibling after parse). The
 * endcap content (subhead/CTAs/benefit list) lives in sibling subtrees of the
 * matched <h2>, so we must replace the <h2> ITSELF with the block (never an
 * ancestor — that would detach the captured siblings) and then strip the now-
 * orphaned original content nodes from the surrounding container.
 */
export default function parse(element, { document }) {
  // `element` is an <h2>. Only the end-of-page CTA heading should build a block.
  const headingText = (element.textContent || '').replace(/\s+/g, ' ').trim();
  if (!/get started with atlas today/i.test(headingText)) return;
  const heading = element;

  // Climb to the endcap container: the nearest ancestor that contains both the
  // heading and the benefit <ul>. Used only to scope content extraction + cleanup.
  let benefitList = null;
  let container = heading.parentElement;
  while (container && container.tagName !== 'BODY') {
    const ul = container.querySelector('ul');
    if (ul) {
      benefitList = ul;
      break;
    }
    container = container.parentElement;
  }
  if (!container || container.tagName === 'BODY') {
    container = heading.closest('section')
      || (heading.parentElement && heading.parentElement.parentElement)
      || heading.parentElement;
  }
  if (!container) return;

  // The benefit panel (col2): climb from the list to the outermost ancestor that
  // still does NOT contain the heading — that is the col2 cell (a sibling subtree
  // of col1). This keeps the eyebrow label, which sits beside the <ul> in col2,
  // inside the panel scope, and lets us exclude col2's links from the CTA set.
  let benefitPanel = null;
  if (benefitList) {
    benefitPanel = benefitList;
    let up = benefitList.parentElement;
    while (up && up !== container && !up.contains(heading)) {
      benefitPanel = up;
      up = up.parentElement;
    }
  }

  // Supporting paragraph/subhead: the text block following the heading. Source
  // renders it as a sibling <div> (not a <p>); fall back to a real <p> nearby.
  let subheadText = '';
  let sib = heading.nextElementSibling;
  while (sib) {
    const text = (sib.textContent || '').replace(/\s+/g, ' ').trim();
    if (text && !sib.querySelector('a, ul, ol, h1, h2, h3')) {
      subheadText = text;
      break;
    }
    sib = sib.nextElementSibling;
  }
  if (!subheadText) {
    const p = heading.parentElement && heading.parentElement.querySelector('p');
    if (p) subheadText = (p.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // CTA links (col1): anchors inside the container that are NOT in the benefit
  // panel. First = primary, rest = secondary (the block JS applies styling).
  const ctaAnchors = Array.from(container.querySelectorAll('a')).filter(
    (a) => !(benefitPanel && benefitPanel.contains(a)) && (a.textContent || '').trim(),
  );

  // Normalize CTA anchors into clean copies (source wraps link text in decorative
  // nested spans). Using copies avoids depending on the original DOM after cleanup.
  const cleanLinks = ctaAnchors
    .map((a) => {
      const href = a.getAttribute('href');
      const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!href || !text) return null;
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = text;
      return link;
    })
    .filter(Boolean);

  // Build col1: a clean heading copy + supporting paragraph + CTA links. We copy
  // the heading (rather than moving the live node) so cleanup can safely clear the
  // original container without disturbing the cell contents.
  const headingCopy = document.createElement(heading.tagName.toLowerCase());
  headingCopy.textContent = headingText;
  const col1 = [headingCopy];
  if (subheadText) {
    const p = document.createElement('p');
    p.textContent = subheadText;
    col1.push(p);
  }
  cleanLinks.forEach((a) => col1.push(a));

  const cells = [];

  // Build col2 (optional): eyebrow label + benefit list.
  if (benefitList) {
    const col2 = [];

    // Eyebrow label (e.g. "REGISTER TODAY, START BUILDING:") — the leaf text node
    // inside the benefit panel that precedes the list.
    let eyebrowText = '';
    const candidates = Array.from(benefitPanel.querySelectorAll('span, p'));
    for (const node of candidates) {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      if (node.querySelector('ul, ol, a, span')) continue; // leaf text only
      if (benefitList.contains(node)) continue; // skip list item text
      eyebrowText = text;
      break;
    }
    if (eyebrowText) {
      const label = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = eyebrowText;
      label.append(strong);
      col2.push(label);
    }

    // Benefit list: rebuild a clean <ul> from the visible item text (source list
    // items wrap text in decorative spans).
    const items = Array.from(benefitList.querySelectorAll(':scope > li'));
    const list = document.createElement('ul');
    items.forEach((li) => {
      const text = (li.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const newLi = document.createElement('li');
      newLi.textContent = text;
      list.append(newLi);
    });
    if (list.children.length) col2.push(list);

    cells.push([col1, col2]);
  } else {
    // No benefit list — single-column endcap.
    cells.push([col1]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'endcap', cells });

  // Replace the matched <h2> with the block so the validator captures it at the
  // heading's position, then strip the orphaned original endcap content so it is
  // not emitted alongside the block.
  element.replaceWith(block);
  Array.from(container.querySelectorAll('*')).forEach((node) => {
    if (node !== block && !block.contains(node) && !node.contains(block)) {
      node.remove();
    }
  });
}
