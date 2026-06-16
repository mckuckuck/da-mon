/**
 * QuoteCase — customer success case(s) with logo tabs, stats, quote.
 * Each authored row is one case. Row cells: [logo image] [stats] [quote + attribution + CTA].
 * With 2+ rows, a logo-tab switcher is generated. A single row renders as a static panel.
 * @param {Element} block
 */
export default function decorate(block) {
  const cases = [...block.children];
  block.textContent = '';

  const tabs = document.createElement('div');
  tabs.className = 'quotecase-tabs';
  tabs.setAttribute('role', 'tablist');

  const panels = [];

  cases.forEach((row, i) => {
    const cells = [...row.children];
    const panel = document.createElement('div');
    panel.className = 'quotecase-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.dataset.active = i === 0 ? 'true' : 'false';
    cells.forEach((c) => panel.append(c));
    panels.push(panel);

    const logo = panel.querySelector('img');
    const tab = document.createElement('button');
    tab.className = 'quotecase-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    if (logo) tab.append(logo.cloneNode(true));
    else tab.textContent = `Case ${i + 1}`;
    tab.addEventListener('click', () => {
      panels.forEach((p, j) => { p.dataset.active = j === i ? 'true' : 'false'; });
      [...tabs.children].forEach((t, j) => t.setAttribute('aria-selected', j === i ? 'true' : 'false'));
    });
    tabs.append(tab);
  });

  if (cases.length > 1) block.append(tabs);
  panels.forEach((p) => block.append(p));
}
