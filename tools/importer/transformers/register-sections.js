/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: mongodb Atlas register (sign-up) page section styling.
 *
 * After chrome removal the page is a single content section: the sign-up form card
 * (heading + subheading + Google SSO + form block + sign-in link) on a dark teal
 * (#001E2B) background. So this transformer just appends one Section Metadata block
 * (style: dark) to the page so the whole sign-up section renders on the dark band.
 *
 * Driven by payload.template.sections when present (section 1 -> style "dark").
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const sections = (payload && payload.template && payload.template.sections) || [];
  const style = sections.length && sections[0].style ? sections[0].style : 'dark';

  const doc = element.ownerDocument;
  const metaBlock = WebImporter.Blocks.createBlock(doc, {
    name: 'Section Metadata',
    cells: { style },
  });
  element.appendChild(metaBlock);
}
