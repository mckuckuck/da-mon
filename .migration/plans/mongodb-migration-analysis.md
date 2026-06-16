I have enough context to draft a plan, but two choices will materially shape it. Let me confirm those.# MongoDB.com Migration — Analysis & Cataloging Plan

## Goal

Perform a discovery and analysis pass for **mongodb.com** targeting a **Document Authoring (da)** EDS project. The deliverables are an inventory, not a content migration:

1. A **complete list of all pages** to be migrated (full site minus the two excluded sitemaps).
2. A **template catalog** grouping those pages into page types.
3. A **block catalog** per template, distinguishing:
   - **Custom blocks** (need to be built)
   - **Regular/standard blocks** (available in the da Block Library)
   - **Variances** within a block type (e.g. `cards (featured)`, `hero (dark)`).

## Scope & Exclusions

- **Include:** All URLs discoverable for `www.mongodb.com`.
- **Exclude:** Every path contained in these two sitemaps:
  - `https://www.mongodb.com/community/forums/sitemap.xml`
  - `https://www.mongodb.com/docs/sitemap-index-full.xml`
- **Scope decision:** Discover everything (full URL set, no sampling cap). Expect a large URL count; cataloging will group by template to stay manageable.
- **Project type:** `da` — block catalog will reference the da-specific Block Library endpoint.

## Approach

1. **Confirm project type & block library** — determine the da Block Library endpoint so the catalog references real, available blocks.
2. **URL discovery** — fetch the main sitemap(s) / crawl, then subtract every URL listed in the two excluded sitemaps to produce the authoritative migration URL list.
3. **Template discovery** — analyze representative pages, group similar pages into page templates, and produce a site catalog.
4. **Block cataloging per template** — for each template, analyze page structure and identify standard blocks, custom blocks, and block variances. Cross-check standard blocks against the da Block Library.
5. **Consolidate deliverables** — produce the full page list, template catalog, and per-template block inventory with variances.

This plan covers analysis & cataloging ONLY. No import scripts, parsers, transformers, or content generation are produced in this pass.

## Checklist

- [ ] Determine project type properties and the **da Block Library** endpoint to use for block discovery
- [ ] Discover all URLs for `www.mongodb.com` (sitemap-driven, fall back to crawl where needed)
- [ ] Fetch and expand both **excluded** sitemaps into a full exclusion path set:
  - [ ] `community/forums/sitemap.xml`
  - [ ] `docs/sitemap-index-full.xml` (sitemap index — expand all child sitemaps)
- [ ] Subtract exclusions and produce the **authoritative full page list** for migration
- [ ] Run **site catalog / template discovery** to group pages into page templates
- [ ] For each template, run **page analysis** to identify section structure
- [ ] Build the **block catalog** per template:
  - [ ] List **regular/standard** blocks (validated against the da Block Library)
  - [ ] List **custom** blocks that must be built
  - [ ] Document **block variances** (named variants per block type)
- [ ] Assemble final deliverables: full page list + template catalog + per-template block inventory with variances
- [ ] Present a summary report of templates, custom-block build list, and total page count

## Deliverables

- **`Full page list`** — every URL to be migrated after exclusions.
- **`Template catalog`** — page types with counts and example URLs.
- **`Block inventory`** — per template: standard blocks, custom blocks, and variances.
- **`Summary report`** — template count, custom block build list, total pages.

---
*Execution requires Execute mode. Approve this plan to begin discovery; the first concrete step is determining the da Block Library endpoint and kicking off URL discovery.*
