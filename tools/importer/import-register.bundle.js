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

  // tools/importer/import-register.js
  var import_register_exports = {};
  __export(import_register_exports, {
    default: () => import_register_default
  });

  // tools/importer/parsers/register-form.js
  function parse(element, { document }) {
    const form = element.matches("#atlas-form") ? element : element.querySelector("#atlas-form");
    if (!form) return;
    const ssoAnchor = form.querySelector('a[href*="/account/sso/"]');
    let ssoLink = null;
    if (ssoAnchor) {
      ssoLink = document.createElement("a");
      ssoLink.href = ssoAnchor.getAttribute("href");
      ssoLink.textContent = (ssoAnchor.textContent || "").replace(/\s+/g, " ").trim() || "Sign up with Google";
    }
    const jsonLink = document.createElement("a");
    jsonLink.href = "atlas-form.json";
    jsonLink.textContent = "atlas-form.json";
    const block = WebImporter.Blocks.createBlock(document, {
      name: "form",
      cells: [[jsonLink]]
    });
    if (ssoLink) {
      const p = document.createElement("p");
      p.append(ssoLink);
      form.parentNode.insertBefore(p, form);
    }
    form.replaceWith(block);
  }

  // tools/importer/transformers/register-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".exp-ai-wrapper",
        ".exp-input-bar",
        '[class*="exp-ai"]',
        '[class*="exp-input-bar"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".grecaptcha-badge",
        '[class*="grecaptcha"]',
        ".g-recaptcha-response",
        'iframe[src*="recaptcha"]',
        'iframe[src*="optimizely"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#ot-sdk-container",
        '[id*="onetrust"]',
        '[class*="onetrust"]',
        '[class*="ot-sdk"]'
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
        "googleadservices.com",
        "adnxs.com",
        "bat.bing.com",
        "trkn.us",
        "mathtag.com",
        "adsrvr.org",
        "cookielaw.org"
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
        "footer",
        ".exp-footer-wrapper",
        '[class*="exp-footer"]',
        '[role="contentinfo"]'
      ]);
      element.querySelectorAll('img[alt="MongoDB logo"]').forEach((img) => {
        const link = img.closest("a");
        (link || img).remove();
      });
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "iframe",
        "noscript",
        "link",
        "source"
      ]);
    }
  }

  // tools/importer/transformers/register-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const sections = payload && payload.template && payload.template.sections || [];
    const style = sections.length && sections[0].style ? sections[0].style : "dark";
    const doc = element.ownerDocument;
    const metaBlock = WebImporter.Blocks.createBlock(doc, {
      name: "Section Metadata",
      cells: { style }
    });
    element.appendChild(metaBlock);
  }

  // tools/importer/import-register.js
  var parsers = {
    "register-form": parse
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "register",
    description: "Atlas sign-up/login page: dark hero card with heading + subheading, Google SSO button, sign-up form (Forms workflow -> form block), and a sign-in link. Minimal chrome (logo + slim legal footer + AI helper widget all stripped).",
    urls: [
      "https://www.mongodb.com/cloud/atlas/register"
    ],
    blocks: [
      { name: "register-form", instances: ["#atlas-form"] }
    ],
    sections: [
      { section: 1, style: "dark", selector: "h4" }
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
  var import_register_default = {
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
  return __toCommonJS(import_register_exports);
})();
