/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import videoParser from './parsers/video.js';
import sidebarParser from './parsers/sidebar.js';
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/webinar-cleanup.js';
import sectionsTransformer from './transformers/webinar-sections.js';

const parsers = {
  video: videoParser,
  sidebar: sidebarParser,
  cards: cardsParser,
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

const PAGE_TEMPLATE = {
  name: 'webinar',
  description: 'On-demand webinar: eyebrow + H1, video player (poster), description/topics/speakers body (default content), date+share sidebar rail, and a "More like this" related-cards grid.',
  urls: [
    'https://www.mongodb.com/resources/products/platform/webinar-with-gcp-hong-kong',
  ],
  // cards first (self-contained <section> grid), then the precise landmarks.
  blocks: [
    { name: 'cards', instances: ['section:has(h3)'] },
    { name: 'video', instances: ['.media-container'] },
    { name: 'sidebar', instances: ['aside', "[role='complementary']"] },
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
