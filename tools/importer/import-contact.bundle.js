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

  // tools/importer/import-contact.js
  var import_contact_exports = {};
  __export(import_contact_exports, {
    default: () => import_contact_default
  });

  // tools/importer/parsers/tabs.js
  var TAB_IDS = ["tab-sales", "tab-support", "tab-company"];
  function getLabel(node) {
    return (node.textContent || "").replace(/\s+/g, " ").trim();
  }
  function buildPanelCell(document) {
    const nodes = [];
    const box = document.querySelector(".box");
    if (box) {
      box.querySelectorAll(":scope > p").forEach((p) => {
        const text = (p.textContent || "").replace(/\s+/g, " ").trim();
        if (!text) return;
        const el = document.createElement("p");
        el.textContent = text;
        nodes.push(el);
      });
      const chatBtn = box.querySelector("#sales-contactChatTrigger, button");
      if (chatBtn) {
        const label = getLabel(chatBtn);
        if (label) {
          const a = document.createElement("a");
          a.href = "#";
          a.textContent = label;
          nodes.push(a);
        }
      }
    }
    const faq = document.querySelector('a[href="#exp-faq-bg"]');
    if (faq) {
      const a = document.createElement("a");
      a.href = faq.getAttribute("href") || "#exp-faq-bg";
      a.textContent = getLabel(faq) || "View FAQs";
      nodes.push(a);
    }
    return nodes;
  }
  function parse(element, { document }) {
    if (document.body.dataset.tabsParsed === "true") {
      element.replaceWith(document.createElement("div"));
      return;
    }
    document.body.dataset.tabsParsed = "true";
    const tabs = TAB_IDS.map((id) => {
      const nodes = Array.from(document.querySelectorAll(`[id="${id}"]`));
      const button = nodes.find((n) => n.tagName === "BUTTON");
      return button || nodes[0] || null;
    }).filter(Boolean);
    if (tabs.length === 0) {
      element.replaceWith(document.createElement("div"));
      return;
    }
    const sharedPanel = buildPanelCell(document);
    const cells = tabs.map((tab) => {
      const label = getLabel(tab);
      const panel = sharedPanel.map((n) => n.cloneNode(true));
      return [label, panel.length ? panel : ""];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs", cells });
    const selectorRow = element.parentElement;
    if (selectorRow && selectorRow.parentNode) {
      selectorRow.parentNode.insertBefore(block, selectorRow);
      selectorRow.remove();
    } else {
      element.replaceWith(block);
    }
    const sortbox = document.getElementById("sortbox");
    if (sortbox) {
      const mobileWrap = sortbox.closest('[class*="md-fix"]') || sortbox.parentElement;
      if (mobileWrap) mobileWrap.remove();
    }
    const box = document.querySelector(".box");
    if (box) {
      const faqAnchor = box.parentElement && box.parentElement.querySelector('a[href="#exp-faq-bg"]');
      if (faqAnchor) faqAnchor.remove();
      box.remove();
    }
  }

  // tools/importer/parsers/contact-faq.js
  function getLabel2(item) {
    const q = item.querySelector("p.exp-faq-question");
    if (q && q.textContent.trim()) return q.textContent.replace(/\s+/g, " ").trim();
    return item.textContent.replace(/\s+/g, " ").trim();
  }
  function getBody(item, document) {
    const answer = item.querySelector(".exp-faq-answer-el p.exp-faq-answer") || item.querySelector("p.exp-faq-answer") || item.querySelector(".exp-faq-answer-el");
    if (answer) return [answer];
    const text = item.textContent.replace(/\s+/g, " ").trim();
    if (text) {
      const p = document.createElement("p");
      p.textContent = text;
      return [p];
    }
    return [""];
  }
  function parse2(element, { document }) {
    if (document.body.dataset.contactFaqParsed === "true") {
      element.remove();
      return;
    }
    const items = Array.from(document.querySelectorAll(".exp-faq-wrapper"));
    if (items.length === 0) {
      element.remove();
      return;
    }
    document.body.dataset.contactFaqParsed = "true";
    const cells = [];
    items.forEach((item) => {
      const label = getLabel2(item);
      const body = getBody(item, document);
      cells.push([label, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/contact-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var BLOCK_NAMES = /* @__PURE__ */ new Set(["tabs", "accordion"]);
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#webxp1192-chat-root.aiChatbot",
        // verified line 777: chatbot root
        '[class*="aiChatbot"]',
        // defensive: any chatbot-classed node
        "#webxp1192-chat-root"
        // defensive: chatbot root by id only
      ]);
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
        "googletagmanager.com",
        // Ad-network conversion/retargeting pixels observed in the contact capture.
        "adnxs.com",
        // AppNexus/Xandr (secure.adnxs.com, ib.adnxs.com)
        "googleadservices.com",
        // Google Ads conversion pixel
        "bat.bing.com",
        // Microsoft/Bing UET tag
        "trkn.us",
        // Tremor/Telaria pixel
        "mathtag.com",
        // MediaMath pixel
        "adsrvr.org"
        // The Trade Desk pixel
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
        // defensive: top utility nav (not in this capture)
        "#nav",
        // defensive: main nav (not in this capture)
        "#sub-nav",
        // defensive: secondary nav (not in this capture)
        "#addsearch",
        // verified line 56: search input
        "nav",
        // verified line 23: <nav class="css-1ek23uy">
        "footer",
        // verified line 1209: footer (incl. in-footer
        //   language-selector + "Manage Cookies" /
        //   "Your Privacy Choices" leftovers)
        '[role="contentinfo"]'
        // footer landmark fallback
      ]);
      const pencilBanner = element.querySelector("div.pencil-banner-no-underline");
      if (pencilBanner) pencilBanner.remove();
      const promoBanner = element.querySelector("div.relative.z-\\[9999\\].w-full");
      if (promoBanner) promoBanner.remove();
      element.querySelectorAll("next-route-announcer").forEach((el) => el.remove());
      element.querySelectorAll('header[class*="ImageHeader"]').forEach((h) => {
        const wrap = h.closest("div.w-full.relative") || h.parentElement;
        (wrap || h).remove();
      });
      element.querySelectorAll(".exp-bg-corners").forEach((el) => el.remove());
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

  // tools/importer/transformers/contact-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function topLevelOf(node, main) {
    let cur = node;
    while (cur && cur.parentElement && cur.parentElement !== main) {
      cur = cur.parentElement;
    }
    return cur && cur.parentElement === main ? cur : null;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const main = element;
    const doc = main.ownerDocument;
    const addStyle = (sectionRoot, style) => {
      if (!style) return;
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: "Section Metadata",
        cells: { style }
      });
      sectionRoot.appendChild(metaBlock);
    };
    const firstAnchor = sections[0].selector ? main.querySelector(sections[0].selector) : null;
    for (let i = sections.length - 1; i >= 1; i -= 1) {
      const section = sections[i];
      const anchor = section.selector ? main.querySelector(section.selector) : null;
      if (!anchor || !firstAnchor) continue;
      let subtree = anchor;
      let p = subtree.parentElement;
      while (p && p !== main && !p.contains(firstAnchor)) {
        subtree = p;
        p = p.parentElement;
      }
      if (!subtree || subtree === main || subtree.contains(firstAnchor)) continue;
      const heroContainer = topLevelOf(subtree, main);
      const newSection = doc.createElement("div");
      newSection.appendChild(subtree);
      const refNode = heroContainer ? heroContainer.nextSibling : null;
      if (refNode) {
        main.insertBefore(newSection, refNode);
      } else {
        main.appendChild(newSection);
      }
      main.insertBefore(doc.createElement("hr"), newSection);
      addStyle(newSection, section.style);
    }
    const first = sections[0];
    if (first && first.style) {
      const firstTop = firstAnchor && topLevelOf(firstAnchor, main) || main.firstElementChild;
      if (firstTop) addStyle(firstTop, first.style);
    }
  }

  // tools/importer/import-contact.js
  var parsers = {
    tabs: parse,
    "contact-faq": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "contact",
    description: "Contact page: H1 + 3-tab contact-type selector (Sales/Product&Billing/Company), chat-intro panel (default content), Marketo inquiry form (captured as default content), FAQ accordion.",
    urls: [
      "https://www.mongodb.com/company/contact"
    ],
    blocks: [
      { name: "tabs", instances: ["#tab-sales", "#tab-support", "#tab-company"] },
      { name: "contact-faq", instances: [".exp-faq-wrapper"] }
    ],
    sections: [
      { section: 1, style: "dark", selector: "h1" },
      { section: 2, selector: "#exp-faq-bg" }
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
  var import_contact_default = {
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
  return __toCommonJS(import_contact_exports);
})();
