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

  // tools/importer/import-resource-article.js
  var import_resource_article_exports = {};
  __export(import_resource_article_exports, {
    default: () => import_resource_article_default
  });

  // tools/importer/parsers/codepanel.js
  function parse(element, { document }) {
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

  // tools/importer/parsers/table.js
  function parse2(element, { document }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    const cellContent = (sourceCell) => {
      if (!sourceCell) return "";
      const spans = sourceCell.querySelectorAll(":scope > span");
      if (spans.length === 1) {
        const text = (spans[0].textContent || "").trim();
        return spans[0].children.length ? spans[0] : text;
      }
      if (spans.length > 1) {
        return Array.from(spans);
      }
      return sourceCell.children.length ? sourceCell : (sourceCell.textContent || "").trim();
    };
    const cells = [];
    const headerCells = table ? Array.from(table.querySelectorAll(":scope > thead > tr > th")) : [];
    if (headerCells.length) {
      cells.push(headerCells.map((th) => cellContent(th)));
    }
    const bodyRows = table ? Array.from(table.querySelectorAll(":scope > tbody > tr")) : [];
    bodyRows.forEach((tr) => {
      const rowCells = Array.from(tr.querySelectorAll(":scope > td")).map((td) => cellContent(td));
      if (rowCells.length) cells.push(rowCells);
    });
    if (!cells.length && table) {
      const allRows = Array.from(table.querySelectorAll("tr"));
      allRows.forEach((tr) => {
        const rowCells = Array.from(tr.querySelectorAll(":scope > th, :scope > td")).map(
          (c) => cellContent(c)
        );
        if (rowCells.length) cells.push(rowCells);
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "table", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed.js
  function parse3(element, { document }) {
    const iframe = element.tagName === "IFRAME" ? element : element.querySelector("iframe");
    if (!iframe || !iframe.getAttribute("src")) {
      return;
    }
    const src = iframe.getAttribute("src");
    let target = iframe;
    const parent = iframe.parentElement;
    if (parent && /^(P|DIV|FIGURE)$/.test(parent.tagName)) {
      const otherChildren = Array.from(parent.children).filter((c) => c !== iframe);
      const onlyPosterSiblings = otherChildren.every((c) => /^(PICTURE|IMG)$/.test(c.tagName));
      const hasText = parent.textContent.replace(iframe.textContent || "", "").trim().length > 0;
      if (onlyPosterSiblings && !hasText) {
        target = parent;
      }
    }
    const link = document.createElement("a");
    link.href = src;
    link.textContent = src;
    const cellContent = [];
    const posterScope = target.tagName === "IFRAME" ? element : target;
    const poster = posterScope.querySelector("picture, img");
    if (poster && !iframe.contains(poster)) {
      cellContent.push(poster);
    }
    cellContent.push(link);
    const cells = [cellContent];
    const block = WebImporter.Blocks.createBlock(document, { name: "embed", cells });
    target.replaceWith(block);
  }

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
  function parse4(element, { document }) {
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

  // tools/importer/parsers/sidebar.js
  function parse5(element, { document }) {
    const cleanHref = (a) => {
      if (!a || !a.getAttribute("href")) return;
      const raw = a.getAttribute("href").trim();
      try {
        const u = new URL(raw, "https://www.mongodb.com");
        u.searchParams.delete("tck");
        a.setAttribute("href", u.searchParams.toString() ? `${u.origin}${u.pathname}?${u.searchParams}` : `${u.origin}${u.pathname}`);
      } catch (e) {
        a.setAttribute("href", raw);
      }
    };
    const makeLabel = (text) => {
      if (!text) return null;
      const p = document.createElement("p");
      const em = document.createElement("em");
      em.textContent = text;
      p.append(em);
      return p;
    };
    const labelByText = (root, re) => Array.from(root.querySelectorAll("span, p, strong, em")).find((el) => re.test(el.textContent.trim()) && el.textContent.trim().length < 40);
    const cells = [];
    const shareLabelEl = labelByText(element, /share this/i);
    const shareLinks = Array.from(element.querySelectorAll("a")).filter((a) => a.querySelector("img") && !a.textContent.trim());
    if (shareLinks.length) {
      const shareCell = [];
      const shareLabel = makeLabel(shareLabelEl ? shareLabelEl.textContent.trim() : "share this");
      if (shareLabel) shareCell.push(shareLabel);
      shareLinks.forEach((a) => {
        cleanHref(a);
        shareCell.push(a);
      });
      cells.push([shareCell]);
    }
    const avatar = Array.from(element.querySelectorAll("img")).find((img) => !shareLinks.some((a) => a.contains(img)));
    if (avatar) {
      const authorLabelEl = labelByText(element, /^author$/i);
      const lockup = avatar.closest("div") ? avatar.closest("div").parentElement : element;
      const textSpans = Array.from((lockup || element).querySelectorAll("span")).filter((s) => s.textContent.trim() && s !== authorLabelEl && s !== shareLabelEl && !/^author$/i.test(s.textContent.trim()) && !/share this/i.test(s.textContent.trim()));
      const authorCell = [];
      const authorLabel = makeLabel(authorLabelEl ? authorLabelEl.textContent.trim() : "Author");
      if (authorLabel) authorCell.push(authorLabel);
      authorCell.push(avatar);
      textSpans.forEach((s) => {
        const p = document.createElement("p");
        p.textContent = s.textContent.trim();
        authorCell.push(p);
      });
      cells.push([authorCell]);
    }
    const container = element.parentElement || element;
    const resourcesLabelEl = labelByText(container, /resources/i);
    if (resourcesLabelEl) {
      const resourceLinks = Array.from(container.querySelectorAll("a")).filter((a) => a.textContent.trim() && !element.contains(a) && !a.querySelector("img"));
      if (resourceLinks.length) {
        const resourcesCell = [];
        const resourcesLabel = makeLabel(resourcesLabelEl.textContent.trim());
        if (resourcesLabel) resourcesCell.push(resourcesLabel);
        const list = document.createElement("ul");
        resourceLinks.forEach((a) => {
          cleanHref(a);
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.setAttribute("href", a.getAttribute("href"));
          link.textContent = a.textContent.trim();
          li.append(link);
          list.append(li);
        });
        resourcesCell.push(list);
        cells.push([resourcesCell]);
      }
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "sidebar", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse6(element, { document }) {
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

  // tools/importer/parsers/endcap.js
  function parse7(element, { document }) {
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

  // tools/importer/transformers/resource-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var BLOCK_NAMES = /* @__PURE__ */ new Set(["hero", "codepanel", "table", "embed", "accordion", "sidebar", "endcap"]);
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
      element.querySelectorAll("iframe").forEach((iframe) => {
        const src = iframe.getAttribute("src") || "";
        if (!src.includes("charts.mongodb.com")) {
          iframe.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#universal-nav",
        // verified line 36: top utility nav (sticky bar)
        "#nav",
        // defensive: main nav (not in this capture)
        "#sub-nav",
        // defensive: secondary nav (not in this capture)
        "#addsearch",
        // verified line 70: search input
        "nav",
        // verified line 37: nav element
        "footer",
        // verified line 1934: footer (incl. in-footer
        //   language-selector widget leftovers)
        '[role="contentinfo"]'
        // footer landmark fallback
      ]);
      const promoBanner = element.querySelector("div.relative.z-\\[9999\\].w-full");
      if (promoBanner) promoBanner.remove();
      element.querySelectorAll("next-route-announcer").forEach((el) => el.remove());
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        "link",
        "source",
        '[role="alert"]'
      ]);
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
    }
  }

  // tools/importer/transformers/resource-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const document = element.ownerDocument;
    let hero = element.querySelector("section.bg-inverse-container");
    if (!hero) {
      const h1 = element.querySelector("h1");
      if (h1) hero = h1.closest("section") || h1;
    }
    if (hero) {
      const meta = WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { style: "dark" }
      });
      hero.appendChild(meta);
      const heroBreak = document.createElement("hr");
      if (hero.parentNode) hero.parentNode.insertBefore(heroBreak, hero.nextSibling);
    }
    const heroEl = hero;
    element.querySelectorAll("h2").forEach((h2) => {
      if (heroEl && (heroEl === h2 || heroEl.contains(h2))) return;
      if (h2.closest("table")) return;
      let anchor = h2;
      while (anchor.parentElement && anchor.parentElement !== element) {
        anchor = anchor.parentElement;
      }
      if (anchor.parentElement !== element) return;
      const prev = anchor.previousElementSibling;
      if (prev && prev.tagName === "HR") return;
      const hr = document.createElement("hr");
      element.insertBefore(hr, anchor);
    });
  }

  // tools/importer/import-resource-article.js
  var parsers = {
    codepanel: parse,
    table: parse2,
    embed: parse3,
    accordion: parse4,
    sidebar: parse5,
    hero: parse6,
    endcap: parse7
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "resource-article",
    description: "Resource/basics article: hero, rich-text body (default content) with inline codepanel/table/embed, FAQ accordion, related-resources sidebar, end CTA.",
    urls: [
      "https://www.mongodb.com/resources/basics/databases/nosql-explained"
    ],
    // Specific landmark blocks first, then heading-anchored hero/endcap last.
    blocks: [
      { name: "codepanel", instances: [".code-panel-container"] },
      { name: "table", instances: ["table.border-collapse"] },
      { name: "embed", instances: ["iframe[src*='charts.mongodb.com']"] },
      { name: "accordion", instances: ["[id^='accordion-tab-']"] },
      { name: "sidebar", instances: ["aside", "[role='complementary']"] },
      { name: "hero", instances: ["body > div:has(> h1)", "h1"], section: "dark" },
      { name: "endcap", instances: ["h2"] }
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
  var import_resource_article_default = {
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
        if (!parser) return;
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
  return __toCommonJS(import_resource_article_exports);
})();
