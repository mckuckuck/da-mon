/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: aside
 * Base block: aside
 * Source: https://www.mongodb.com/company/blog/news/redefining-database-ai-why-mongodb-acquired-voyage-ai
 * Generated: 2026-06-11
 *
 * Inline callout / note box. Source markup is Emotion CSS-in-JS with hashed
 * css-* classes; the stable hooks are `.aside-container` (the matched element)
 * and the inner `.callout` div that wraps the body paragraph + inline links.
 * Each callout has an optional leading megaphone icon image.
 *
 * Target block (blocks/aside/aside.js) reads cells as:
 *   - optional leading icon cell (a cell whose only meaningful content is an <img>)
 *   - body content cell (paragraph + links)
 * => 1 row, [icon image][body] (or a single [body] cell when no icon present).
 */
export default function parse(element, { document }) {
  // Body: the `.callout` wrapper holds the paragraph + inline links.
  // Fall back to any paragraph inside the container if `.callout` is absent.
  const body = element.querySelector('.callout') || element.querySelector('p');

  // Icon: the leading megaphone image. Validated hook is the icon column
  // `.css-1lkrkvq > img`; fall back to the first <img> in the container that
  // is NOT inside the body, so the icon and body don't double-select.
  let icon = element.querySelector(':scope > div > img, :scope > div > div > img');
  if (!icon) {
    icon = Array.from(element.querySelectorAll('img')).find(
      (img) => !body || !body.contains(img),
    );
  }

  const cells = [];
  // Only emit an icon cell when the icon is a real importable asset. The source
  // megaphone icon is an inline base64 `data:` SVG that does not survive markdown
  // import (it would collapse to an empty cell and break the icon/body cell
  // pairing the block relies on), so skip it. The block treats the icon as
  // optional and renders cleanly with a single body cell.
  if (icon && icon.src && !icon.src.startsWith('data:')) {
    // Icon cell must read as image-only for the block's icon detection.
    cells.push([icon]);
  }
  cells.push([body]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'aside', cells });
  element.replaceWith(block);
}
