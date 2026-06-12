/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hp-usecase-tabs (homepage "MongoDB Atlas" use-case tabs)
 * Base block: tabs
 * Source: https://www.mongodb.com/
 *
 * A vertical Radix tablist of 8 Atlas use cases:
 *   triggers: [id^="radix-:r0:-trigger-"] (label in a span), e.g. "Vector Search",
 *             "Stream Processing", "Operational", "Transactional", "Text Search",
 *             "Analytical", "Graph", "Geospatial".
 *   panels:   [id^="radix-:r0:-content-<Label>"] — each has h3 title + p description +
 *             "Learn More" + "Documentation" links + an illustration image.
 *
 * The repo tabs block: each row = one tab; first cell text = tab label, remaining cell =
 * panel content. We emit [label][panel(h3 + p + CTA links)] per use case.
 *
 * The intro heading "MongoDB Atlas" + "The modern, AI-ready data platform" + "Explore the
 * platform" link sit above and are emitted as default content BEFORE the block.
 *
 * Built once: the parser is registered against the first trigger; it assembles the whole
 * tabs block by pairing each trigger with its content panel by the id suffix (label).
 */
function panelContent(document, panel) {
  const out = [];
  const h3 = panel.querySelector('h3');
  if (h3 && h3.textContent.trim()) {
    const el = document.createElement('h3');
    el.textContent = h3.textContent.replace(/\s+/g, ' ').trim();
    out.push(el);
  }
  const p = panel.querySelector('p');
  if (p && p.textContent.trim()) {
    const el = document.createElement('p');
    el.textContent = p.textContent.replace(/\s+/g, ' ').trim();
    out.push(el);
  }
  panel.querySelectorAll('a[href]').forEach((a) => {
    const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const link = document.createElement('a');
    link.href = (a.getAttribute('href') || '').trim();
    link.textContent = text;
    const wrap = document.createElement('p');
    wrap.append(link);
    out.push(wrap);
  });
  return out;
}

export default function parse(element, { document }) {
  if (document.body.dataset.hpUsecaseTabsParsed === 'true') {
    element.remove();
    return;
  }

  const triggers = Array.from(document.querySelectorAll('[id^="radix-:r0:-trigger-"]'));
  if (triggers.length === 0) return;
  document.body.dataset.hpUsecaseTabsParsed = 'true';

  // Locate the tablist container (shared ancestor of the triggers) and its section
  // wrapper, to pull the intro heading and to know where to place the block.
  const tablist = triggers[0].parentElement;

  // Intro default content from the nearest "MongoDB Atlas" heading above the tablist.
  const introNodes = [];
  let scope = tablist;
  for (let i = 0; i < 8 && scope && scope.parentElement; i += 1) {
    scope = scope.parentElement;
    const h2 = scope.querySelector('h2');
    if (h2 && /mongodb atlas/i.test(h2.textContent || '')) {
      const el = document.createElement('h2');
      el.textContent = h2.textContent.replace(/\s+/g, ' ').trim();
      introNodes.push(el);
      const sub = h2.parentElement && h2.parentElement.querySelector('span');
      if (sub && sub.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = sub.textContent.replace(/\s+/g, ' ').trim();
        introNodes.push(p);
      }
      break;
    }
  }

  const cells = [];
  const panels = [];
  triggers.forEach((trigger) => {
    const id = trigger.getAttribute('id') || '';
    const label = (trigger.textContent || '').replace(/\s+/g, ' ').trim();
    const suffix = id.replace('-trigger-', '-content-');
    const panel = document.getElementById(suffix);
    if (panel) panels.push(panel);
    const content = panel ? panelContent(document, panel) : [];
    cells.push([label, content.length ? content : '']);
  });

  if (cells.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });

  // Replace the use-case region so neither the content panels (which live in a grid
  // sibling of the tablist) leak as orphan default content. Use the lowest common
  // ancestor of the first trigger and the first content panel — that node bounds the
  // desktop tablist + all panels exactly. The mobile "ddp" duplicate is a SEPARATE
  // sibling subtree handled by homepage-cleanup (.ddp-experiment-wrapper et al), so we
  // do NOT climb past the LCA here (climbing would risk swallowing adjacent blocks,
  // which by this point are already <table> nodes and thus invisible to hook guards).
  const lca = (a, b) => {
    const ancestors = new Set();
    let n = a;
    while (n) { ancestors.add(n); n = n.parentElement; }
    n = b;
    while (n && !ancestors.has(n)) n = n.parentElement;
    return n;
  };
  const region = panels.length ? lca(triggers[0], panels[0]) : tablist;
  if (!region || region === document.body) return;

  if (introNodes.length) {
    const wrap = document.createElement('div');
    introNodes.forEach((n) => wrap.append(n));
    region.parentNode.insertBefore(wrap, region);
  }
  region.parentNode.insertBefore(block, region);
  region.remove();
}
