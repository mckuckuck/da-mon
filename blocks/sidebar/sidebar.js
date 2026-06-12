/**
 * SideBar — article rail (share, author, related resources).
 * Each authored row is a group; an emphasized first line becomes its label.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.firstElementChild || row;

    // share group: a row whose links only wrap images
    const links = [...cell.querySelectorAll('a')];
    if (links.length && links.every((a) => a.querySelector('img') && !a.textContent.trim())) {
      cell.classList.add('sidebar-share');
    }

    // author group: an image followed by name/role text
    const img = cell.querySelector('img');
    if (img && /author/i.test(cell.textContent) === false && cell.querySelector('img + *, * + img')) {
      // heuristic: avatar + adjacent text
      if (cell.childElementCount <= 3 && img.complete !== undefined) {
        cell.classList.add('sidebar-author');
      }
    }
  });
}
