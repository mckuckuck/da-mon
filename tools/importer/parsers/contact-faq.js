/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: contact-faq
 * Base block: accordion (emits the base 'accordion' block)
 * Source: https://www.mongodb.com/company/contact (MongoDB Contact Us page)
 * Generated: 2026-06-11
 *
 * The Contact Us page FAQ accordion has a DIFFERENT DOM structure than the product-page
 * accordions handled by accordion.js (no <button id="accordion-tab-N"> / <div id="content-N">).
 *
 * Stable anchors (verified against migration-work/contact/cleaned.html):
 *   - Each FAQ item is `div.exp-faq-wrapper` (5 items).
 *   - Question / label : `p.exp-faq-question` inside `div.faq-title-wrapper`
 *       (the title wrapper also carries plus/minus icon <img>s — excluded from the cell).
 *   - Answer / body    : `p.exp-faq-answer` inside `div.exp-faq-answer-el`. The answer
 *       paragraph holds text plus <br> line breaks and inline <a href> links that must be
 *       preserved.
 *
 * EDS accordion block (blocks/accordion/accordion.js) expects a 2-column table; each row =
 *   [label cell][body cell] and is rendered as <details>/<summary>.
 *
 * Validator invocation model (tools/importer/static/import.js): parse() runs once per matched
 * `.exp-faq-wrapper` element. We build the WHOLE accordion block from EVERY `.exp-faq-wrapper`
 * on the FIRST invocation (collected page-wide) and replace the matched item with the block.
 * A body-level flag (document.body.dataset.contactFaqParsed) marks subsequent invocations so
 * those already-built items are simply removed (no duplicate output).
 */

/** Plain-text question label for one FAQ item. */
function getLabel(item) {
  const q = item.querySelector('p.exp-faq-question');
  if (q && q.textContent.trim()) return q.textContent.replace(/\s+/g, ' ').trim();
  return item.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * Body cell node list for one FAQ item: the answer <p> preserved as-is (text, <br>, inline
 * links). Falls back to the whole answer element, then to plain text.
 */
function getBody(item, document) {
  const answer = item.querySelector('.exp-faq-answer-el p.exp-faq-answer')
    || item.querySelector('p.exp-faq-answer')
    || item.querySelector('.exp-faq-answer-el');
  if (answer) return [answer];
  const text = item.textContent.replace(/\s+/g, ' ').trim();
  if (text) {
    const p = document.createElement('p');
    p.textContent = text;
    return [p];
  }
  return [''];
}

export default function parse(element, { document }) {
  // Already built on a prior invocation: drop this duplicate item.
  if (document.body.dataset.contactFaqParsed === 'true') {
    element.remove();
    return;
  }

  const items = Array.from(document.querySelectorAll('.exp-faq-wrapper'));
  if (items.length === 0) {
    element.remove();
    return;
  }

  document.body.dataset.contactFaqParsed = 'true';

  const cells = [];
  items.forEach((item) => {
    const label = getLabel(item);
    const body = getBody(item, document);
    cells.push([label, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
