/**
 * Aside — inline callout / note box.
 * Authored as 1 or 2 cells: optional leading icon image, then body content.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const icon = cells.find((c) => c.querySelector('img') && c.textContent.trim() === '');
  block.textContent = '';

  if (icon) {
    icon.classList.add('aside-icon');
    block.append(icon);
  }
  const body = document.createElement('div');
  body.className = 'aside-body';
  cells.filter((c) => c !== icon).forEach((c) => {
    while (c.firstChild) body.append(c.firstChild);
  });
  block.append(body);
}
