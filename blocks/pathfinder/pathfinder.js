/**
 * Pathfinder — guided start panel.
 * Authored as: optional heading row, then a row with 2 cells (primary + secondary columns).
 * The first emphasized line in each column becomes its label.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  // last row with 2 cells is the columns row
  const colsRow = rows.reverse().find((r) => r.children.length >= 2);
  if (colsRow) {
    colsRow.classList.add('pathfinder-cols');
  }
  block.querySelectorAll('strong:first-child, em:first-child').forEach((el) => {
    const label = document.createElement('p');
    label.className = 'pathfinder-label';
    label.textContent = el.textContent;
    el.closest('p')?.replaceWith(label);
  });
  // first standalone link in primary column => button
  const firstLink = colsRow?.querySelector('a');
  if (firstLink) firstLink.classList.add('button');
}
