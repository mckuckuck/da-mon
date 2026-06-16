/**
 * CodePanel — tabbed code snippets with copy-to-clipboard.
 * Each authored row = one tab: [label] [code]. Single row => plain snippet, no tab strip.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  block.textContent = '';

  const tabs = document.createElement('div');
  tabs.className = 'codepanel-tabs';
  tabs.setAttribute('role', 'tablist');

  const body = document.createElement('div');
  body.className = 'codepanel-body';

  const snippets = [];

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const label = cells.length > 1 ? cells[0].textContent.trim() : `Snippet ${i + 1}`;
    const codeCell = cells.length > 1 ? cells[1] : cells[0];

    const snippet = document.createElement('div');
    snippet.className = 'codepanel-snippet';
    snippet.dataset.active = i === 0 ? 'true' : 'false';
    // normalize to a pre>code if author used plain text
    if (!codeCell.querySelector('pre, code')) {
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = codeCell.textContent;
      pre.append(code);
      snippet.append(pre);
    } else {
      while (codeCell.firstChild) snippet.append(codeCell.firstChild);
    }
    snippets.push(snippet);

    const tab = document.createElement('button');
    tab.className = 'codepanel-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.textContent = label;
    tab.addEventListener('click', () => {
      snippets.forEach((s, j) => { s.dataset.active = j === i ? 'true' : 'false'; });
      [...tabs.children].forEach((t, j) => t.setAttribute('aria-selected', j === i ? 'true' : 'false'));
    });
    tabs.append(tab);
  });

  const copy = document.createElement('button');
  copy.className = 'codepanel-copy';
  copy.type = 'button';
  copy.textContent = 'Copy';
  copy.addEventListener('click', () => {
    const active = snippets.find((s) => s.dataset.active === 'true') || snippets[0];
    navigator.clipboard?.writeText(active.textContent.trim());
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy'; }, 1500);
  });

  if (rows.length > 1) block.append(tabs);
  snippets.forEach((s) => body.append(s));
  body.append(copy);
  block.append(body);
}
