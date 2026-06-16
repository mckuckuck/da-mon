/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb homepage section breaks + section metadata.
 *
 * After the block parsers run, the homepage content is a sequence of blocks
 * (hero, quotecase, pathfinder ×2, logowall, cards ×2, tabs) plus intro default
 * content, all still living inside ONE deeply-nested top-level container (React
 * single-root app). The EDS importer only splits sections on <hr>, and sibling
 * top-level <div>s alone merge into one section.
 *
 * Strategy: use the emitted block tables (in document order) as section anchors.
 * For each block after the first, promote its block table (and any default-content
 * siblings that immediately precede it back to the previous block) into its own
 * top-level section <div>, inserting an <hr> before it. Then apply per-section
 * styles: all homepage sections are dark EXCEPT the partner logowall (light).
 *
 * Runs in afterTransform only (section logic always runs post block-parsing, and
 * AFTER cleanup's dedup pass which also runs in afterTransform — cleanup is listed
 * before this transformer in the import script's transformer array).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function topLevelOf(node, main) {
  let cur = node;
  while (cur && cur.parentElement && cur.parentElement !== main) {
    cur = cur.parentElement;
  }
  return cur && cur.parentElement === main ? cur : null;
}

// Block name -> dark? All homepage sections are dark except the partner logowall.
function isDark(blockName) {
  return blockName !== 'logowall';
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const main = element;
  const doc = main.ownerDocument;

  // Collect block tables in document order. Each table's first cell text is the
  // block name (still in table form at this hook).
  const BLOCK_NAMES = new Set(['hero', 'quotecase', 'pathfinder', 'logowall', 'cards', 'tabs']);
  const blocks = [];
  main.querySelectorAll('table').forEach((table) => {
    const firstCell = table.querySelector('th, td');
    if (!firstCell) return;
    const name = (firstCell.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase().split('(')[0].trim();
    if (!BLOCK_NAMES.has(name)) return;
    blocks.push({ name, table });
  });
  if (blocks.length === 0) return;

  // For each block, find its top-level container and the subtree (highest ancestor
  // that contains this block table but NOT the previous block table). Promote that
  // subtree to its own top-level section div with an <hr> before it.
  // Process in REVERSE so promotions don't disturb earlier anchors.
  for (let i = blocks.length - 1; i >= 1; i -= 1) {
    const { table } = blocks[i];
    const prevTable = blocks[i - 1].table;

    let subtree = table;
    let p = subtree.parentElement;
    while (p && p !== main && !p.contains(prevTable)) {
      subtree = p;
      p = p.parentElement;
    }
    if (!subtree || subtree === main || subtree.contains(prevTable)) {
      // Already a distinct top-level container, or couldn't isolate — just add a
      // break before its top-level ancestor if there is preceding content.
      const top = topLevelOf(table, main);
      if (top && top.previousElementSibling) {
        main.insertBefore(doc.createElement('hr'), top);
      }
      continue;
    }

    const container = topLevelOf(subtree, main);
    const newSection = doc.createElement('div');
    newSection.appendChild(subtree);
    const ref = container ? container.nextSibling : null;
    if (ref) main.insertBefore(newSection, ref);
    else main.appendChild(newSection);
    main.insertBefore(doc.createElement('hr'), newSection);
  }

  // Apply per-section styles. Re-resolve each block's now-top-level section and add a
  // dark Section Metadata block where needed. (After promotion each block table lives
  // in its own top-level div, except possibly the first which shares the hero container.)
  blocks.forEach(({ name, table }) => {
    if (!isDark(name)) return;
    const top = topLevelOf(table, main);
    if (!top) return;
    const meta = WebImporter.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style: 'dark' },
    });
    top.appendChild(meta);
  });
}
