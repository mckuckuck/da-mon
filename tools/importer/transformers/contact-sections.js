/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb contact page section breaks + section metadata.
 *
 * The contact template has 2 sections (per page-templates.json `sections` and
 * migration-work/contact/page-structure.json):
 *   Section 1 — DARK hero: 'Contact Us' H1 + 3-tab contact-type selector +
 *               per-tab chat panel and inquiry form (gray-800 / gray-1000 bg).
 *               style: "dark"  -> emits a Section Metadata block (style|dark).
 *   Section 2 — LIGHT FAQ: 'Frequently asked questions' + 5 expandable Q/A.
 *               No style. A section break (<hr>) is inserted before it so the
 *               dark hero and the light FAQ render as separate EDS sections.
 *
 * Runs in afterTransform ONLY (block parsers run between the hooks; section
 * markup must be applied after blocks exist). Selectors are driven by
 * payload.template.sections (section.selector), each verified against
 * migration-work/contact/cleaned.html:
 *   - section 1 selector "h1"          -> verified line 775 (<h1> 'Contact Us')
 *   - section 2 selector "#exp-faq-bg"  -> verified line 1099 (<div id="exp-faq-bg">)
 *
 * Additionally adds heading-anchor handling: H1/H2 are the per-section anchors
 * used to locate the first element of each section; the FAQ section break is
 * inserted before the FAQ heading's section root so the H2 begins the new
 * section cleanly.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/** Walk up to the direct child of `main` that contains `node` (or null). */
function topLevelOf(node, main) {
  let cur = node;
  while (cur && cur.parentElement && cur.parentElement !== main) {
    cur = cur.parentElement;
  }
  return cur && cur.parentElement === main ? cur : null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  const main = element;
  const doc = main.ownerDocument;

  const addStyle = (sectionRoot, style) => {
    if (!style) return;
    const metaBlock = WebImporter.Blocks.createBlock(doc, {
      name: 'Section Metadata',
      cells: { style },
    });
    sectionRoot.appendChild(metaBlock);
  };

  // This React page renders its whole body inside ONE deeply-nested top-level
  // container; the hero and the FAQ are not in separate top-level branches, so a
  // plain <hr> insert can't split them. Instead, for each later section we find
  // the SUBTREE that contains its anchor but NOT the previous section's anchor
  // (the divergence point), and promote that subtree to its own top-level sibling
  // of main. EDS treats consecutive top-level <div>s as separate sections.
  //
  // Process in REVERSE so promotions don't shift earlier anchors.
  const firstAnchor = sections[0].selector ? main.querySelector(sections[0].selector) : null;

  for (let i = sections.length - 1; i >= 1; i -= 1) {
    const section = sections[i];
    const anchor = section.selector ? main.querySelector(section.selector) : null;
    if (!anchor || !firstAnchor) continue;

    // Climb from this section's anchor to the highest ancestor that still does
    // NOT contain the previous (hero) anchor — that ancestor is this section's
    // self-contained subtree root.
    let subtree = anchor;
    let p = subtree.parentElement;
    while (p && p !== main && !p.contains(firstAnchor)) {
      subtree = p;
      p = p.parentElement;
    }
    if (!subtree || subtree === main || subtree.contains(firstAnchor)) continue;

    // Promote the subtree to a fresh top-level section div, then insert an <hr>
    // before it. The EDS importer only splits sections on <hr> (consecutive
    // top-level divs alone merge into one section), so the <hr> is what actually
    // produces a separate section in the serialized .plain.html.
    const heroContainer = topLevelOf(subtree, main);
    const newSection = doc.createElement('div');
    newSection.appendChild(subtree);
    const refNode = heroContainer ? heroContainer.nextSibling : null;
    if (refNode) {
      main.insertBefore(newSection, refNode);
    } else {
      main.appendChild(newSection);
    }
    main.insertBefore(doc.createElement('hr'), newSection);
    addStyle(newSection, section.style);
  }

  // Section 1 styling (e.g. dark hero) — applied to the first section's top-level
  // container (whatever now precedes the promoted later sections).
  const first = sections[0];
  if (first && first.style) {
    const firstTop = (firstAnchor && topLevelOf(firstAnchor, main)) || main.firstElementChild;
    if (firstTop) addStyle(firstTop, first.style);
  }
}
