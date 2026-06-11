/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import registerFormParser from './parsers/register-form.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/register-cleanup.js';
import sectionsTransformer from './transformers/register-sections.js';

const parsers = {
  'register-form': registerFormParser,
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

const PAGE_TEMPLATE = {
  name: 'register',
  description: 'Atlas sign-up/login page: dark hero card with heading + subheading, Google SSO button, sign-up form (Forms workflow -> form block), and a sign-in link. Minimal chrome (logo + slim legal footer + AI helper widget all stripped).',
  urls: [
    'https://www.mongodb.com/cloud/atlas/register',
  ],
  blocks: [
    { name: 'register-form', instances: ['#atlas-form'] },
  ],
  sections: [
    { section: 1, style: 'dark', selector: 'h4' },
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
