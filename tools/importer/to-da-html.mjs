/**
 * Convert EDS "rendered" plain.html (blocks as <div class="name">) into
 * DA source HTML (blocks as <table>, wrapped in <body><main>).
 *
 * DA only recognizes blocks that are <table> elements whose first row is the
 * block-name header; div.classname blocks are flattened to plain content
 * ("no blocks"). This script rewrites every block div into the table form.
 *
 * Usage: node to-da-html.mjs <in.plain.html> <out.html>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { JSDOM } from '/home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/node_modules/jsdom/lib/api.js';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error('usage: node to-da-html.mjs <in.plain.html> <out.html>');
  process.exit(1);
}

// Block name from a div's class list: first token = name (hyphens -> spaces,
// Title Case), remaining tokens = variants in "(a, b)" form.
function blockName(classList) {
  const tokens = [...classList];
  if (tokens.length === 0) return '';
  const [first, ...variants] = tokens;
  const title = first
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
  return variants.length ? `${title} (${variants.join(', ')})` : title;
}

const html = readFileSync(inPath, 'utf-8');
const { window } = new JSDOM(html);
const { document } = window;

// The source plain.html is a fragment of top-level <div> "sections", each
// containing default content and/or block divs. Build a fresh document.
const sourceRoot = document.body;

const out = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
const od = out.window.document;
const main = od.createElement('main');

function isBlockDiv(el) {
  return el.tagName === 'DIV' && el.classList.length > 0;
}

// Convert one block div into a DA <table>.
function divToTable(div) {
  const table = od.createElement('table');
  const rows = [...div.children].filter((c) => c.tagName === 'DIV');

  // Determine max column count across rows (cells = direct child divs;
  // a row with no child divs is itself a single cell).
  let maxCols = 1;
  const rowCells = rows.map((row) => {
    const cells = [...row.children].filter((c) => c.tagName === 'DIV');
    const list = cells.length ? cells : [row];
    if (list.length > maxCols) maxCols = list.length;
    return list;
  });

  // Header row: single cell with the block name, spanning all columns.
  const headTr = od.createElement('tr');
  const headTd = od.createElement('td');
  if (maxCols > 1) headTd.setAttribute('colspan', String(maxCols));
  headTd.textContent = blockName(div.classList);
  headTr.appendChild(headTd);
  table.appendChild(headTr);

  // Content rows. Each cell's child nodes are imported into a <td>. When a row
  // had no inner cell-divs, `cells` is [row] and we take the row's own children.
  rowCells.forEach((cells, i) => {
    const tr = od.createElement('tr');
    const rowEl = rows[i];
    const usingRowAsCell = cells.length === 1 && cells[0] === rowEl;
    cells.forEach((cell) => {
      const td = od.createElement('td');
      [...cell.childNodes].forEach((n) => td.appendChild(od.importNode(n, true)));
      tr.appendChild(td);
    });
    void usingRowAsCell;
    table.appendChild(tr);
  });

  return table;
}

[...sourceRoot.children].forEach((section) => {
  // Each top-level child is a section <div>.
  const secDiv = od.createElement('div');
  [...section.childNodes].forEach((node) => {
    if (node.nodeType === 1 && isBlockDiv(node)) {
      secDiv.appendChild(divToTable(node));
    } else {
      secDiv.appendChild(od.importNode(node, true));
    }
  });
  main.appendChild(secDiv);
});

od.body.appendChild(main);

const serialized = `<!DOCTYPE html>\n${od.documentElement.outerHTML}\n`;
writeFileSync(outPath, serialized, 'utf-8');
console.log(`converted ${inPath} -> ${outPath}`);
