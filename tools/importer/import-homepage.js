/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import hpHeroParser from './parsers/hp-hero.js';
import hpQuotecaseParser from './parsers/hp-quotecase.js';
import hpPathfinderParser from './parsers/hp-pathfinder.js';
import hpLogowallParser from './parsers/hp-logowall.js';
import hpDeployCardsParser from './parsers/hp-deploy-cards.js';
import hpUsecaseTabsParser from './parsers/hp-usecase-tabs.js';
import hpSkillsCardsParser from './parsers/hp-skills-cards.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/homepage-cleanup.js';
import sectionsTransformer from './transformers/homepage-sections.js';

const parsers = {
  'hp-hero': hpHeroParser,
  'hp-quotecase': hpQuotecaseParser,
  'hp-pathfinder': hpPathfinderParser,
  'hp-logowall': hpLogowallParser,
  'hp-deploy-cards': hpDeployCardsParser,
  'hp-usecase-tabs': hpUsecaseTabsParser,
  'hp-skills-cards': hpSkillsCardsParser,
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'MongoDB homepage: hero (One data platform), customer-stories quotecase, two pathfinder panels, partner logowall, "Deploy Your Way" cards, "Level Up" skills cards, and an 8-tab Atlas use-case tabs block. All sections dark except the partner logowall. AI assistant + nav/footer/banner are chrome (stripped).',
  urls: [
    'https://www.mongodb.com/',
  ],
  // Specific landmark/container parsers first; the generic skills-cards
  // (section:has(h3)) runs last so it only matches the leftover Level-Up grid.
  blocks: [
    { name: 'hp-hero', instances: ['.p13n-hp-hero'] },
    { name: 'hp-quotecase', instances: ['.p13n-use-case-carousel'] },
    { name: 'hp-pathfinder', instances: ['.p13n-pathfinder-new-bl', '.p13n-pathfinder'] },
    { name: 'hp-logowall', instances: ['.p13n-partner-carousel'] },
    { name: 'hp-deploy-cards', instances: ['.webxp-471-wrapper'] },
    { name: 'hp-usecase-tabs', instances: ['[id^="radix-:r0:-trigger-"]'] },
    { name: 'hp-skills-cards', instances: ['section:has(h3)'] },
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
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
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
