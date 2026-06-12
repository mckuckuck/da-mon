/**
 * EndCap — end-of-page conversion CTA.
 * Expected authored structure:
 *   col 1: heading + subhead + CTA links
 *   col 2 (optional): benefit list
 * The first CTA is treated as primary; subsequent CTAs as secondary.
 * @param {Element} block
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a')];
  if (links.length) {
    const group = document.createElement('div');
    group.className = 'button-group';
    links[0].closest('p')?.replaceWith(group);
    links.forEach((a, i) => {
      a.classList.add('button');
      if (i > 0) a.classList.add('secondary');
      group.append(a);
    });
  }
}
