/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import codepanelParser from './parsers/codepanel.js';
import tableParser from './parsers/table.js';
import embedParser from './parsers/embed.js';
import accordionParser from './parsers/accordion.js';
import sidebarParser from './parsers/sidebar.js';
import heroParser from './parsers/hero.js';
import endcapParser from './parsers/endcap.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/resource-cleanup.js';
import sectionsTransformer from './transformers/resource-sections.js';

const parsers = {
  codepanel: codepanelParser,
  table: tableParser,
  embed: embedParser,
  accordion: accordionParser,
  sidebar: sidebarParser,
  hero: heroParser,
  endcap: endcapParser,
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

const PAGE_TEMPLATE = {
  name: 'resource-article',
  description: 'Resource/basics article: hero, rich-text body (default content) with inline codepanel/table/embed, FAQ accordion, related-resources sidebar, end CTA.',
  urls: [
    'https://www.mongodb.com/resources/basics/databases/nosql-explained',
  ],
  // Specific landmark blocks first, then heading-anchored hero/endcap last.
  blocks: [
    { name: 'codepanel', instances: ['.code-panel-container'] },
    { name: 'table', instances: ['table.border-collapse'] },
    { name: 'embed', instances: ["iframe[src*='charts.mongodb.com']"] },
    { name: 'accordion', instances: ["[id^='accordion-tab-']"] },
    { name: 'sidebar', instances: ['aside', "[role='complementary']"] },
    { name: 'hero', instances: ['body > div:has(> h1)', 'h1'], section: 'dark' },
    { name: 'endcap', instances: ['h2'] },
  ],
};

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seenPerBlock = new Set();
  let nodeSeq = 0;
  const keyOf = (node) => {
    if (!node.__importKey) {
      nodeSeq += 1;
      node.__importKey = `n${nodeSeq}`;
    }
    return node.__importKey;
  };
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = [...document.querySelectorAll(selector)];
      } catch (e) {
        elements = [];
      }
      elements.forEach((element) => {
        const k = `${blockDef.name}::${keyOf(element)}`;
        if (seenPerBlock.has(k)) return;
        seenPerBlock.add(k);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (!parser) return;
      if (!block.element || !block.element.isConnected) return;
      try {
        parser(block.element, { document, url, params });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

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
