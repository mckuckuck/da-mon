/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: register-form
 * Base block: form (Forms workflow — always base name "form", no variant)
 * Source: https://www.mongodb.com/cloud/atlas/register
 *
 * The Atlas sign-up page renders a single React form <form id="atlas-form"> with:
 *   - a "Sign up with Google" SSO anchor (account.mongodb.com/account/sso/google),
 *   - First/Last name, Company, Business Email, Password, Terms checkbox inputs,
 *   - a "Create your Atlas account" submit button.
 *
 * The field definitions were imported separately to content/cloud/atlas/atlas-form.json
 * (Forms migration workflow). An EDS Form block references that JSON via a link, so this
 * parser replaces the whole <form> with a `form` block whose single cell links to
 * `atlas-form.json`.
 *
 * The Google SSO button is a distinct auth flow (not part of the captured field set), so it
 * is preserved as an authorable CTA link placed just BEFORE the form block.
 */
export default function parse(element, { document }) {
  const form = element.matches('#atlas-form') ? element : element.querySelector('#atlas-form');
  if (!form) return;

  // Preserve the "Sign up with Google" SSO button as a CTA link before the form.
  const ssoAnchor = form.querySelector('a[href*="/account/sso/"]');
  let ssoLink = null;
  if (ssoAnchor) {
    ssoLink = document.createElement('a');
    ssoLink.href = ssoAnchor.getAttribute('href');
    ssoLink.textContent = (ssoAnchor.textContent || '').replace(/\s+/g, ' ').trim() || 'Sign up with Google';
  }

  // Form block: a single cell linking to the imported field-definition JSON.
  const jsonLink = document.createElement('a');
  jsonLink.href = 'atlas-form.json';
  jsonLink.textContent = 'atlas-form.json';
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'form',
    cells: [[jsonLink]],
  });

  if (ssoLink) {
    const p = document.createElement('p');
    p.append(ssoLink);
    form.parentNode.insertBefore(p, form);
  }
  form.replaceWith(block);
}
