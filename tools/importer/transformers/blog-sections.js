/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb blog-article section breaks + section metadata.
 *
 * Mirrors the structure of tools/importer/transformers/mongodb-sections.js (the
 * proven product-page section transformer) but is deliberately MINIMAL: the blog
 * is a single LIGHT-themed long-form article. Per migration-work/blog/page-structure.json
 * the three analysed "sections" (1 Blog header, 2 Article body, 3 Article sidebar
 * rail) are ALL style="light" and are a two-column layout (body + sticky rail),
 * NOT stacked dark/light content bands like the product page.
 *
 * Decisions (per the migration instructions):
 * - The page is essentially ONE light section. There are NO dark sections, so we
 *   emit NO Section Metadata blocks (forcing dark metadata is explicitly disallowed,
 *   and a "light" style is the EDS default — no metadata needed).
 * - We do NOT force <hr> section breaks: inserting breaks between the rail and the
 *   body would split a two-column layout incorrectly, and a single content section
 *   needs none. This matches page-structure.json indicating one real content body.
 * - The H1 ("Redefining the Database for AI: Why MongoDB Acquired Voyage AI",
 *   verified migration-work/blog/cleaned.html line 807) is the heading anchor for
 *   the article; with a single section it requires no break before it.
 *
 * Forward-compatible: if a `sections` array is later added to the blog-article
 * template in page-templates.json, this honors payload.template.sections — for each
 * non-first section it inserts an <hr> before that section's top-level ancestor, and
 * for any section carrying a non-"light" style it appends a Section Metadata block.
 * Until then (no template.sections), it is a heading-anchored single-section no-op,
 * leaving the all-light blog as one section.
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

  // Heading anchor(s) in document order. The blog has a single H1 (verified DOM);
  // the H2s belong to the same long-form article body (one content section).
  const headings = Array.from(main.querySelectorAll('h1'));
  if (headings.length === 0) return;

  // Only act on explicit template-provided sections. Absent a sections array, the
  // all-light blog is a single section: no <hr>, no Section Metadata (light is the
  // EDS default). Do NOT synthesize dark metadata.
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
    // The blog defines only "light" sections, so in practice nothing is emitted.
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
