# Pilot Migration Plan — Atlas Database (Product Detail Page)

**Pilot URL:** https://www.mongodb.com/products/platform/atlas-database
**Template:** Product Detail Page
**Project type:** da (Document Authoring) → content lands in `content.da.live/mckuckuck/da-mon/`
**Goal:** Prove the end-to-end import pipeline on one rich page before scaling to the rest.

---

## Why this page

It exercises the widest set of blocks in a single page, so a clean import here de-risks
the other high-value/template pages:

| Section (order) | Block | Status in repo |
|---|---|---|
| 1. Atlas Database (hero + CLI) | Hero (+ CodePanel) | hero ✅ / codepanel ✅ |
| 2–6. AI Ready / document model / scale / optimize / security | Slalom | slalom ✅ |
| 7. Build faster (accordion + tabbed code) | Accordion + CodePanel | ✅ / ✅ |
| 8. Customer successes | QuoteCase | quotecase ✅ |
| 9. Learning hub | Cards | cards ✅ |
| 10. Use cases | Cards | cards ✅ |
| 11. FAQ | Accordion | accordion ✅ |
| 12. Get started today | EndCap | endcap ✅ |

All required blocks already have scaffolds + token CSS. No new block builds needed for the pilot.

---

## What has to be built (none of this exists yet)

The repo has analysis + blocks + tokens, but **no import infrastructure**. The pilot builds:

1. **`page-templates.json`** (single template entry) — DOM selectors mapping each section of
   the live page to its target block. This is the contract the importer follows.
2. **Block parsers** — `tools/importer/parsers/*.js`, one per block variant on this page
   (hero, slalom, accordion, quotecase, cards, codepanel, endcap). Each takes the matched DOM
   and emits the correct EDS block table.
3. **Page transformers** — `tools/importer/transformers/*.js`: cleanup (strip nav, footer,
   cookie banner, Intercom, experiment/Optimizely scripts), section splitting, image handling.
4. **Import script + bundle** — assemble parsers + transformers + template into a runnable
   script.
5. **Run import** — execute via the project's bundled import script + `run-bulk-import.js`
   (the only step that writes content). Output: one `.html`/`.md` content file for the page.
6. **Preview & verify** — render locally, compare against the live page, fix parser/CSS gaps
   (up to a few iterations).

---

## Key risks specific to this page

- **Client-rendered DOM.** The page hydrates via React; the importer must parse the *rendered*
  DOM, not raw server HTML. Parsers target hydrated structures (e.g. `code-panel-wrapper`,
  `Accordion Control Group`, `flex-container` card grids) captured during analysis.
- **Launch/pencil banner + cookie/Intercom/experiment chrome** must be stripped in cleanup so
  they don't pollute content.
- **Nested CodePanel inside Accordion** (section 7) — the parser must handle the accordion
  rows whose body contains a tabbed code panel; may fall back to authoring the code panel as a
  sibling block if nesting proves fragile.
- **Inline CLI code panel in the hero** — decide whether it imports as part of Hero or as a
  separate CodePanel block directly after the hero.

## Out of scope for the pilot
- No forms (this page has none).
- Localized variants — English only.

---

## Acceptance criteria

- One content file produced for `/products/platform/atlas-database`.
- Renders locally with all 12 sections present and mapped to the correct blocks.
- No nav/footer/banner/script leakage in the content.
- Visual parity "close enough" to the live page using the brand tokens (pixel-perfect not
  required for pilot; gaps logged for the block-critique pass).

## After the pilot
Once validated, reuse the same parser/transformer set (extended as needed) for the remaining
pages, grouped by template:
- **Templates:** blog article, webinar, (product detail covered by pilot).
- **High value:** products/platform/cloud, company, company/contact (form), nosql-explained;
  homepage & cloud/atlas/register flagged partial/out-of-scope.

---

## Checklist

- [ ] Confirm pilot scope (this page) and that all 8 blocks it needs are present
- [ ] Generate `page-templates.json` with section→block DOM selectors for this template
- [ ] Generate block parsers for: hero, slalom, accordion, quotecase, cards, codepanel, endcap
- [ ] Generate page transformers: cleanup (chrome/scripts), sections, images
- [ ] Assemble + bundle the import script
- [ ] Run the import for the single pilot URL
- [ ] Preview the imported content locally
- [ ] Compare against the live page; fix parser/CSS gaps (iterate)
- [ ] Document results + reusable infra for scaling to the remaining pages

*Execution note: steps after "generate page-templates.json" create files/content. This plan
is for review; on approval I'll build the infrastructure, run the single-page import, and
verify before touching any other page.*
