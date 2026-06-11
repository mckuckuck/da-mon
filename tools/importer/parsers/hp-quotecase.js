/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hp-quotecase (homepage "Loved by builders, trusted by enterprises")
 * Base block: quotecase
 * Source: https://www.mongodb.com/
 *
 * The customer-stories carousel (.p13n-use-case-carousel) is a Radix tablist:
 *   - logo tabs: button#radix-:r9:-trigger-N (each holds a customer logo <img>),
 *   - panels:    div#radix-:r9:-content-N (stats + industry tag + quote + CTAs).
 * Only the FIRST panel (content-0) is server-rendered in the captured DOM; the rest
 * hydrate client-side, so we capture the single visible case (Victoria's Secret / Retail).
 *
 * The repo quotecase block expects each row = one case with cells:
 *   [logo image] [stats] [quote + attribution + CTA].
 * We emit one row for the rendered case.
 *
 * Stable hooks: ids radix-:r9:-trigger-0 / radix-:r9:-content-0; within the panel the
 * stat value/label spans (.css-59f1gn / .css-aone06), industry tag (.css-3pu2gp),
 * quote (.css-8awcyh), and the case-study/solution links.
 */
export default function parse(element, { document }) {
  const carousel = element.matches('.p13n-use-case-carousel')
    ? element
    : element.querySelector('.p13n-use-case-carousel');
  if (!carousel) return;

  const trigger = carousel.querySelector('[id$="-trigger-0"]');
  const panel = carousel.querySelector('[id$="-content-0"]');
  if (!panel) return;

  // Logo cell: the customer logo from the first tab trigger.
  let logoCell = '';
  const logoImg = trigger && trigger.querySelector('img');
  if (logoImg) {
    const img = document.createElement('img');
    img.src = logoImg.getAttribute('src');
    img.alt = (logoImg.getAttribute('alt') || '').replace(/\s*logo$/i, '').trim();
    logoCell = img;
  }

  // Stats cell: each stat is a value span + label span.
  const statsCell = [];
  panel.querySelectorAll('.css-pulw89').forEach((stat) => {
    const value = stat.querySelector('.css-59f1gn');
    const label = stat.querySelector('.css-aone06');
    if (value) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = (value.textContent || '').trim();
      p.append(strong);
      if (label) p.append(document.createTextNode(` ${(label.textContent || '').trim()}`));
      statsCell.push(p);
    }
  });

  // Quote cell: industry tag + quote + attribution links.
  const quoteCell = [];
  const tag = panel.querySelector('.css-3pu2gp');
  if (tag && tag.textContent.trim()) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = tag.textContent.trim();
    p.append(em);
    quoteCell.push(p);
  }
  const quote = panel.querySelector('.css-8awcyh');
  if (quote && quote.textContent.trim()) {
    const bq = document.createElement('blockquote');
    bq.textContent = quote.textContent.replace(/\s+/g, ' ').trim();
    quoteCell.push(bq);
  }
  // CTA links inside the panel (Read Case Study + industry solution link).
  panel.querySelectorAll('a[href]').forEach((a) => {
    const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = text;
    quoteCell.push(link);
  });

  const cells = [[logoCell, statsCell.length ? statsCell : '', quoteCell.length ? quoteCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'quotecase', cells });
  carousel.replaceWith(block);
}
