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

  // tools/importer/import-blog-article.js
  var import_blog_article_exports = {};
  __export(import_blog_article_exports, {
    default: () => import_blog_article_default
  });

  // tools/importer/parsers/aside.js
  function parse(element, { document }) {
    const body = element.querySelector(".callout") || element.querySelector("p");
    let icon = element.querySelector(":scope > div > img, :scope > div > div > img");
    if (!icon) {
      icon = Array.from(element.querySelectorAll("img")).find(
        (img) => !body || !body.contains(img)
      );
    }
    const cells = [];
    if (icon && icon.src && !icon.src.startsWith("data:")) {
      cells.push([icon]);
    }
    cells.push([body]);
    const block = WebImporter.Blocks.createBlock(document, { name: "aside", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sidebar.js
  function parse2(element, { document }) {
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

  // tools/importer/transformers/blog-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var BLOCK_NAMES = /* @__PURE__ */ new Set(["aside", "sidebar"]);
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
        // verified line 1035: footer (incl. in-footer
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
        "iframe",
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

  // tools/importer/transformers/blog-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
    const headings = Array.from(main.querySelectorAll("h1"));
    if (headings.length === 0) return;
    const templateSections = payload && payload.template && Array.isArray(payload.template.sections) ? payload.template.sections : null;
    if (!templateSections || templateSections.length < 2) return;
    const seen = /* @__PURE__ */ new Set();
    const sectionStarts = [];
    Array.from(main.querySelectorAll("h1, h2")).forEach((h) => {
      const top = topLevelAncestor(h, main);
      if (top && !seen.has(top)) {
        seen.add(top);
        sectionStarts.push(top);
      }
    });
    for (let i = sectionStarts.length - 1; i >= 0; i -= 1) {
      const sectionEl = sectionStarts[i];
      const tmpl = templateSections[i];
      if (tmpl && typeof tmpl.style === "string" && tmpl.style.trim() && !/^light$/i.test(tmpl.style.trim())) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: tmpl.style.trim() }
        });
        sectionEl.appendChild(metaBlock);
      }
      if (i > 0 && sectionEl.parentElement) {
        const hr = doc.createElement("hr");
        sectionEl.parentElement.insertBefore(hr, sectionEl);
      }
    }
  }

  // tools/importer/import-blog-article.js
  var parsers = {
    aside: parse,
    sidebar: parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "blog-article",
    description: "Blog article: back-link header + H1 + date, language/CTA aside callouts, long-form rich-text body (default content), article sidebar rail.",
    urls: [
      "https://www.mongodb.com/company/blog/news/redefining-database-ai-why-mongodb-acquired-voyage-ai"
    ],
    blocks: [
      { name: "aside", instances: [".aside-container"] },
      { name: "sidebar", instances: ["aside", "[role='complementary']"] }
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
  var import_blog_article_default = {
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
  return __toCommonJS(import_blog_article_exports);
})();
