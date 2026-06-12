/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb webinar (on-demand) section breaks + section metadata.
 *
 * Mirrors tools/importer/transformers/blog-sections.js (the proven single-section
 * mongodb pattern) but is deliberately MINIMAL: the webinar is a single
 * LIGHT-themed page. Per migration-work/webinar/page-structure.json the whole
 * webinar body is ONE section { "style": "light" } — a main column plus a sticky
 * meta rail, followed by a full-width "More like this" related-cards band. There
 * are NO dark/light stacked content bands like the product-detail page.
 *
 * Decisions (per the migration instructions):
 * - The page is ONE light section. There are NO dark sections, so we emit NO
 *   Section Metadata blocks (forcing dark metadata is explicitly disallowed, and
 *   "light" is the EDS default — no metadata needed).
 * - We do NOT force <hr> section breaks: the main column + sticky rail are one
 *   two-column layout, and the "More like this" band is part of the same single
 *   light content section. Inserting breaks would split the page incorrectly.
 *   This matches page-structure.json indicating a single content section.
 * - The H1 ("Digital Innovation with MongoDB and Google Cloud") is the heading
 *   anchor; with a single section it requires no break before it.
 *
 * Forward-compatible: if a `sections` array is later added to the webinar template
 * in page-templates.json, this honors payload.template.sections — for each
 * non-first section it inserts an <hr> before that section's top-level ancestor,
 * and for any section carrying a non-"light" style it appends a Section Metadata
 * block. Until then (no template.sections), it is a heading-anchored single-section
 * no-op, leaving the all-light webinar as one section.
 *
 * Runs in afterTransform only (section logic always runs post block-parsing).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Resolve the top-level section container for a heading: the ancestor that is a
 * direct child of `main`. Section breaks must be inserted between these top-level
 * children so EDS treats them as distinct sections.
 */
function topLevelAncestor(node, main) {
  let current = node;
  while (current && current.parentElement && current.parentElement !== main) {
    current = current.parentElement;
  }
  return current && current.parentElement === main ? current : node;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const main = element;
  const doc = (payload && payload.document) || main.ownerDocument;

  // Heading anchor(s) in document order. The webinar has a single H1 (verified
  // DOM); the lone H2 ("More like this") belongs to the same single light content
  // section.
  const headings = Array.from(main.querySelectorAll('h1'));
  if (headings.length === 0) return;

  // Only act on explicit template-provided sections. Absent a sections array, the
  // all-light webinar is a single section: no <hr>, no Section Metadata (light is
  // the EDS default). Do NOT synthesize dark metadata.
  const templateSections = payload && payload.template && Array.isArray(payload.template.sections)
    ? payload.template.sections
    : null;
  if (!templateSections || templateSections.length < 2) return;

  // Resolve each heading to its top-level section ancestor (dedupe so headings
  // sharing a top-level container don't create a spurious extra section).
  const seen = new Set();
  const sectionStarts = [];
  Array.from(main.querySelectorAll('h1, h2')).forEach((h) => {
    const top = topLevelAncestor(h, main);
    if (top && !seen.has(top)) {
      seen.add(top);
      sectionStarts.push(top);
    }
  });

  // Process in reverse so DOM insertions don't shift not-yet-processed anchors.
  for (let i = sectionStarts.length - 1; i >= 0; i -= 1) {
    const sectionEl = sectionStarts[i];
    const tmpl = templateSections[i];

    // Section Metadata only for sections with a non-light style (e.g. "dark").
    // The webinar defines only "light" sections, so in practice nothing is emitted.
    if (tmpl && typeof tmpl.style === 'string' && tmpl.style.trim() && !/^light$/i.test(tmpl.style.trim())) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: tmpl.style.trim() },
      });
      sectionEl.appendChild(metaBlock);
    }

    // Section break before every section except the first.
    if (i > 0 && sectionEl.parentElement) {
      const hr = doc.createElement('hr');
      sectionEl.parentElement.insertBefore(hr, sectionEl);
    }
  }
}
