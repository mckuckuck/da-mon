/**
 * Slalom — alternating media + text section.
 * Expected authored structure (2 rows):
 *   row 1: text content (heading, paragraph(s), optional CTA)
 *   row 2: image
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [textRow, mediaRow] = rows;

  if (textRow) {
    textRow.classList.add('slalom-text');
    // mark links styled as buttons (single link in its own paragraph)
    textRow.querySelectorAll('p > a:only-child').forEach((a) => {
      a.classList.add('button');
    });
  }
  if (mediaRow) mediaRow.classList.add('slalom-media');
}
