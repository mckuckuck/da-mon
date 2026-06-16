/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb section breaks + section metadata.
 *
 * The source (Atlas Database product-detail) is Emotion CSS-in-JS / Next.js with
 * hashed `css-*` classes and NO stable per-section class hooks. Per the template
 * note, section boundaries are NOT derivable from the hashed classes. They ARE,
 * however, exactly heading-anchored: the page has one H1 followed by eleven H2s,
 * in document order, mapping 1:1 to the 12 content sections in page-structure.json:
 *
 *   1  H1  "Atlas Database"                                  -> dark (hero band)
 *   2  H2  "AI Ready"                                        -> light
 *   3  H2  "Accelerate innovation with the document model"   -> light
 *   4  H2  "Scale apps with confidence"                      -> light
 *   5  H2  "Optimize deployments effortlessly"               -> light
 *   6  H2  "Enterprise-grade security without complexity"    -> light
 *   7  H2  "Build faster with documents that map to objects" -> dark
 *   8  H2  "Atlas Database customer successes"               -> dark
 *   9  H2  "Learning hub"                                    -> light (dark per page-structure; see note)
 *   10 H2  "Atlas Database use cases"                        -> light
 *   11 H2  "FAQ"                                             -> light
 *   12 H2  "Get started with Atlas today"                    -> dark (end CTA band)
 *
 * Dark sections per the migration instructions: 1, 7, 8, 12. (page-structure.json
 * additionally tags section 9 "Learning hub" dark, but the migration instructions
 * explicitly enumerate only 1/7/8/12 as the dark set, so we follow the instruction.)
 *
 * Strategy:
 * - For each heading anchor after the first, insert an <hr> immediately before the
 *   heading's top-level section ancestor (the direct child of `main`), so EDS sees
 *   12 sections.
 * - For dark sections, append a "Section Metadata" block (style: dark) inside that
 *   section so the EDS importer emits section metadata.
 *
 * It also honors payload.template.sections when present (forward-compatible: if a
 * `sections` array is later added to the product-detail template in
 * page-templates.json, the validator's section-validation path becomes reachable).
 *
 * Selectors verified against migration-work/cleaned.html (H1 line 850; the eleven
 * H2s at lines 899, 926, 971, 987, 1013, 1048, 1588, 1687, 1859, 2033, 2342).
 *
 * Runs in afterTransform only (section logic always runs post block-parsing).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// 1-based section ordinals that are dark-themed (per migration instructions).
const DARK_SECTIONS = new Set([1, 7, 8, 12]);

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

  // Heading anchors in document order: the H1 followed by the H2s (verified DOM).
  const headings = Array.from(main.querySelectorAll('h1, h2'));
  if (headings.length === 0) return;

  // Optional style overrides from template.sections (forward-compatible). When
  // present and aligned with the heading anchors, prefer their `style` value.
  const templateSections = payload && payload.template && Array.isArray(payload.template.sections)
    ? payload.template.sections
    : null;

  // Resolve each heading to its top-level section ancestor (dedupe so two headings
  // sharing a top-level container don't create a spurious extra section).
  const seen = new Set();
  const sectionStarts = [];
  headings.forEach((h) => {
    const top = topLevelAncestor(h, main);
    if (top && !seen.has(top)) {
      seen.add(top);
      sectionStarts.push(top);
    }
  });

  // Process in reverse so DOM insertions don't shift not-yet-processed anchors.
  for (let i = sectionStarts.length - 1; i >= 0; i -= 1) {
    const ordinal = i + 1; // 1-based section number
    const sectionEl = sectionStarts[i];

    // Determine dark styling: template.sections override if available, else the
    // instruction-defined dark set.
    let isDark = DARK_SECTIONS.has(ordinal);
    if (templateSections && templateSections[i] && typeof templateSections[i].style === 'string') {
      isDark = /dark/i.test(templateSections[i].style);
    }

    // Section Metadata block for dark sections (appended inside the section).
    if (isDark) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: 'dark' },
      });
      sectionEl.appendChild(metaBlock);
    }

    // Section break before every section except the first.
    if (i > 0) {
      const hr = doc.createElement('hr');
      sectionEl.parentElement.insertBefore(hr, sectionEl);
    }
  }
}
