/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hp-skills-cards (homepage "Level Up Your MongoDB Skills")
 * Base block: cards
 * Source: https://www.mongodb.com/
 *
 * The skills section is a row of <section> cards (3 of them), each containing:
 *   h3 (title) + p (description) + a "Learn more / Visit the Learning Hub" link.
 * The cards have no images. The intro heading "Level Up Your MongoDB Skills" + subcopy +
 * "Product documentation" link sit in a sibling heading row just above and are emitted as
 * default content BEFORE the block.
 *
 * The matched element is one card <section>; its parent is the card grid. To emit ONE
 * cards block per grid we run only for the FIRST sibling <section> and absorb the rest,
 * mirroring the shared cards.js grid logic. Each card -> a single-cell body row
 * [title + description + CTA] (no image column).
 */
export default function parse(element, { document }) {
  const grid = element.parentElement;
  if (!grid) return;

  const cardSections = Array.from(grid.children).filter(
    (c) => c.matches('section') && c.querySelector('h3'),
  );
  if (cardSections.length < 2) return;
  if (element !== cardSections[0]) {
    element.remove();
    return;
  }

  // Intro default content from the nearest preceding "Level Up…" heading row.
  const introNodes = [];
  // Walk up to a container that holds both the heading and this grid.
  let scope = grid;
  for (let i = 0; i < 6 && scope && scope.parentElement; i += 1) {
    scope = scope.parentElement;
    const h2 = scope.querySelector('h2');
    if (h2 && /level up/i.test(h2.textContent || '')) {
      const el = document.createElement('h2');
      el.textContent = h2.textContent.replace(/\s+/g, ' ').trim();
      introNodes.push(el);
      const sub = h2.parentElement && h2.parentElement.querySelector('span');
      if (sub && sub.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = sub.textContent.replace(/\s+/g, ' ').trim();
        introNodes.push(p);
      }
      break;
    }
  }

  const cells = [];
  cardSections.forEach((card) => {
    const title = card.querySelector('h3');
    const desc = card.querySelector('p');
    const cta = card.querySelector('a[href]');
    const body = [];
    if (title && title.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.replace(/\s+/g, ' ').trim();
      body.push(h3);
    }
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      body.push(p);
    }
    if (cta) {
      const a = document.createElement('a');
      a.href = (cta.getAttribute('href') || '').trim();
      a.textContent = (cta.textContent || '').replace(/\s+/g, ' ').trim();
      body.push(a);
    }
    cells.push([body]);
  });

  cardSections.slice(1).forEach((c) => c.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });

  if (introNodes.length) {
    const wrap = document.createElement('div');
    introNodes.forEach((n) => wrap.append(n));
    element.parentNode.insertBefore(wrap, element);
  }
  element.replaceWith(block);
}
