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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hp-hero.js
  function parse(element, { document }) {
    const hero = element.matches(".p13n-hp-hero") ? element : element.querySelector(".p13n-hp-hero");
    if (!hero) return;
    const heading = hero.querySelector("h1.hero-title") || hero.querySelector("h1");
    const description = hero.querySelector(".hero-description");
    const ctaLinks = Array.from(hero.querySelectorAll(".hero-cta-wrapper a[href]"));
    const content = [];
    if (heading) {
      const h = document.createElement("h1");
      h.textContent = (heading.textContent || "").replace(/\s+/g, " ").trim();
      content.push(h);
    }
    if (description) {
      const p = document.createElement("p");
      p.textContent = (description.textContent || "").replace(/\s+/g, " ").trim();
      content.push(p);
    }
    ctaLinks.forEach((a) => {
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = (a.textContent || "").replace(/\s+/g, " ").trim();
      content.push(link);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", cells: [[content]] });
    hero.replaceWith(block);
  }

  // tools/importer/parsers/hp-quotecase.js
  function parse2(element, { document }) {
    const carousel = element.matches(".p13n-use-case-carousel") ? element : element.querySelector(".p13n-use-case-carousel");
    if (!carousel) return;
    const trigger = carousel.querySelector('[id$="-trigger-0"]');
    const panel = carousel.querySelector('[id$="-content-0"]');
    if (!panel) return;
    let logoCell = "";
    const logoImg = trigger && trigger.querySelector("img");
    if (logoImg) {
      const img = document.createElement("img");
      img.src = logoImg.getAttribute("src");
      img.alt = (logoImg.getAttribute("alt") || "").replace(/\s*logo$/i, "").trim();
      logoCell = img;
    }
    const statsCell = [];
    panel.querySelectorAll(".css-pulw89").forEach((stat) => {
      const value = stat.querySelector(".css-59f1gn");
      const label = stat.querySelector(".css-aone06");
      if (value) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = (value.textContent || "").trim();
        p.append(strong);
        if (label) p.append(document.createTextNode(` ${(label.textContent || "").trim()}`));
        statsCell.push(p);
      }
    });
    const quoteCell = [];
    const tag = panel.querySelector(".css-3pu2gp");
    if (tag && tag.textContent.trim()) {
      const p = document.createElement("p");
      const em = document.createElement("em");
      em.textContent = tag.textContent.trim();
      p.append(em);
      quoteCell.push(p);
    }
    const quote = panel.querySelector(".css-8awcyh");
    if (quote && quote.textContent.trim()) {
      const bq = document.createElement("blockquote");
      bq.textContent = quote.textContent.replace(/\s+/g, " ").trim();
      quoteCell.push(bq);
    }
    panel.querySelectorAll("a[href]").forEach((a) => {
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = text;
      quoteCell.push(link);
    });
    const cells = [[logoCell, statsCell.length ? statsCell : "", quoteCell.length ? quoteCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "quotecase", cells });
    carousel.replaceWith(block);
  }

  // tools/importer/parsers/hp-pathfinder.js
  function emText(document, text) {
    const p = document.createElement("p");
    const em = document.createElement("em");
    em.textContent = text;
    p.append(em);
    return p;
  }
  function parse3(element, { document }) {
    const section = element.matches(".wn-section") ? element : element.querySelector(".wn-section");
    if (!section) return;
    const titleEl = section.querySelector(":scope > p.wn-title");
    const left = section.querySelector(".wn-card-left");
    const right = section.querySelector(".wn-card-right");
    const rows = [];
    if (titleEl && titleEl.textContent.trim()) {
      const h2 = document.createElement("h2");
      h2.textContent = titleEl.textContent.replace(/\s+/g, " ").trim();
      rows.push([h2]);
    }
    const primary = [];
    if (left) {
      const sub = left.querySelector(".wn-subtitle");
      if (sub && sub.textContent.trim()) primary.push(emText(document, sub.textContent.trim()));
      const innerTitle = left.querySelector(".wn-card-left-content .wn-title") || left.querySelector(".wn-title");
      if (innerTitle && innerTitle.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = innerTitle.textContent.replace(/\s+/g, " ").trim();
        primary.push(h3);
      }
      const desc = left.querySelector(".wn-description");
      if (desc && desc.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        primary.push(p);
      }
      const cta = left.querySelector("a.wn-button");
      if (cta) {
        const a = document.createElement("a");
        a.href = (cta.getAttribute("href") || "").trim();
        a.textContent = (cta.textContent || "").replace(/\s+/g, " ").trim();
        primary.push(a);
      }
    }
    const secondary = [];
    if (right) {
      const sub = right.querySelector(".wn-subtitle");
      if (sub && sub.textContent.trim()) secondary.push(emText(document, sub.textContent.trim()));
      right.querySelectorAll(".wn-link a[href]").forEach((linkEl) => {
        const a = document.createElement("a");
        a.href = (linkEl.getAttribute("href") || "").trim();
        const label = (linkEl.childNodes[0] && linkEl.childNodes[0].textContent ? linkEl.childNodes[0].textContent : linkEl.textContent).replace(/\s+/g, " ").trim();
        a.textContent = label;
        const p = document.createElement("p");
        p.append(a);
        secondary.push(p);
      });
    }
    rows.push([primary.length ? primary : "", secondary.length ? secondary : ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "pathfinder", cells: rows });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hp-logowall.js
  function parse4(element, { document }) {
    const root = element.matches(".p13n-partner-carousel") ? element : element.querySelector(".p13n-partner-carousel");
    if (!root) return;
    const introNodes = [];
    const heading = root.querySelector("h2");
    if (heading && heading.textContent.trim()) {
      const h2 = document.createElement("h2");
      h2.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      introNodes.push(h2);
    }
    const sub = heading && heading.parentElement ? heading.parentElement.querySelector("span") : null;
    if (sub && sub.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = sub.textContent.replace(/\s+/g, " ").trim();
      introNodes.push(p);
    }
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    root.querySelectorAll(".animate-partner-carousel a[href] img").forEach((img) => {
      const alt = (img.getAttribute("alt") || "").replace(/\s*logo$/i, "").trim();
      const key = alt.toLowerCase() || (img.getAttribute("src") || "");
      if (!key || seen.has(key)) return;
      seen.add(key);
      const anchor = img.closest("a");
      const a = document.createElement("a");
      a.href = anchor ? anchor.getAttribute("href") || "#" : "#";
      const newImg = document.createElement("img");
      newImg.src = img.getAttribute("src");
      newImg.alt = alt;
      a.append(newImg);
      cells.push([a]);
    });
    if (cells.length === 0) return;
    const block = WebImporter.Blocks.createBlock(document, {
      name: "logowall (marquee)",
      cells
    });
    if (introNodes.length) {
      const wrap = document.createElement("div");
      introNodes.forEach((n) => wrap.append(n));
      root.parentNode.insertBefore(wrap, root);
    }
    root.replaceWith(block);
  }

  // tools/importer/parsers/hp-deploy-cards.js
  function parse5(element, { document }) {
    const wrapper = element.matches(".webxp-471-wrapper") ? element : element.querySelector(".webxp-471-wrapper");
    if (!wrapper) return;
    const introNodes = [];
    const left = wrapper.querySelector(".webxp-471-left-wrapper");
    if (left) {
      const h2 = left.querySelector("h2");
      if (h2 && h2.textContent.trim()) {
        const el = document.createElement("h2");
        el.textContent = h2.textContent.replace(/\s+/g, " ").trim();
        introNodes.push(el);
      }
      const desc = left.querySelector("p");
      if (desc && desc.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        introNodes.push(p);
      }
      const docLink = left.querySelector("a[href]");
      if (docLink) {
        const a = document.createElement("a");
        a.href = (docLink.getAttribute("href") || "").trim();
        a.textContent = (docLink.textContent || "").replace(/\s+/g, " ").trim();
        const p = document.createElement("p");
        p.append(a);
        introNodes.push(p);
      }
    }
    const cells = [];
    wrapper.querySelectorAll(".webxp-471-card").forEach((card) => {
      const img = card.querySelector("img.webxp-471-img") || card.querySelector("img");
      const title = card.querySelector(".webxp-471-card-title");
      const desc = card.querySelector(".webxp-471-card-description");
      const cta = card.querySelector("a[href]");
      const body = [];
      if (title && title.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = title.textContent.replace(/\s+/g, " ").trim();
        body.push(h3);
      }
      if (desc && desc.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        body.push(p);
      }
      if (cta) {
        const a = document.createElement("a");
        a.href = (cta.getAttribute("href") || "").trim();
        a.textContent = (cta.textContent || "").replace(/\s+/g, " ").trim();
        body.push(a);
      }
      if (img) {
        const newImg = document.createElement("img");
        newImg.src = img.getAttribute("src");
        newImg.alt = img.getAttribute("alt") || (title ? title.textContent.trim() : "") || "";
        cells.push([newImg, body]);
      } else {
        cells.push([body]);
      }
    });
    if (cells.length === 0) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
    if (introNodes.length) {
      const wrap = document.createElement("div");
      introNodes.forEach((n) => wrap.append(n));
      wrapper.parentNode.insertBefore(wrap, wrapper);
    }
    wrapper.replaceWith(block);
  }

  // tools/importer/parsers/hp-usecase-tabs.js
  function panelContent(document, panel) {
    const out = [];
    const h3 = panel.querySelector("h3");
    if (h3 && h3.textContent.trim()) {
      const el = document.createElement("h3");
      el.textContent = h3.textContent.replace(/\s+/g, " ").trim();
      out.push(el);
    }
    const p = panel.querySelector("p");
    if (p && p.textContent.trim()) {
      const el = document.createElement("p");
      el.textContent = p.textContent.replace(/\s+/g, " ").trim();
      out.push(el);
    }
    panel.querySelectorAll("a[href]").forEach((a) => {
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;
      const link = document.createElement("a");
      link.href = (a.getAttribute("href") || "").trim();
      link.textContent = text;
      const wrap = document.createElement("p");
      wrap.append(link);
      out.push(wrap);
    });
    return out;
  }
  function parse6(element, { document }) {
    if (document.body.dataset.hpUsecaseTabsParsed === "true") {
      element.remove();
      return;
    }
    const triggers = Array.from(document.querySelectorAll('[id^="radix-:r0:-trigger-"]'));
    if (triggers.length === 0) return;
    document.body.dataset.hpUsecaseTabsParsed = "true";
    const tablist = triggers[0].parentElement;
    const introNodes = [];
    let scope = tablist;
    for (let i = 0; i < 8 && scope && scope.parentElement; i += 1) {
      scope = scope.parentElement;
      const h2 = scope.querySelector("h2");
      if (h2 && /mongodb atlas/i.test(h2.textContent || "")) {
        const el = document.createElement("h2");
        el.textContent = h2.textContent.replace(/\s+/g, " ").trim();
        introNodes.push(el);
        const sub = h2.parentElement && h2.parentElement.querySelector("span");
        if (sub && sub.textContent.trim()) {
          const p = document.createElement("p");
          p.textContent = sub.textContent.replace(/\s+/g, " ").trim();
          introNodes.push(p);
        }
        break;
      }
    }
    const cells = [];
    const panels = [];
    triggers.forEach((trigger) => {
      const id = trigger.getAttribute("id") || "";
      const label = (trigger.textContent || "").replace(/\s+/g, " ").trim();
      const suffix = id.replace("-trigger-", "-content-");
      const panel = document.getElementById(suffix);
      if (panel) panels.push(panel);
      const content = panel ? panelContent(document, panel) : [];
      cells.push([label, content.length ? content : ""]);
    });
    if (cells.length === 0) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs", cells });
    const lca = (a, b) => {
      const ancestors = /* @__PURE__ */ new Set();
      let n = a;
      while (n) {
        ancestors.add(n);
        n = n.parentElement;
      }
      n = b;
      while (n && !ancestors.has(n)) n = n.parentElement;
      return n;
    };
    const region = panels.length ? lca(triggers[0], panels[0]) : tablist;
    if (!region || region === document.body) return;
    if (introNodes.length) {
      const wrap = document.createElement("div");
      introNodes.forEach((n) => wrap.append(n));
      region.parentNode.insertBefore(wrap, region);
    }
    region.parentNode.insertBefore(block, region);
    region.remove();
  }

  // tools/importer/parsers/hp-skills-cards.js
  function parse7(element, { document }) {
    const grid = element.parentElement;
    if (!grid) return;
    const cardSections = Array.from(grid.children).filter(
      (c) => c.matches("section") && c.querySelector("h3")
    );
    if (cardSections.length < 2) return;
    if (element !== cardSections[0]) {
      element.remove();
      return;
    }
    const introNodes = [];
    let scope = grid;
    for (let i = 0; i < 6 && scope && scope.parentElement; i += 1) {
      scope = scope.parentElement;
      const h2 = scope.querySelector("h2");
      if (h2 && /level up/i.test(h2.textContent || "")) {
        const el = document.createElement("h2");
        el.textContent = h2.textContent.replace(/\s+/g, " ").trim();
        introNodes.push(el);
        const sub = h2.parentElement && h2.parentElement.querySelector("span");
        if (sub && sub.textContent.trim()) {
          const p = document.createElement("p");
          p.textContent = sub.textContent.replace(/\s+/g, " ").trim();
          introNodes.push(p);
        }
        break;
      }
    }
    const cells = [];
    cardSections.forEach((card) => {
      const title = card.querySelector("h3");
      const desc = card.querySelector("p");
      const cta = card.querySelector("a[href]");
      const body = [];
      if (title && title.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = title.textContent.replace(/\s+/g, " ").trim();
        body.push(h3);
      }
      if (desc && desc.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        body.push(p);
      }
      if (cta) {
        const a = document.createElement("a");
        a.href = (cta.getAttribute("href") || "").trim();
        a.textContent = (cta.textContent || "").replace(/\s+/g, " ").trim();
        body.push(a);
      }
      cells.push([body]);
    });
    cardSections.slice(1).forEach((c) => c.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
    if (introNodes.length) {
      const wrap = document.createElement("div");
      introNodes.forEach((n) => wrap.append(n));
      element.parentNode.insertBefore(wrap, element);
    }
    element.replaceWith(block);
  }

  // tools/importer/transformers/homepage-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var TRACKING_HOSTS = [
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
    "googleadservices.com",
    "adnxs.com",
    "bat.bing.com",
    "trkn.us",
    "mathtag.com",
    "adsrvr.org",
    "cookielaw.org",
    "intercomcdn.com",
    "downloads.intercomcdn.com"
  ];
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#p13n-hp-chat-root",
        // @lg-chat LeafyGreen AI assistant (SDK chrome)
        ".p13n-hp-role-toggle-container",
        // Builder/Business-Leader persona toggle
        ".p13n-promo-banner",
        // "New: MongoDB 8.3" launch banner
        ".p13n-spotlight",
        // spotlight bg video + rive canvas
        ".hero-bg",
        // decorative hero gradient image
        ".p13n-trust-logos"
        // small hero trust-logo strip (decorative)
      ]);
      WebImporter.DOMUtils.remove(element, [".bnr__inner"]);
      WebImporter.DOMUtils.remove(element, [
        ".ddp-experiment-wrapper",
        ".ddp-tabs-wrapper",
        ".ddp-tabs-selector",
        ".ddp-top-description",
        ".ddp-mobile-link",
        '[class*="ddp-tab"]'
      ]);
      const trustedLabel = Array.from(element.querySelectorAll("span")).find(
        (s) => /^trusted by$/i.test((s.textContent || "").trim())
      );
      if (trustedLabel) {
        let rail = trustedLabel;
        for (let i = 0; i < 4 && rail.parentElement; i += 1) {
          rail = rail.parentElement;
          if (rail.querySelectorAll("img").length >= 3) break;
        }
        rail.remove();
      }
      const dupHeading = Array.from(element.querySelectorAll("h2")).find(
        (h) => /your ai data platform is ready/i.test((h.textContent || "").trim()) && !h.closest(".wn-section")
      );
      if (dupHeading) {
        let node = dupHeading;
        let target = dupHeading;
        for (let i = 0; i < 8 && node.parentElement; i += 1) {
          node = node.parentElement;
          const text = node.textContent || "";
          if (/start here/i.test(text) && !node.querySelector('[id^="radix-:r0:-trigger-"]')) {
            target = node;
          } else if (node.querySelector('[id^="radix-:r0:-trigger-"]')) {
            break;
          }
        }
        target.remove();
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#universal-nav",
        "#nav",
        "#sub-nav",
        "#addsearch",
        "nav",
        "footer",
        '[role="contentinfo"]'
      ]);
      const promoBanner = element.querySelector("div.relative.z-\\[9999\\].w-full");
      if (promoBanner) promoBanner.remove();
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#ot-sdk-container",
        '[id*="onetrust"]',
        '[class*="onetrust"]',
        '[class*="ot-sdk"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "iframe",
        "noscript",
        "link",
        "source",
        "canvas",
        "video",
        "next-route-announcer"
      ]);
      element.querySelectorAll("a[href], img[src], [data-src]").forEach((node) => {
        const url = node.getAttribute("href") || node.getAttribute("src") || node.getAttribute("data-src") || "";
        if (TRACKING_HOSTS.some((h) => url.includes(h)) || /[[\]]/.test(url)) {
          node.remove();
        }
      });
      const BLOCK_NAMES = /* @__PURE__ */ new Set(["hero", "quotecase", "pathfinder", "logowall", "cards", "tabs"]);
      const byLabel = /* @__PURE__ */ new Map();
      element.querySelectorAll("table").forEach((table) => {
        const firstCell = table.querySelector("th, td");
        if (!firstCell) return;
        const nameText = (firstCell.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
        const baseName = nameText.split("(")[0].trim();
        if (!BLOCK_NAMES.has(baseName)) return;
        const text = (table.textContent || "").replace(/\s+/g, " ").trim();
        const key = `${baseName}::${text.slice(0, 80)}`;
        const existing = byLabel.get(key);
        if (!existing) {
          byLabel.set(key, table);
        } else if (text.length > (existing.textContent || "").replace(/\s+/g, " ").trim().length) {
          existing.remove();
          byLabel.set(key, table);
        } else {
          table.remove();
        }
      });
    }
  }

  // tools/importer/transformers/homepage-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function topLevelOf(node, main) {
    let cur = node;
    while (cur && cur.parentElement && cur.parentElement !== main) {
      cur = cur.parentElement;
    }
    return cur && cur.parentElement === main ? cur : null;
  }
  function isDark(blockName) {
    return blockName !== "logowall";
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const main = element;
    const doc = main.ownerDocument;
    const BLOCK_NAMES = /* @__PURE__ */ new Set(["hero", "quotecase", "pathfinder", "logowall", "cards", "tabs"]);
    const blocks = [];
    main.querySelectorAll("table").forEach((table) => {
      const firstCell = table.querySelector("th, td");
      if (!firstCell) return;
      const name = (firstCell.textContent || "").replace(/\s+/g, " ").trim().toLowerCase().split("(")[0].trim();
      if (!BLOCK_NAMES.has(name)) return;
      blocks.push({ name, table });
    });
    if (blocks.length === 0) return;
    for (let i = blocks.length - 1; i >= 1; i -= 1) {
      const { table } = blocks[i];
      const prevTable = blocks[i - 1].table;
      let subtree = table;
      let p = subtree.parentElement;
      while (p && p !== main && !p.contains(prevTable)) {
        subtree = p;
        p = p.parentElement;
      }
      if (!subtree || subtree === main || subtree.contains(prevTable)) {
        const top = topLevelOf(table, main);
        if (top && top.previousElementSibling) {
          main.insertBefore(doc.createElement("hr"), top);
        }
        continue;
      }
      const container = topLevelOf(subtree, main);
      const newSection = doc.createElement("div");
      newSection.appendChild(subtree);
      const ref = container ? container.nextSibling : null;
      if (ref) main.insertBefore(newSection, ref);
      else main.appendChild(newSection);
      main.insertBefore(doc.createElement("hr"), newSection);
    }
    blocks.forEach(({ name, table }) => {
      if (!isDark(name)) return;
      const top = topLevelOf(table, main);
      if (!top) return;
      const meta = WebImporter.Blocks.createBlock(doc, {
        name: "Section Metadata",
        cells: { style: "dark" }
      });
      top.appendChild(meta);
    });
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hp-hero": parse,
    "hp-quotecase": parse2,
    "hp-pathfinder": parse3,
    "hp-logowall": parse4,
    "hp-deploy-cards": parse5,
    "hp-usecase-tabs": parse6,
    "hp-skills-cards": parse7
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: 'MongoDB homepage: hero (One data platform), customer-stories quotecase, two pathfinder panels, partner logowall, "Deploy Your Way" cards, "Level Up" skills cards, and an 8-tab Atlas use-case tabs block. All sections dark except the partner logowall. AI assistant + nav/footer/banner are chrome (stripped).',
    urls: [
      "https://www.mongodb.com/"
    ],
    // Specific landmark/container parsers first; the generic skills-cards
    // (section:has(h3)) runs last so it only matches the leftover Level-Up grid.
    blocks: [
      { name: "hp-hero", instances: [".p13n-hp-hero"] },
      { name: "hp-quotecase", instances: [".p13n-use-case-carousel"] },
      { name: "hp-pathfinder", instances: [".p13n-pathfinder-new-bl", ".p13n-pathfinder"] },
      { name: "hp-logowall", instances: [".p13n-partner-carousel"] },
      { name: "hp-deploy-cards", instances: [".webxp-471-wrapper"] },
      { name: "hp-usecase-tabs", instances: ['[id^="radix-:r0:-trigger-"]'] },
      { name: "hp-skills-cards", instances: ["section:has(h3)"] }
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
  var import_homepage_default = {
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
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
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
  return __toCommonJS(import_homepage_exports);
})();
