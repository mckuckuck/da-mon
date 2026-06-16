/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionParser from './parsers/accordion.js';
import cardsParser from './parsers/cards.js';
import codepanelParser from './parsers/codepanel.js';
import endcapParser from './parsers/endcap.js';
import heroParser from './parsers/hero.js';
import quotecaseParser from './parsers/quotecase.js';
import slalomParser from './parsers/slalom.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/mongodb-cleanup.js';
import sectionsTransformer from './transformers/mongodb-sections.js';

// PARSER REGISTRY
const parsers = {
  accordion: accordionParser,
  cards: cardsParser,
  codepanel: codepanelParser,
  endcap: endcapParser,
  hero: heroParser,
  quotecase: quotecaseParser,
  slalom: slalomParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section splitting
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'product-detail',
  description: 'Product detail page: hero with inline CLI code panel, alternating media+text (slalom) feature sections, accordion with tabbed code, customer quote-case panel, card grids, FAQ accordion, and end-of-page CTA.',
  urls: [
    'https://www.mongodb.com/products/platform/atlas-database',
  ],
  // Parser invocation order matters: structured/interactive blocks are parsed
  // before the generic heading-anchored blocks (slalom/endcap also match h2),
  // so codepanel/accordion/quotecase/cards consume their DOM first.
  blocks: [
    { name: 'codepanel', instances: ['.code-panel-container'] },
    { name: 'accordion', instances: ["[id^='accordion-tab-']"] },
    { name: 'quotecase', instances: ["[role='tablist']", "[id$='-trigger-radix-']"] },
    { name: 'cards', instances: ['section:has(h3)'] },
    { name: 'hero', instances: ['body > div:has(> h1)', 'h1'], section: 'dark' },
    { name: 'endcap', instances: ['h2'], section: 'dark' },
    { name: 'slalom', instances: ['h2', 'h3'] },
  ],
};

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName 'beforeTransform' | 'afterTransform'
 * @param {Element} element DOM element to transform (document.body)
 * @param {Object} payload { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * @param {Document} document
 * @param {Object} template
 * @returns {Array<{name:string, selector:string, element:Element}>}
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  // Track which (blockName, element) pairs we've queued so the same node isn't
  // handed to the SAME parser twice (when a block lists multiple selectors).
  // We intentionally do NOT dedupe a node across DIFFERENT blocks: several
  // heading-anchored blocks (slalom, endcap) share the `h2` selector and each
  // self-filters internally to its own headings, so every block must see every h2.
  const seenPerBlock = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = [...document.querySelectorAll(selector)];
      } catch (e) {
        // selector may use :has() — supported in modern engines; ignore failures
        elements = [];
      }
      elements.forEach((element) => {
        const key = `${blockDef.name}::${selector}`;
        const pairKey = `${blockDef.name}`;
        if (seenPerBlock.has(pairKey + '::' + getNodeKey(element))) return;
        seenPerBlock.add(pairKey + '::' + getNodeKey(element));
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

// Stable-ish per-node key for dedup within a single block's selectors.
let __nodeSeq = 0;
function getNodeKey(node) {
  if (!node.__importKey) {
    __nodeSeq += 1;
    node.__importKey = `n${__nodeSeq}`;
  }
  return node.__importKey;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform — initial cleanup (strip chrome, scripts, etc.)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks and parse each with its registered parser.
    //    Parsers self-filter (e.g. slalom/endcap only act on their headings)
    //    and replace their matched element in place.
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (!parser) {
        // eslint-disable-next-line no-console
        console.warn(`No parser found for block: ${block.name}`);
        return;
      }
      // element may have been consumed/removed by an earlier parser
      if (!block.element || !block.element.isConnected) return;
      try {
        parser(block.element, { document, url, params });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
      }
    });

    // 3. afterTransform — section breaks + section metadata
    executeTransformers('afterTransform', main, payload);

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized output path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
