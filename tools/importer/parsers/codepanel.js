/* eslint-disable */
/* global WebImporter */
/**
 * Parser for codepanel. Base block: codepanel.
 * Source: https://www.mongodb.com/products/platform/atlas-database
 * Generated: 2026-06-11
 *
 * Source structure (Emotion CSS-in-JS, stable hook = .code-panel-container):
 *   .code-panel-container
 *     .css-lb45tp > .css-j5hm91
 *       .css-h80hff   -> active tab label
 *       .css-v2d161   -> inactive tab label(s)
 *     .css-rlgrou
 *       <textarea id="codesnippet-...">ACTIVE CODE</textarea>  <- active snippet only
 *       .CodeMirror ... (nested <textarea> is EMPTY, no id)    <- ignore
 *
 * Target (blocks/codepanel): each authored row = one tab [label][code].
 * A single row renders as a plain snippet with no tab strip.
 *
 * NOTE: In the static export only the ACTIVE tab's snippet is present in the
 * DOM (the `#codesnippet-*` textarea). Non-active tabs have no code body, so
 * their rows are emitted with an empty <pre>. The active tab's code is matched
 * to its label by ordinal position within .css-j5hm91.
 */
export default function parse(element, { document }) {
  // --- Tab labels in DOM order (active = .css-h80hff, inactive = .css-v2d161) ---
  const labelContainer = element.querySelector('.css-j5hm91');
  let labels = [];
  if (labelContainer) {
    labels = Array.from(labelContainer.querySelectorAll(':scope > .css-h80hff, :scope > .css-v2d161'));
  }

  // --- Active code snippet: the direct textarea with id^="codesnippet-" ---
  // (the nested CodeMirror <textarea> is empty and has no id)
  let activeText = '';
  const codeArea = element.querySelector('textarea[id^="codesnippet-"]');
  if (codeArea && codeArea.value !== undefined && codeArea.value !== '') {
    activeText = codeArea.value;
  } else if (codeArea) {
    activeText = codeArea.textContent || '';
  }
  // Normalize indentation introduced by the export's nested whitespace: trim
  // trailing whitespace per line and collapse leading indentation to keep the
  // command/code readable.
  const normalizeCode = (raw) => raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');

  const buildPre = (text) => {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.append(code);
    return pre;
  };

  const cells = [];

  if (labels.length > 0) {
    // The active tab is the one styled with .css-h80hff; its index gets the code.
    const activeIndex = labels.findIndex((l) => l.classList.contains('css-h80hff'));
    labels.forEach((labelEl, i) => {
      const labelText = labelEl.textContent.trim();
      // Only the active tab has a code body in the static export.
      const codeText = i === activeIndex ? normalizeCode(activeText) : '';
      cells.push([labelText, buildPre(codeText)]);
    });
  } else {
    // No tab strip detected — emit a single plain snippet row.
    cells.push([buildPre(normalizeCode(activeText))]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'codepanel', cells });
  element.replaceWith(block);
}
