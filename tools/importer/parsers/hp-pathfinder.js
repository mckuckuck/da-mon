/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hp-pathfinder (homepage guided-start panels)
 * Base block: pathfinder
 * Source: https://www.mongodb.com/
 *
 * Two pathfinder variants render on the homepage, each a `.wn-section#pathfinder`:
 *   - .p13n-pathfinder-new-bl -> "Transform IT Decision-Making" (Business-Leader persona)
 *   - .p13n-pathfinder        -> "Your AI Data Platform is Ready" (primary)
 * (The primary one is also re-rendered later as a css-* SSR/CSR dup; this parser only
 *  runs on the .wn-section instance, and the duplicate is removed by cleanup.)
 *
 * Each .wn-section has:
 *   - p.wn-title (section title),
 *   - .wn-card-left: p.wn-subtitle ("START HERE") + inner title/description + a.wn-button (CTA),
 *   - .wn-card-right: p.wn-subtitle ("MORE INFORMATION") + .wn-link a[href] list.
 *
 * The repo pathfinder block expects: optional heading row, then a row with 2 cells
 * (primary column + secondary column). The first emphasized line in each column becomes
 * its label. So we emit:
 *   row1: [section title]
 *   row2: [primary: **START HERE** + title + description + CTA button]
 *         [secondary: **MORE INFORMATION** + link list]
 *
 * Invoked once per matched .wn-section (the parser is registered against the
 * .p13n-pathfinder* wrappers; resolve to the inner .wn-section).
 */
function emText(document, text) {
  const p = document.createElement('p');
  const em = document.createElement('em');
  em.textContent = text;
  p.append(em);
  return p;
}

export default function parse(element, { document }) {
  const section = element.matches('.wn-section') ? element : element.querySelector('.wn-section');
  if (!section) return;

  const titleEl = section.querySelector(':scope > p.wn-title');
  const left = section.querySelector('.wn-card-left');
  const right = section.querySelector('.wn-card-right');

  // Heading row.
  const rows = [];
  if (titleEl && titleEl.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = titleEl.textContent.replace(/\s+/g, ' ').trim();
    rows.push([h2]);
  }

  // Primary column.
  const primary = [];
  if (left) {
    const sub = left.querySelector('.wn-subtitle');
    if (sub && sub.textContent.trim()) primary.push(emText(document, sub.textContent.trim()));
    const innerTitle = left.querySelector('.wn-card-left-content .wn-title') || left.querySelector('.wn-title');
    if (innerTitle && innerTitle.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = innerTitle.textContent.replace(/\s+/g, ' ').trim();
      primary.push(h3);
    }
    const desc = left.querySelector('.wn-description');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      primary.push(p);
    }
    const cta = left.querySelector('a.wn-button');
    if (cta) {
      const a = document.createElement('a');
      a.href = (cta.getAttribute('href') || '').trim();
      a.textContent = (cta.textContent || '').replace(/\s+/g, ' ').trim();
      primary.push(a);
    }
  }

  // Secondary column.
  const secondary = [];
  if (right) {
    const sub = right.querySelector('.wn-subtitle');
    if (sub && sub.textContent.trim()) secondary.push(emText(document, sub.textContent.trim()));
    right.querySelectorAll('.wn-link a[href]').forEach((linkEl) => {
      const a = document.createElement('a');
      a.href = (linkEl.getAttribute('href') || '').trim();
      // The link label is the leading text node (before the arrow icon wrapper).
      const label = (linkEl.childNodes[0] && linkEl.childNodes[0].textContent
        ? linkEl.childNodes[0].textContent
        : linkEl.textContent).replace(/\s+/g, ' ').trim();
      a.textContent = label;
      const p = document.createElement('p');
      p.append(a);
      secondary.push(p);
    });
  }

  rows.push([primary.length ? primary : '', secondary.length ? secondary : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'pathfinder', cells: rows });
  element.replaceWith(block);
}
