/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-product-detail.js
  var import_product_detail_exports = {};
  __export(import_product_detail_exports, {
    default: () => import_product_detail_default
  });

  // tools/importer/parsers/accordion.js
  function findRow(button) {
    let node = button;
    for (let depth = 0; depth < 4 && node.parentElement; depth += 1) {
      node = node.parentElement;
      if (node.querySelector('[id^="content-"]')) return node;
    }
    return button.parentElement || button;
  }
  function findContent(button, row) {
    let sib = button.nextElementSibling;
    while (sib) {
      if (sib.id && sib.id.indexOf("content-") === 0) return sib;
      const inner = sib.querySelector && sib.querySelector('[id^="content-"]');
      if (inner) return inner;
      sib = sib.nextElementSibling;
    }
    return row.querySelector('[id^="content-"]');
  }
  function collectGroup(startRow) {
    const parent = startRow.parentElement;
    if (!parent) return { container: startRow, items: [] };
    const rows = Array.from(parent.children).filter(
      (child) => child.querySelector && child.querySelector('[id^="accordion-tab-"]')
    );
    const items = rows.map((row) => {
      const button = row.querySelector('[id^="accordion-tab-"]');
      return { row, button };
    }).filter((it) => it.button);
    return { container: parent, items };
  }
  function extractCode(panelContainer) {
    const textarea = panelContainer.querySelector('textarea[id^="codesnippet-"]') || panelContainer.querySelector("textarea");
    let raw = textarea ? textarea.value || textarea.textContent || "" : "";
    if (!raw.trim()) {
      raw = Array.from(panelContainer.querySelectorAll("pre.CodeMirror-line")).map((pre) => pre.textContent).join("\n");
    }
    return raw.split("\n").map((line) => line.replace(/\s+$/, "")).join("\n").replace(/^\n+|\n+$/g, "").trim();
  }
  function buildNestedCodepanel(panelContainer, document) {
    const tabLabels = Array.from(
      panelContainer.querySelectorAll(".css-h80hff, .css-v2d161")
    ).map((el) => el.textContent.trim()).filter(Boolean);
    const code = extractCode(panelContainer);
    const makePre = (text) => {
      const pre = document.createElement("pre");
      const codeEl = document.createElement("code");
      codeEl.textContent = text;
      pre.append(codeEl);
      return pre;
    };
    const cells = [];
    if (tabLabels.length > 0) {
      tabLabels.forEach((label, i) => cells.push([label, makePre(i === 0 ? code : "")]));
    } else {
      cells.push([makePre(code)]);
    }
    return WebImporter.Blocks.createBlock(document, { name: "codepanel", cells });
  }
  function buildBodyCell(contentPanel, row, document) {
    const bodyNodes = [];
    if (contentPanel) {
      const rich = Array.from(contentPanel.querySelectorAll("p, ul, ol")).filter((n) => !n.closest(".code-panel-container"));
      rich.forEach((n) => bodyNodes.push(n.cloneNode(true)));
      if (bodyNodes.length === 0) {
        const text = contentPanel.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          const p = document.createElement("p");
          p.textContent = text;
          bodyNodes.push(p);
        }
      }
      const cta = contentPanel.querySelector("a[href]");
      if (cta && !cta.closest(".code-panel-container")) {
        const href = (cta.getAttribute("href") || "").trim();
        const label = cta.textContent.replace(/\s+/g, " ").trim();
        if (href && label) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = label;
          bodyNodes.push(a);
        }
      }
    }
    const codePanel = row && row.querySelector(".code-panel-container");
    if (codePanel) bodyNodes.push(buildNestedCodepanel(codePanel, document));
    return bodyNodes;
  }
  function getLabel(button) {
    const heading = button.querySelector("h2, h3, h4, h5, h6");
    if (heading && heading.textContent.trim()) return heading.textContent.trim();
    const span = button.querySelector("span");
    if (span && span.textContent.trim()) return span.textContent.trim();
    return button.textContent.replace(/\s+/g, " ").trim();
  }
  function isNonPreferredDuplicate(container, items, document) {
    const groupHasCode = !!container.querySelector(".code-panel-container");
    if (groupHasCode || items.length === 0) return false;
    const firstLabel = getLabel(items[0].button);
    if (!firstLabel) return false;
    const allTriggers = Array.from(document.querySelectorAll('[id^="accordion-tab-"]'));
    return allTriggers.some((btn) => {
      if (container.contains(btn)) return false;
      if (getLabel(btn) !== firstLabel) return false;
      const twinRow = findRow(btn);
      const twin = collectGroup(twinRow).container;
      return twin && twin !== container && !!twin.querySelector(".code-panel-container");
    });
  }
  function parse(element, { document }) {
    const row = findRow(element);
    const { container, items } = collectGroup(row);
    if (!container || container.getAttribute("data-accordion-parsed") === "true") {
      element.replaceWith(document.createElement("div"));
      return;
    }
    if (isNonPreferredDuplicate(container, items, document)) {
      container.setAttribute("data-accordion-parsed", "true");
      element.replaceWith(document.createElement("div"));
      return;
    }
    container.setAttribute("data-accordion-parsed", "true");
    const cells = [];
    items.forEach(({ row: itemRow, button }) => {
      const label = getLabel(button);
      const content = findContent(button, itemRow);
      const body = buildBodyCell(content, itemRow, document);
      cells.push([label, body.length ? body : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(document.createElement("div"));
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse2(element, { document }) {
    const grid = element.parentElement;
    if (!grid) return;
    const cardSections = Array.from(grid.children).filter(
      (child) => child.matches("section") && child.querySelector("h3")
    );
    if (cardSections.length === 0) return;
    if (element !== cardSections[0]) {
      element.remove();
      return;
    }
    const cells = [];
    cardSections.forEach((card) => {
      const img = card.querySelector("img");
      const heading = card.querySelector("h3");
      let eyebrow = null;
      const candidateSpans = Array.from(card.querySelectorAll("span"));
      for (const span of candidateSpans) {
        const text = (span.textContent || "").trim();
        if (!text) continue;
        if (span.querySelector("h3, p, a, img, span")) continue;
        if (span.closest("a")) continue;
        if (span.classList.contains("textlink-link-icon-class")) continue;
        if (heading && span.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) {
          eyebrow = span;
          break;
        }
      }
      const paragraphs = Array.from(card.querySelectorAll("p"));
      const links = Array.from(card.querySelectorAll("a")).filter(
        (a) => !(heading && heading.contains(a))
      );
      const body = [];
      if (eyebrow) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = (eyebrow.textContent || "").trim();
        p.append(strong);
        body.push(p);
      }
      if (heading) body.push(heading);
      paragraphs.forEach((p) => body.push(p));
      links.forEach((a) => body.push(a));
      if (img) {
        cells.push([img, body]);
      } else {
        cells.push([body]);
      }
    });
    cardSections.slice(1).forEach((card) => card.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/codepanel.js
  function parse3(element, { document }) {
    const labelContainer = element.querySelector(".css-j5hm91");
    let labels = [];
    if (labelContainer) {
      labels = Array.from(labelContainer.querySelectorAll(":scope > .css-h80hff, :scope > .css-v2d161"));
    }
    let activeText = "";
    const codeArea = element.querySelector('textarea[id^="codesnippet-"]');
    if (codeArea && codeArea.value !== void 0 && codeArea.value !== "") {
      activeText = codeArea.value;
    } else if (codeArea) {
      activeText = codeArea.textContent || "";
    }
    const normalizeCode = (raw) => raw.replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/\s+$/, "")).join("\n").replace(/^\n+/, "").replace(/\n+$/, "");
    const buildPre = (text) => {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = text;
      pre.append(code);
      return pre;
    };
    const cells = [];
    if (labels.length > 0) {
      const activeIndex = labels.findIndex((l) => l.classList.contains("css-h80hff"));
      labels.forEach((labelEl, i) => {
        const labelText = labelEl.textContent.trim();
        const codeText = i === activeIndex ? normalizeCode(activeText) : "";
        cells.push([labelText, buildPre(codeText)]);
      });
    } else {
      cells.push([buildPre(normalizeCode(activeText))]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "codepanel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/endcap.js
  function parse4(element, { document }) {
    const headingText = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (!/get started with atlas today/i.test(headingText)) return;
    const heading = element;
    let benefitList = null;
    let container = heading.parentElement;
    while (container && container.tagName !== "BODY") {
      const ul = container.querySelector("ul");
      if (ul) {
        benefitList = ul;
        break;
      }
      container = container.parentElement;
    }
    if (!container || container.tagName === "BODY") {
      container = heading.closest("section") || heading.parentElement && heading.parentElement.parentElement || heading.parentElement;
    }
    if (!container) return;
    let benefitPanel = null;
    if (benefitList) {
      benefitPanel = benefitList;
      let up = benefitList.parentElement;
      while (up && up !== container && !up.contains(heading)) {
        benefitPanel = up;
        up = up.parentElement;
      }
    }
    let subheadText = "";
    let sib = heading.nextElementSibling;
    while (sib) {
      const text = (sib.textContent || "").replace(/\s+/g, " ").trim();
      if (text && !sib.querySelector("a, ul, ol, h1, h2, h3")) {
        subheadText = text;
        break;
      }
      sib = sib.nextElementSibling;
    }
    if (!subheadText) {
      const p = heading.parentElement && heading.parentElement.querySelector("p");
      if (p) subheadText = (p.textContent || "").replace(/\s+/g, " ").trim();
    }
    const ctaAnchors = Array.from(container.querySelectorAll("a")).filter(
      (a) => !(benefitPanel && benefitPanel.contains(a)) && (a.textContent || "").trim()
    );
    const cleanLinks = ctaAnchors.map((a) => {
      const href = a.getAttribute("href");
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!href || !text) return null;
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text;
      return link;
    }).filter(Boolean);
    const headingCopy = document.createElement(heading.tagName.toLowerCase());
    headingCopy.textContent = headingText;
    const col1 = [headingCopy];
    if (subheadText) {
      const p = document.createElement("p");
      p.textContent = subheadText;
      col1.push(p);
    }
    cleanLinks.forEach((a) => col1.push(a));
    const cells = [];
    if (benefitList) {
      const col2 = [];
      let eyebrowText = "";
      const candidates = Array.from(benefitPanel.querySelectorAll("span, p"));
      for (const node of candidates) {
        const text = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (!text) continue;
        if (node.querySelector("ul, ol, a, span")) continue;
        if (benefitList.contains(node)) continue;
        eyebrowText = text;
        break;
      }
      if (eyebrowText) {
        const label = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = eyebrowText;
        label.append(strong);
        col2.push(label);
      }
      const items = Array.from(benefitList.querySelectorAll(":scope > li"));
      const list = document.createElement("ul");
      items.forEach((li) => {
        const text = (li.textContent || "").replace(/\s+/g, " ").trim();
        if (!text) return;
        const newLi = document.createElement("li");
        newLi.textContent = text;
        list.append(newLi);
      });
      if (list.children.length) col2.push(list);
      cells.push([col1, col2]);
    } else {
      cells.push([col1]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "endcap", cells });
    element.replaceWith(block);
    Array.from(container.querySelectorAll("*")).forEach((node) => {
      if (node !== block && !block.contains(node) && !node.contains(block)) {
        node.remove();
      }
    });
  }

  // tools/importer/parsers/hero.js
  function parse5(element, { document }) {
    const headingEl = element.matches("h1") ? element : element.querySelector("h1");
    const scope = headingEl ? headingEl.closest("section") || element : element;
    const heading = headingEl ? headingEl.cloneNode(true) : null;
    const description = scope.querySelector("p");
    const ctaLinks = Array.from(scope.querySelectorAll("a[href]")).filter(
      (a) => !a.closest(".code-panel-container")
    );
    const heroImage = scope.querySelector(
      'img[alt*="illustration" i], img[alt*="document model" i], picture'
    );
    const content = [];
    if (heroImage) content.push(heroImage);
    if (heading) content.push(heading);
    if (description) content.push(description);
    content.push(...ctaLinks);
    const cells = [[content]];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quotecase.js
  var norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  function resolveRoot(element, document) {
    const byId = document && document.querySelector ? document.querySelector("#customer-success") : null;
    if (byId) return byId;
    const isRegion = (el) => el && el.querySelector && el.querySelector('[id*="-trigger-"] img') && el.querySelector('[id*="-content-"] [class*="css-8awcyh"], [id*="-content-"] blockquote');
    let node = element;
    for (let i = 0; node && i < 15; i += 1) {
      if (isRegion(node)) return node;
      node = node.parentElement;
    }
    return null;
  }
  function buildCaseFromPanel(panel, document) {
    const logo = panel.querySelector('img[alt]:not([alt="" i]), img');
    const stats = Array.from(panel.querySelectorAll('[class*="css-pulw89"]'));
    const statsCell = [];
    stats.forEach((stat) => {
      statsCell.push(stat);
    });
    const eyebrow = panel.querySelector('[class*="css-3pu2gp"]');
    const quote = panel.querySelector('[class*="css-8awcyh"], blockquote');
    let attribution = panel.querySelector('[class*="css-1untns5"]');
    if (attribution && attribution.parentElement) attribution = attribution.parentElement;
    const cta = panel.querySelector("a[href]");
    const contentCell = [];
    if (eyebrow && norm(eyebrow.textContent)) {
      const p = document.createElement("p");
      const em = document.createElement("em");
      em.textContent = norm(eyebrow.textContent);
      p.append(em);
      contentCell.push(p);
    }
    if (quote && norm(quote.textContent)) {
      const bq = document.createElement("blockquote");
      bq.textContent = norm(quote.textContent);
      contentCell.push(bq);
    }
    if (attribution && norm(attribution.textContent)) {
      contentCell.push(attribution);
    }
    if (cta && norm(cta.textContent)) {
      const link = document.createElement("a");
      link.href = cta.getAttribute("href");
      link.textContent = norm(cta.textContent) || "Read Case Study";
      const p = document.createElement("p");
      p.append(link);
      contentCell.push(p);
    }
    return {
      logo,
      cells: [
        logo ? [logo] : "",
        statsCell.length ? statsCell : "",
        contentCell.length ? contentCell : ""
      ]
    };
  }
  function parse6(element, { document }) {
    const root = resolveRoot(element, document);
    const flagHost = document.body || document.documentElement;
    const alreadyParsed = flagHost && flagHost.dataset && flagHost.dataset.quotecaseParsed === "true";
    if (!root || alreadyParsed) {
      if (element !== root) {
        const fragment = element.closest ? element.closest('[id*="-content-"]') : null;
        const toRemove = fragment || element;
        if (toRemove && toRemove.remove) toRemove.remove();
      }
      return;
    }
    if (flagHost && flagHost.dataset) flagHost.dataset.quotecaseParsed = "true";
    const triggers = Array.from(root.querySelectorAll('[id*="-trigger-"]'));
    const tabLogos = triggers.map((t) => t.querySelector("img")).filter(Boolean);
    const panels = Array.from(root.querySelectorAll('[id*="-content-"]')).filter((p) => p.querySelector('[class*="css-8awcyh"], blockquote, [class*="css-pulw89"]'));
    const rows = [];
    const usedLogoSrcs = /* @__PURE__ */ new Set();
    panels.forEach((panel) => {
      const built = buildCaseFromPanel(panel, document);
      if (built.logo) usedLogoSrcs.add(built.logo.getAttribute("src"));
      rows.push(built.cells);
    });
    tabLogos.forEach((logo) => {
      const src = logo.getAttribute("src");
      if (usedLogoSrcs.has(src)) return;
      usedLogoSrcs.add(src);
      rows.push([[logo], "", ""]);
    });
    if (!rows.length) rows.push(["", "", ""]);
    const cells = rows;
    const block = WebImporter.Blocks.createBlock(document, { name: "quotecase", cells });
    element.replaceWith(block);
    if (root && root !== element && !block.contains(root) && !root.contains(block) && root.remove) {
      root.remove();
    }
  }

  // tools/importer/parsers/slalom.js
  var normalize = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  var KNOWN_SLALOM_HEADINGS = new Set([
    "ai ready",
    "accelerate innovation with the document model",
    "scale apps with confidence",
    "optimize deployments effortlessly",
    "enterprise-grade security without complexity"
  ].map(normalize));
  function findImageContainer(heading) {
    let c = heading.parentElement;
    let hops = 0;
    while (c && hops < 8) {
      if (c.querySelector("img")) return c;
      c = c.parentElement;
      hops += 1;
    }
    return null;
  }
  function isCardGridItem(heading) {
    const level = heading.tagName;
    let c = heading.parentElement;
    let hops = 0;
    while (c && hops < 6) {
      const sameLevel = c.querySelectorAll(level).length;
      if (sameLevel >= 3) return true;
      c = c.parentElement;
      hops += 1;
    }
    return false;
  }
  function isSlalomHeading(heading) {
    if (KNOWN_SLALOM_HEADINGS.has(normalize(heading.textContent))) return true;
    if (!/^H[23]$/.test(heading.tagName)) return false;
    if (isCardGridItem(heading)) return false;
    const container = findImageContainer(heading);
    if (!container) return false;
    const imgs = container.querySelectorAll("img");
    if (imgs.length !== 1) return false;
    const hasParagraph = !!container.querySelector("p") || Array.from(container.querySelectorAll("div")).some(
      (d) => !d.querySelector("a, img, h1, h2, h3, div") && (d.textContent || "").trim().length > 30
    );
    return hasParagraph;
  }
  function parse7(element, { document }) {
    const heading = element;
    if (!isSlalomHeading(heading)) {
      return;
    }
    let container = heading.parentElement;
    while (container && !container.querySelector("img")) {
      container = container.parentElement;
    }
    if (!container) container = heading.parentElement;
    let textCol = heading.parentElement;
    while (textCol && textCol.parentElement && textCol.parentElement !== container && !textCol.parentElement.querySelector("img")) {
      textCol = textCol.parentElement;
    }
    if (!textCol) textCol = heading.parentElement;
    const contentCell = [heading.cloneNode(true)];
    const paragraphs = Array.from(textCol.querySelectorAll("p"));
    if (paragraphs.length) {
      paragraphs.forEach((p) => contentCell.push(p.cloneNode(true)));
    } else {
      const textDivs = Array.from(textCol.querySelectorAll("div")).filter((d) => {
        if (d.querySelector("a, img, h1, h2, h3, div")) return false;
        return (d.textContent || "").trim().length > 30;
      });
      if (textDivs.length) {
        const p = document.createElement("p");
        p.textContent = textDivs[0].textContent.trim();
        contentCell.push(p);
      }
    }
    const ctaAnchor = textCol.querySelector("a[href]");
    if (ctaAnchor) {
      const href = ctaAnchor.getAttribute("href");
      const label = (ctaAnchor.textContent || "").trim();
      if (href && label) {
        const link = document.createElement("a");
        link.setAttribute("href", href);
        link.textContent = label;
        const ctaPara = document.createElement("p");
        ctaPara.append(link);
        contentCell.push(ctaPara);
      }
    }
    const img = container.querySelector("img");
    const mediaCell = img ? [img.cloneNode(true)] : [""];
    const cells = [contentCell, mediaCell];
    const block = WebImporter.Blocks.createBlock(document, { name: "slalom", cells });
    const origParagraphs = paragraphs;
    const origImg = img;
    const origCta = ctaAnchor;
    element.replaceWith(block);
    origParagraphs.forEach((p) => {
      if (p && p.isConnected) p.remove();
    });
    if (origImg && origImg.isConnected) {
      let imgNode = origImg;
      while (imgNode.parentElement && imgNode.parentElement !== container && imgNode.parentElement.children.length === 1) {
        imgNode = imgNode.parentElement;
      }
      imgNode.remove();
    }
    if (origCta && origCta.isConnected) origCta.remove();
  }

  // tools/importer/transformers/mongodb-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        // OneTrust container (if present)
        '[role="alertdialog"]',
        // privacy / cookie dialog
        'region[aria-label="Cookie banner"]',
        // cookie banner region
        '[aria-label="Cookie banner"]',
        // cookie banner region (no role)
        ".intercom-lightweight-app",
        // Intercom messenger root
        '[class*="intercom"]',
        // any Intercom chrome
        '[aria-label="Open Intercom Messenger"]'
        // Intercom launcher button
      ]);
      const TRACKING_HOSTS = [
        "usbrowserspeed.com",
        "dpmsrv.com",
        "evs.blue.mongodb.com",
        "connect.facebook.net",
        "facebook.com/tr",
        "munchkin.marketo",
        "mktoresp.com",
        "doubleclick.net",
        "google-analytics.com",
        "googletagmanager.com"
      ];
      element.querySelectorAll("a[href], img[src], [data-src]").forEach((node) => {
        const url = node.getAttribute("href") || node.getAttribute("src") || node.getAttribute("data-src") || "";
        if (TRACKING_HOSTS.some((h) => url.includes(h)) || /[[\]]/.test(url)) {
          node.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#universal-nav",
        // verified line 36: top utility nav
        "#nav",
        // verified line 794: main nav
        "#sub-nav",
        // verified line 786: secondary nav
        "#addsearch",
        // verified line 70: search input
        "nav",
        // verified lines 37, 794, 828: all nav elements
        "footer",
        // verified line 2416: footer (incl. language selector,
        //   "Manage Cookies", "Your Privacy Choices" leftovers)
        '[role="contentinfo"]'
        // footer landmark fallback
      ]);
      const promoBanner = element.querySelector("div.relative.z-\\[9999\\].w-full");
      if (promoBanner) promoBanner.remove();
      element.querySelectorAll("next-route-announcer").forEach((el) => el.remove());
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "iframe",
        "noscript",
        "link",
        "source",
        '[role="alert"]'
      ]);
      const BLOCK_NAMES = /* @__PURE__ */ new Set(["hero", "slalom", "codepanel", "accordion", "quotecase", "cards", "endcap"]);
      const byLabel = /* @__PURE__ */ new Map();
      element.querySelectorAll("table").forEach((table) => {
        const firstCell = table.querySelector("th, td");
        if (!firstCell) return;
        const nameText = (firstCell.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        if (!BLOCK_NAMES.has(nameText)) return;
        const text = (table.textContent || "").replace(/\s+/g, " ").trim();
        const label = `${nameText}::${text.slice(0, 120)}`;
        const existing = byLabel.get(label);
        if (!existing) {
          byLabel.set(label, table);
          return;
        }
        if (text.length > (existing.textContent || "").replace(/\s+/g, " ").trim().length) {
          existing.remove();
          byLabel.set(label, table);
        } else {
          table.remove();
        }
      });
      byLabel.forEach((table) => {
        const tableText = (table.textContent || "").replace(/\s+/g, " ").trim();
        let sib = table.nextElementSibling;
        while (sib && sib.tagName === "P") {
          const sibText = (sib.textContent || "").replace(/\s+/g, " ").trim();
          const next = sib.nextElementSibling;
          if (sibText && tableText.includes(sibText)) {
            sib.remove();
          }
          sib = next;
        }
      });
    }
  }

  // tools/importer/transformers/mongodb-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var DARK_SECTIONS = /* @__PURE__ */ new Set([1, 7, 8, 12]);
  function topLevelAncestor(node, main) {
    let current = node;
    while (current && current.parentElement && current.parentElement !== main) {
      current = current.parentElement;
    }
    return current && current.parentElement === main ? current : node;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const main = element;
    const doc = payload && payload.document || main.ownerDocument;
    const headings = Array.from(main.querySelectorAll("h1, h2"));
    if (headings.length === 0) return;
    const templateSections = payload && payload.template && Array.isArray(payload.template.sections) ? payload.template.sections : null;
    const seen = /* @__PURE__ */ new Set();
    const sectionStarts = [];
    headings.forEach((h) => {
      const top = topLevelAncestor(h, main);
      if (top && !seen.has(top)) {
        seen.add(top);
        sectionStarts.push(top);
      }
    });
    for (let i = sectionStarts.length - 1; i >= 0; i -= 1) {
      const ordinal = i + 1;
      const sectionEl = sectionStarts[i];
      let isDark = DARK_SECTIONS.has(ordinal);
      if (templateSections && templateSections[i] && typeof templateSections[i].style === "string") {
        isDark = /dark/i.test(templateSections[i].style);
      }
      if (isDark) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: "dark" }
        });
        sectionEl.appendChild(metaBlock);
      }
      if (i > 0) {
        const hr = doc.createElement("hr");
        sectionEl.parentElement.insertBefore(hr, sectionEl);
      }
    }
  }

  // tools/importer/import-product-detail.js
  var parsers = {
    accordion: parse,
    cards: parse2,
    codepanel: parse3,
    endcap: parse4,
    hero: parse5,
    quotecase: parse6,
    slalom: parse7
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "product-detail",
    description: "Product detail page: hero with inline CLI code panel, alternating media+text (slalom) feature sections, accordion with tabbed code, customer quote-case panel, card grids, FAQ accordion, and end-of-page CTA.",
    urls: [
      "https://www.mongodb.com/products/platform/atlas-database"
    ],
    // Parser invocation order matters: structured/interactive blocks are parsed
    // before the generic heading-anchored blocks (slalom/endcap also match h2),
    // so codepanel/accordion/quotecase/cards consume their DOM first.
    blocks: [
      { name: "codepanel", instances: [".code-panel-container"] },
      { name: "accordion", instances: ["[id^='accordion-tab-']"] },
      { name: "quotecase", instances: ["[role='tablist']", "[id$='-trigger-radix-']"] },
      { name: "cards", instances: ["section:has(h3)"] },
      { name: "hero", instances: ["body > div:has(> h1)", "h1"], section: "dark" },
      { name: "endcap", instances: ["h2"], section: "dark" },
      { name: "slalom", instances: ["h2", "h3"] }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seenPerBlock = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = [...document.querySelectorAll(selector)];
        } catch (e) {
          elements = [];
        }
        elements.forEach((element) => {
          const key = `${blockDef.name}::${selector}`;
          const pairKey = `${blockDef.name}`;
          if (seenPerBlock.has(pairKey + "::" + getNodeKey(element))) return;
          seenPerBlock.add(pairKey + "::" + getNodeKey(element));
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var __nodeSeq = 0;
  function getNodeKey(node) {
    if (!node.__importKey) {
      __nodeSeq += 1;
      node.__importKey = `n${__nodeSeq}`;
    }
    return node.__importKey;
  }
  var import_product_detail_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        const parser = parsers[block.name];
        if (!parser) {
          console.warn(`No parser found for block: ${block.name}`);
          return;
        }
        if (!block.element || !block.element.isConnected) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_product_detail_exports);
})();
