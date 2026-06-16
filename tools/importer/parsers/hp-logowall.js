/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hp-logowall (homepage "Works seamlessly with your tech stack")
 * Base block: logowall (marquee variant)
 * Source: https://www.mongodb.com/
 *
 * The partner/tech-stack section (.p13n-partner-carousel) has:
 *   - an intro heading "Works seamlessly with your tech stack" + subcopy + "Explore our
 *     ecosystem" link (emitted as default content BEFORE the block by the parser),
 *   - a marquee of partner logos in rows of .animate-partner-carousel; each row repeats
 *     its logo set (×2) for a seamless loop, and there are forward + reverse rows. We
 *     dedupe to ONE set of unique logos (keyed by alt text) and emit a `logowall (marquee)`
 *     block — one cell per logo (an <a> wrapping the logo <img>).
 *
 * The repo logowall block: each authored cell = one logo; the `marquee` variant scrolls.
 */
export default function parse(element, { document }) {
  const root = element.matches('.p13n-partner-carousel')
    ? element
    : element.querySelector('.p13n-partner-carousel');
  if (!root) return;

  // Intro heading / subcopy / ecosystem link -> default content placed before the block.
  const introNodes = [];
  const heading = root.querySelector('h2');
  if (heading && heading.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    introNodes.push(h2);
  }
  const sub = heading && heading.parentElement
    ? heading.parentElement.querySelector('span')
    : null;
  if (sub && sub.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = sub.textContent.replace(/\s+/g, ' ').trim();
    introNodes.push(p);
  }

  // Unique logos across all marquee rows, keyed by normalized alt text.
  const seen = new Set();
  const cells = [];
  root.querySelectorAll('.animate-partner-carousel a[href] img').forEach((img) => {
    const alt = (img.getAttribute('alt') || '').replace(/\s*logo$/i, '').trim();
    const key = alt.toLowerCase() || (img.getAttribute('src') || '');
    if (!key || seen.has(key)) return;
    seen.add(key);
    const anchor = img.closest('a');
    const a = document.createElement('a');
    a.href = anchor ? (anchor.getAttribute('href') || '#') : '#';
    const newImg = document.createElement('img');
    newImg.src = img.getAttribute('src');
    newImg.alt = alt;
    a.append(newImg);
    cells.push([a]);
  });

  if (cells.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'logowall (marquee)',
    cells,
  });

  // Insert intro default content before the block, then replace the carousel root.
  if (introNodes.length) {
    const wrap = document.createElement('div');
    introNodes.forEach((n) => wrap.append(n));
    root.parentNode.insertBefore(wrap, root);
  }
  root.replaceWith(block);
}
