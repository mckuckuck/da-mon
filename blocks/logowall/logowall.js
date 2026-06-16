/**
 * LogoWall — grid of logos. Each authored cell = one logo.
 * Add the `marquee` variant for a continuous scrolling row (logos duplicated for a seamless loop).
 * @param {Element} block
 */
export default function decorate(block) {
  const items = [...block.querySelectorAll(':scope > div > div')];
  block.textContent = '';
  items.forEach((cell) => cell.classList.add('logowall-item'));

  if (block.classList.contains('marquee')) {
    const track = document.createElement('div');
    track.className = 'logowall-track';
    items.forEach((cell) => track.append(cell));
    // duplicate for seamless loop
    items.forEach((cell) => track.append(cell.cloneNode(true)));
    block.append(track);
  } else {
    items.forEach((cell) => block.append(cell));
  }
}
