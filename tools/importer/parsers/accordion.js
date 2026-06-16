/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: accordion
 * Base block: accordion
 * Source: https://www.mongodb.com/products/platform/atlas-database
 * Generated: 2026-06-11
 *
 * The accordion appears TWICE on this Emotion CSS-in-JS / Next.js page (hashed css-*
 * classes). Stable anchors (verified against migration-work/cleaned.html + live DOM):
 *   - Each item trigger is a <button id="accordion-tab-N"> (selector in page-templates.json).
 *   - The matching body is the trigger's NEXT element sibling <div id="content-N"> in the
 *     same row wrapper. (Both accordions reuse ids accordion-tab-0..N / content-0..N, so we
 *     must pair button->content by sibling traversal, NOT a page-wide id lookup.)
 *
 * Region 1 — Section 7 "Build faster..." : each row's body holds a paragraph + a
 *   "Get started"/"Learn how" link, and the row also carries a tabbed code panel
 *   (.code-panel-container). The list is rendered twice (desktop `hidden lg:block` + mobile
 *   `block lg:hidden`) so ids are DUPLICATED across copies — separate groups (different
 *   parents) keep them apart, and groups already built are skipped. The code panel becomes a
 *   NESTED codepanel block table (rows = [tab label][<pre> code]) appended to the body cell.
 *
 * Region 2 — Section 11 "FAQ" : 5 plain Q/A pairs; trigger text is an <h3>, body is a
 *   paragraph (sometimes list + "Learn more" link).
 *
 * Validator invocation model (tools/importer/static/import.js): parse() runs once per matched
 * element (each #accordion-tab-N button); the node left WHERE THAT BUTTON WAS is captured as
 * the result. So we transform the matched `element` itself:
 *   - First un-built trigger of a group: build the full accordion block from every item in
 *     the group and replace THIS button with it.
 *   - Any other trigger of an already-built group: replace the button with an empty div so it
 *     contributes no duplicate content.
 *
 * EDS accordion (blocks/accordion/accordion.js): row = [label cell][body cell].
 * EDS codepanel (blocks/codepanel/codepanel.js): row = [label][code]; single row => no tabs.
 */

/**
 * The "row" for a trigger: the nearest ancestor (or the button's parent) that directly
 * contains both the button and its matching content panel. We climb from the button until
 * the candidate also contains a [id^="content-"] descendant, capping at a small depth so we
 * never absorb a neighbouring item.
 */
function findRow(button) {
  let node = button;
  for (let depth = 0; depth < 4 && node.parentElement; depth += 1) {
    node = node.parentElement;
    if (node.querySelector('[id^="content-"]')) return node;
  }
  return button.parentElement || button;
}

/** The content panel paired with this trigger: prefer a following sibling, else within row. */
function findContent(button, row) {
  let sib = button.nextElementSibling;
  while (sib) {
    if (sib.id && sib.id.indexOf('content-') === 0) return sib;
    const inner = sib.querySelector && sib.querySelector('[id^="content-"]');
    if (inner) return inner;
    sib = sib.nextElementSibling;
  }
  // Fallback: the first content panel inside the row that is not another trigger's.
  return row.querySelector('[id^="content-"]');
}

/**
 * Collect the ordered list of {button, row} items in the group that `startRow` belongs to.
 * The group is the set of sibling rows (same parent) that each contain an accordion trigger,
 * contiguous around startRow. This naturally separates the two accordions and the
 * desktop/mobile copies (each lives under a different parent).
 */
function collectGroup(startRow) {
  const parent = startRow.parentElement;
  if (!parent) return { container: startRow, items: [] };
  const rows = Array.from(parent.children).filter(
    (child) => child.querySelector && child.querySelector('[id^="accordion-tab-"]'),
  );
  const items = rows.map((row) => {
    const button = row.querySelector('[id^="accordion-tab-"]');
    return { row, button };
  }).filter((it) => it.button);
  return { container: parent, items };
}

/** Extract raw code text from a .code-panel-container (textarea is authoritative). */
function extractCode(panelContainer) {
  const textarea = panelContainer.querySelector('textarea[id^="codesnippet-"]')
    || panelContainer.querySelector('textarea');
  let raw = textarea ? (textarea.value || textarea.textContent || '') : '';
  if (!raw.trim()) {
    raw = Array.from(panelContainer.querySelectorAll('pre.CodeMirror-line'))
      .map((pre) => pre.textContent).join('\n');
  }
  return raw
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
    .trim();
}

/** Build a nested codepanel block table from a .code-panel-container. */
function buildNestedCodepanel(panelContainer, document) {
  const tabLabels = Array.from(
    panelContainer.querySelectorAll('.css-h80hff, .css-v2d161'),
  ).map((el) => el.textContent.trim()).filter(Boolean);
  const code = extractCode(panelContainer);

  const makePre = (text) => {
    const pre = document.createElement('pre');
    const codeEl = document.createElement('code');
    codeEl.textContent = text;
    pre.append(codeEl);
    return pre;
  };

  const cells = [];
  if (tabLabels.length > 0) {
    tabLabels.forEach((label, i) => cells.push([label, makePre(i === 0 ? code : '')]));
  } else {
    cells.push([makePre(code)]);
  }
  return WebImporter.Blocks.createBlock(document, { name: 'codepanel', cells });
}

/**
 * Build the body cell node list for one accordion item.
 * `contentPanel` provides the answer text/links; `row` is searched for an associated code
 * panel (Section 7 renders the code panel as a sibling column of the trigger, not inside
 * #content-N).
 */
function buildBodyCell(contentPanel, row, document) {
  const bodyNodes = [];

  if (contentPanel) {
    const rich = Array.from(contentPanel.querySelectorAll('p, ul, ol'))
      .filter((n) => !n.closest('.code-panel-container'));
    rich.forEach((n) => bodyNodes.push(n.cloneNode(true)));

    if (bodyNodes.length === 0) {
      const text = contentPanel.textContent.replace(/\s+/g, ' ').trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        bodyNodes.push(p);
      }
    }

    const cta = contentPanel.querySelector('a[href]');
    if (cta && !cta.closest('.code-panel-container')) {
      const href = (cta.getAttribute('href') || '').trim();
      const label = cta.textContent.replace(/\s+/g, ' ').trim();
      if (href && label) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        bodyNodes.push(a);
      }
    }
  }

  // Code panel (Section 7): search this item's row only.
  const codePanel = row && row.querySelector('.code-panel-container');
  if (codePanel) bodyNodes.push(buildNestedCodepanel(codePanel, document));

  return bodyNodes;
}

/** Trigger label text (FAQ uses <h3>; Section 7 uses span.css-1qca8rs). Plain text. */
function getLabel(button) {
  const heading = button.querySelector('h2, h3, h4, h5, h6');
  if (heading && heading.textContent.trim()) return heading.textContent.trim();
  const span = button.querySelector('span');
  if (span && span.textContent.trim()) return span.textContent.trim();
  return button.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * Section 7 renders its accordion TWICE (desktop `lg:block` without an inline code panel in
 * the row, and mobile `lg:hidden` with the code panel inside the row). Both copies share the
 * same item labels. We only want the copy that carries the code. Returns true if THIS group
 * is the non-preferred duplicate: it has no code panel, but another group on the page that
 * starts with the same first-item label DOES contain a code panel.
 */
function isNonPreferredDuplicate(container, items, document) {
  const groupHasCode = !!container.querySelector('.code-panel-container');
  if (groupHasCode || items.length === 0) return false;

  const firstLabel = getLabel(items[0].button);
  if (!firstLabel) return false;

  // Scan every other accordion trigger; if a twin (same first label) lives in a container
  // that has a code panel, this code-less copy should be suppressed.
  const allTriggers = Array.from(document.querySelectorAll('[id^="accordion-tab-"]'));
  return allTriggers.some((btn) => {
    if (container.contains(btn)) return false;
    if (getLabel(btn) !== firstLabel) return false;
    const twinRow = findRow(btn);
    const twin = collectGroup(twinRow).container;
    return twin && twin !== container && !!twin.querySelector('.code-panel-container');
  });
}

export default function parse(element, { document }) {
  const row = findRow(element);
  const { container, items } = collectGroup(row);

  // Already built for this group: this duplicate/extra trigger contributes nothing.
  if (!container || container.getAttribute('data-accordion-parsed') === 'true') {
    element.replaceWith(document.createElement('div'));
    return;
  }

  // Section 7 duplicate (desktop copy without code): suppress in favour of the code-bearing
  // mobile copy.
  if (isNonPreferredDuplicate(container, items, document)) {
    container.setAttribute('data-accordion-parsed', 'true');
    element.replaceWith(document.createElement('div'));
    return;
  }

  container.setAttribute('data-accordion-parsed', 'true');

  const cells = [];
  items.forEach(({ row: itemRow, button }) => {
    const label = getLabel(button);
    const content = findContent(button, itemRow);
    const body = buildBodyCell(content, itemRow, document);
    cells.push([label, body.length ? body : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(document.createElement('div'));
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  // Replace the matched trigger itself so the validator captures the block where it was.
  element.replaceWith(block);
}
