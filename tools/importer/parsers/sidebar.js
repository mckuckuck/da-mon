/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: sidebar
 * Base block: sidebar
 * Source: https://www.mongodb.com/company/blog/news/redefining-database-ai-why-mongodb-acquired-voyage-ai
 * Generated: 2026-06-11
 *
 * Article rail. Source markup is Emotion CSS-in-JS with hashed css-* classes.
 * The matched element is the <aside> ([role=complementary]) landmark which
 * holds, in order: a "share this" label + three icon-only share links, and an
 * "Author" label + author lockup (avatar img + name + role). The "MongoDB
 * Resources" label + resource link list lives in a SIBLING <div> immediately
 * after the </aside>, inside the shared rail container — so it is reached via
 * the aside's parent, not the aside itself.
 *
 * Target block (blocks/sidebar/sidebar.js) iterates rows; each authored row is
 * a group and the block JS adds the group classes (share / author) at decorate
 * time. So we emit one row per group, each with an emphasized label first line:
 *   - row 1: "share this" label + icon-only share links
 *   - row 2: "Author" label + avatar image + name + role
 *   - row 3: "MongoDB Resources" label + resource links list
 */
export default function parse(element, { document }) {
  // Strip social-share tracking junk from hrefs so links import cleanly.
  const cleanHref = (a) => {
    if (!a || !a.getAttribute('href')) return;
    const raw = a.getAttribute('href').trim();
    try {
      const u = new URL(raw, 'https://www.mongodb.com');
      // Resource links carry a `tck=blog_resources` analytics param.
      u.searchParams.delete('tck');
      a.setAttribute('href', u.searchParams.toString() ? `${u.origin}${u.pathname}?${u.searchParams}` : `${u.origin}${u.pathname}`);
    } catch (e) {
      a.setAttribute('href', raw);
    }
  };

  // Build an emphasized-text label paragraph from a label string.
  const makeLabel = (text) => {
    if (!text) return null;
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = text;
    p.append(em);
    return p;
  };

  // Locate group labels by their text so we don't depend on hashed classes.
  const labelByText = (root, re) => Array.from(root.querySelectorAll('span, p, strong, em'))
    .find((el) => re.test(el.textContent.trim()) && el.textContent.trim().length < 40);

  const cells = [];

  // ---- Share group: anchors that wrap only an <img> (no text). ----
  const shareLabelEl = labelByText(element, /share this/i);
  const shareLinks = Array.from(element.querySelectorAll('a'))
    .filter((a) => a.querySelector('img') && !a.textContent.trim());
  if (shareLinks.length) {
    const shareCell = [];
    const shareLabel = makeLabel(shareLabelEl ? shareLabelEl.textContent.trim() : 'share this');
    if (shareLabel) shareCell.push(shareLabel);
    shareLinks.forEach((a) => {
      cleanHref(a);
      shareCell.push(a);
    });
    cells.push([shareCell]);
  }

  // ---- Author group: avatar image + adjacent name/role text. ----
  // Avatar is the photo img inside the lockup, distinct from the share icons.
  const avatar = Array.from(element.querySelectorAll('img'))
    .find((img) => !shareLinks.some((a) => a.contains(img)));
  if (avatar) {
    const authorLabelEl = labelByText(element, /^author$/i);
    // Name + role text nodes sit beside the avatar in the lockup. Grab the
    // text spans that are not labels and not inside a share link.
    const lockup = avatar.closest('div') ? avatar.closest('div').parentElement : element;
    const textSpans = Array.from((lockup || element).querySelectorAll('span'))
      .filter((s) => s.textContent.trim()
        && s !== authorLabelEl
        && s !== shareLabelEl
        && !/^author$/i.test(s.textContent.trim())
        && !/share this/i.test(s.textContent.trim()));

    const authorCell = [];
    const authorLabel = makeLabel(authorLabelEl ? authorLabelEl.textContent.trim() : 'Author');
    if (authorLabel) authorCell.push(authorLabel);
    authorCell.push(avatar);
    textSpans.forEach((s) => {
      const p = document.createElement('p');
      p.textContent = s.textContent.trim();
      authorCell.push(p);
    });
    cells.push([authorCell]);
  }

  // ---- Resources group: label + link list, in a sibling after the aside. ----
  // Search the shared rail container (aside's parent) for the resources block.
  const container = element.parentElement || element;
  const resourcesLabelEl = labelByText(container, /resources/i);
  if (resourcesLabelEl) {
    // The link list is the wrapper that holds the resource anchors (textual
    // links, distinct from icon-only share links). Collect them in order.
    const resourceLinks = Array.from(container.querySelectorAll('a'))
      .filter((a) => a.textContent.trim() && !element.contains(a) && !a.querySelector('img'));
    if (resourceLinks.length) {
      const resourcesCell = [];
      const resourcesLabel = makeLabel(resourcesLabelEl.textContent.trim());
      if (resourcesLabel) resourcesCell.push(resourcesLabel);
      const list = document.createElement('ul');
      resourceLinks.forEach((a) => {
        cleanHref(a);
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', a.getAttribute('href'));
        link.textContent = a.textContent.trim();
        li.append(link);
        list.append(li);
      });
      resourcesCell.push(list);
      cells.push([resourcesCell]);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'sidebar', cells });
  element.replaceWith(block);
}
