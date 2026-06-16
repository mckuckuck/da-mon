/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hp-deploy-cards (homepage "Deploy Your Way")
 * Base block: cards
 * Source: https://www.mongodb.com/
 *
 * The "Deploy Your Way" product banner (.webxp-471-wrapper) has:
 *   - a left intro (h2 "Deploy Your Way" + description + "Product Documentation" link) — kept
 *     as default content placed BEFORE the cards block,
 *   - a keen-slider carousel of product cards (.webxp-471-card): each card =
 *     img.webxp-471-img + h2.webxp-471-card-title + p.webxp-471-card-description + a "Learn more".
 * A duplicate responsive/mobile copy exists (.bnr__* under a sibling) — handled by cleanup dedup.
 *
 * The repo cards block: each row = one card => [image][body(title + description + CTA)].
 */
export default function parse(element, { document }) {
  const wrapper = element.matches('.webxp-471-wrapper')
    ? element
    : element.querySelector('.webxp-471-wrapper');
  if (!wrapper) return;

  // Intro default content (heading + description + documentation link).
  const introNodes = [];
  const left = wrapper.querySelector('.webxp-471-left-wrapper');
  if (left) {
    const h2 = left.querySelector('h2');
    if (h2 && h2.textContent.trim()) {
      const el = document.createElement('h2');
      el.textContent = h2.textContent.replace(/\s+/g, ' ').trim();
      introNodes.push(el);
    }
    const desc = left.querySelector('p');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      introNodes.push(p);
    }
    const docLink = left.querySelector('a[href]');
    if (docLink) {
      const a = document.createElement('a');
      a.href = (docLink.getAttribute('href') || '').trim();
      a.textContent = (docLink.textContent || '').replace(/\s+/g, ' ').trim();
      const p = document.createElement('p');
      p.append(a);
      introNodes.push(p);
    }
  }

  // Card rows.
  const cells = [];
  wrapper.querySelectorAll('.webxp-471-card').forEach((card) => {
    const img = card.querySelector('img.webxp-471-img') || card.querySelector('img');
    const title = card.querySelector('.webxp-471-card-title');
    const desc = card.querySelector('.webxp-471-card-description');
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

    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.getAttribute('src');
      newImg.alt = (img.getAttribute('alt') || (title ? title.textContent.trim() : '')) || '';
      cells.push([newImg, body]);
    } else {
      cells.push([body]);
    }
  });

  if (cells.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });

  if (introNodes.length) {
    const wrap = document.createElement('div');
    introNodes.forEach((n) => wrap.append(n));
    wrapper.parentNode.insertBefore(wrap, wrapper);
  }
  wrapper.replaceWith(block);
}
