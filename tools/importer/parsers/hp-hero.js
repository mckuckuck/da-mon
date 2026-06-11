/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hp-hero (homepage hero)
 * Base block: hero (default-content driven; CSS styles the .hero section)
 * Source: https://www.mongodb.com/
 *
 * The homepage hero (.p13n-hp-hero) contains:
 *   - a persona toggle (.p13n-hp-role-toggle: "Builder" / "Business Leader") — this is
 *     interactive personalization chrome. The captured page shows the Builder experience;
 *     the toggle itself drives a client-side swap, so it is NOT authorable hero content.
 *     (Per analysis it would map to a tabs option, but the captured content is a single
 *     persona; we keep the default Builder hero copy and drop the toggle control.)
 *   - a promo/pencil banner (.p13n-promo-banner) — launch banner chrome, dropped.
 *   - the hero copy: h1.hero-title, .hero-description, and the CTA buttons
 *     (.hero-cta-wrapper a: "Get Started" /cloud/atlas/register, "Documentation" /docs).
 *   - the @lg-chat AI assistant (#p13n-hp-chat-root) — SDK chrome, dropped (handled by cleanup).
 *   - a spotlight video + trust logos (.p13n-spotlight / .p13n-trust-logos) — decorative
 *     hero backdrop; the trust logos are kept as part of the hero cell, the video is dropped.
 *
 * Emits a single-cell `hero` block: [heading, description, CTAs].
 */
export default function parse(element, { document }) {
  const hero = element.matches('.p13n-hp-hero') ? element : element.querySelector('.p13n-hp-hero');
  if (!hero) return;

  const heading = hero.querySelector('h1.hero-title') || hero.querySelector('h1');
  const description = hero.querySelector('.hero-description');
  const ctaLinks = Array.from(hero.querySelectorAll('.hero-cta-wrapper a[href]'));

  const content = [];
  if (heading) {
    const h = document.createElement('h1');
    h.textContent = (heading.textContent || '').replace(/\s+/g, ' ').trim();
    content.push(h);
  }
  if (description) {
    const p = document.createElement('p');
    p.textContent = (description.textContent || '').replace(/\s+/g, ' ').trim();
    content.push(p);
  }
  ctaLinks.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = (a.textContent || '').replace(/\s+/g, ' ').trim();
    content.push(link);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells: [[content]] });
  hero.replaceWith(block);
}
