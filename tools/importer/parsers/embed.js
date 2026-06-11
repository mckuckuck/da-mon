/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: embed
 * Base block: embed
 * Source: https://www.mongodb.com/resources/basics/databases/nosql-explained
 * Generated: 2026-06-11
 *
 * Source structure: an inline embedded media iframe (MongoDB Charts) that may sit
 * inside a wrapping <p>/<div>/<figure>:
 *   <p class="block css-bjkbxq">
 *     <iframe src="https://charts.mongodb.com/.../embed/charts?id=...&theme=light"></iframe>
 *   </p>
 *
 * Target (repo blocks/embed): a single cell containing a LINK to the external content.
 * The embed block's decorate() reads the <a href> and builds the iframe at render time.
 * An optional poster <picture>/<img> may precede the link if present in the same wrapper.
 *
 * The matched element may be the iframe itself OR a wrapper. Handle both:
 * if element is an iframe use it directly, else querySelector an iframe within.
 */
export default function parse(element, { document }) {
  // Resolve the iframe whether the matched element is the iframe or a wrapper.
  const iframe = element.tagName === 'IFRAME'
    ? element
    : element.querySelector('iframe');

  // Without an iframe (and thus no src), there is nothing to embed.
  if (!iframe || !iframe.getAttribute('src')) {
    return;
  }

  const src = iframe.getAttribute('src');

  // Determine the outermost sensible wrapper to replace so no empty wrapper is
  // left behind. If the iframe is wrapped in a lone <p>/<div>/<figure> whose only
  // meaningful content is the iframe (optionally a poster picture/img), replace
  // that wrapper instead of the iframe.
  let target = iframe;
  const parent = iframe.parentElement;
  if (parent && /^(P|DIV|FIGURE)$/.test(parent.tagName)) {
    const otherChildren = Array.from(parent.children).filter((c) => c !== iframe);
    // Only allowed siblings are poster image(s); anything else means the wrapper
    // holds other content and must NOT be removed.
    const onlyPosterSiblings = otherChildren
      .every((c) => /^(PICTURE|IMG)$/.test(c.tagName));
    const hasText = parent.textContent.replace(iframe.textContent || '', '').trim().length > 0;
    if (onlyPosterSiblings && !hasText) {
      target = parent;
    }
  }

  // Build the link cell: <a href="{src}">{src}</a>
  const link = document.createElement('a');
  link.href = src;
  link.textContent = src;

  // Optional poster image: include a preceding <picture>/<img> before the link
  // (placeholder image is optional per blocks/embed/embed.js). Search within the
  // wrapper scope (the replaced wrapper, or the matched element if iframe stands alone).
  const cellContent = [];
  const posterScope = target.tagName === 'IFRAME' ? element : target;
  const poster = posterScope.querySelector('picture, img');
  if (poster && !iframe.contains(poster)) {
    cellContent.push(poster);
  }
  cellContent.push(link);

  const cells = [cellContent];

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  target.replaceWith(block);
}
