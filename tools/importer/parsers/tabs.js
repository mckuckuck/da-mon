/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: tabs
 * Base block: tabs
 * Source: https://www.mongodb.com/company/contact
 * Generated: 2026-06-11
 *
 * The MongoDB "Contact Us" page (React/Next.js, hydrated DOM) has a 3-option
 * contact-type selector that switches the panel below:
 *   "Sales Support" / "Product & Billing Support" / "Company Information".
 *
 * STABLE hooks (verified against migration-work/contact/cleaned.html):
 *   - Desktop selector: <button id="tab-sales|tab-support|tab-company"> with the
 *     visible label as its text (lines ~815-825).
 *   - Mobile dropdown: <div id="tab-sales|tab-support|tab-company"> duplicates of the
 *     same three labels inside #sortboxmenu (lines ~838-850).
 *   In the hydrated static DOM these are plain <button>/<div> elements — the
 *   role=tab/role=tablist semantics are added later by the EDS tabs block at decoration.
 *   So the selector `[id^="tab-"]` matches SIX nodes (3 desktop + 3 mobile).
 *
 * Shared panel content (one .box per page; the same panel is shown for every contact
 * type — only form routing differs, see page-structure.json notes):
 *   - <p> "Chat with Sales" (panel heading)
 *   - <p> intro paragraph about pricing/support/consulting
 *   - <button id="sales-contactChatTrigger"> "Chat Now" (JS chat trigger)
 *   - <a href="#exp-faq-bg"> "View FAQs" (in-page anchor)
 *
 * EDS tabs block (blocks/tabs/tabs.js): each block row's FIRST cell text becomes the
 * tab label, and the remaining cell content becomes that tab's panel. So we emit a
 * 2-column table: [tab label][panel content], one row per contact type.
 *
 * Validator invocation model: parse() is invoked once per matched element (each of the
 * six `[id^="tab-"]` nodes). We must emit exactly ONE tabs block. We build the whole
 * block on the first invocation and stamp document.body.dataset.tabsParsed; every later
 * invocation no-ops (replaces its element with an empty div) so no duplicate content and
 * no second tabs table is produced.
 */

/** Ordered, de-duplicated list of contact-type tab ids we care about. */
const TAB_IDS = ['tab-sales', 'tab-support', 'tab-company'];

/** Plain, whitespace-collapsed label text for a tab node. */
function getLabel(node) {
  return (node.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Build the panel content node list from the shared chat-intro card (.box) plus the
 * "View FAQs" anchor that sits just after it. Returns a fresh node list (cloned) so the
 * same content can be reused across all three rows without moving live nodes.
 */
function buildPanelCell(document) {
  const nodes = [];
  const box = document.querySelector('.box');

  if (box) {
    // Heading + paragraph(s): the card uses <p> for both the title and the copy.
    box.querySelectorAll(':scope > p').forEach((p) => {
      const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const el = document.createElement('p');
      el.textContent = text;
      nodes.push(el);
    });

    // "Chat Now" trigger is a <button> (JS chat launcher, no href). Represent it as a
    // button-style link so it renders as a CTA after import.
    const chatBtn = box.querySelector('#sales-contactChatTrigger, button');
    if (chatBtn) {
      const label = getLabel(chatBtn);
      if (label) {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = label;
        nodes.push(a);
      }
    }
  }

  // "View FAQs" in-page anchor (sibling of .box, links to the FAQ section).
  const faq = document.querySelector('a[href="#exp-faq-bg"]');
  if (faq) {
    const a = document.createElement('a');
    a.href = faq.getAttribute('href') || '#exp-faq-bg';
    a.textContent = getLabel(faq) || 'View FAQs';
    nodes.push(a);
  }

  return nodes;
}

export default function parse(element, { document }) {
  // Build the single tabs block only once across all matched tab nodes.
  if (document.body.dataset.tabsParsed === 'true') {
    element.replaceWith(document.createElement('div'));
    return;
  }
  document.body.dataset.tabsParsed = 'true';

  // Resolve each contact-type tab by id, preferring the desktop <button> copy; fall back
  // to whichever node carries the id. Keep only those actually present, in stable order.
  const tabs = TAB_IDS
    .map((id) => {
      const nodes = Array.from(document.querySelectorAll(`[id="${id}"]`));
      const button = nodes.find((n) => n.tagName === 'BUTTON');
      return button || nodes[0] || null;
    })
    .filter(Boolean);

  if (tabs.length === 0) {
    element.replaceWith(document.createElement('div'));
    return;
  }

  // Shared panel content (chat intro + form CTA links). Built once, cloned per row so the
  // identical panel can back every tab without moving live DOM nodes.
  const sharedPanel = buildPanelCell(document);

  const cells = tabs.map((tab) => {
    const label = getLabel(tab);
    const panel = sharedPanel.map((n) => n.cloneNode(true));
    return [label, panel.length ? panel : ''];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });

  // The matched element is the desktop selector button; its parent is the
  // selector row. Insert the block just before that row, then strip the source
  // scaffolding the block now represents so it doesn't linger as orphan default
  // content. The inquiry form in the sibling column is intentionally left intact
  // (captured as flagged default content for the Forms workflow).
  const selectorRow = element.parentElement;
  if (selectorRow && selectorRow.parentNode) {
    selectorRow.parentNode.insertBefore(block, selectorRow);
    selectorRow.remove();
  } else {
    element.replaceWith(block);
  }

  // Mobile dropdown selector (duplicate #tab-* entries inside #sortboxmenu).
  const sortbox = document.getElementById('sortbox');
  if (sortbox) {
    const mobileWrap = sortbox.closest('[class*="md-fix"]') || sortbox.parentElement;
    if (mobileWrap) mobileWrap.remove();
  }

  // Cloned chat-intro card + its "View FAQs" sibling anchor (now inside the block).
  const box = document.querySelector('.box');
  if (box) {
    const faqAnchor = box.parentElement && box.parentElement.querySelector('a[href="#exp-faq-bg"]');
    if (faqAnchor) faqAnchor.remove();
    box.remove();
  }
}
