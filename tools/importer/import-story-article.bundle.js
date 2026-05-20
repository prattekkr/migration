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

  // tools/importer/import-story-article.js
  var import_story_article_exports = {};
  __export(import_story_article_exports, {
    default: () => import_story_article_default
  });

  // tools/importer/parsers/hero-container.js
  function parse(element, { document }) {
    const variantClasses = [];
    ["height-default", "height-short", "height-tall", "height-xx-tall", "overlay-height-short", "overlay-height-default", "overlay-height-tall", "overlay-height-xx-tall"].forEach((v) => {
      if (element.classList.contains(v)) variantClasses.push(v);
    });
    const blockName = variantClasses.length > 0 ? `hero-container (${variantClasses.join(", ")})` : "hero-container";
    const bgImage = element.querySelector("img.cmp-container__bg-image") || element.querySelector(".cmp-container img") || element.querySelector("img");
    const imageCell = document.createElement("div");
    if (bgImage) {
      const src = bgImage.getAttribute("data-cmp-src") || bgImage.getAttribute("src") || "";
      const alt = bgImage.getAttribute("alt") || "";
      if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
        const pic = document.createElement("picture");
        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", alt);
        img.setAttribute("loading", "lazy");
        pic.appendChild(img);
        imageCell.appendChild(pic);
      }
    }
    const cells = [[imageCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cta.js
  function parse2(element, { document }) {
    var _a, _b, _c;
    const anchor = element.querySelector("a.cmp-button") || element.querySelector("a");
    const linkText = ((_b = (_a = element.querySelector(".cmp-button__text")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_c = anchor == null ? void 0 : anchor.textContent) == null ? void 0 : _c.trim()) || "";
    let href = (anchor == null ? void 0 : anchor.getAttribute("href")) || "";
    if (href.startsWith("/")) href = "https://www.abbvie.com" + href;
    const target = (anchor == null ? void 0 : anchor.getAttribute("target")) || "_self";
    const variantClasses = element.classList.contains("back-cta") ? ["default-cta", "back-cta"] : ["default-cta"];
    const blockName = `cta (${variantClasses.join(", ")})`;
    const linkCell = document.createElement("div");
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = linkText;
      linkCell.appendChild(a);
    }
    const cells = [[linkCell], [""], [target], ["none"], ["chevron"], [""], ["before"], ["false"], [""], ["none"], [""]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/story-card.js
  function parse3(element, { document }) {
    const categoryLink = element.querySelector("a[href]");
    let pageHref = (categoryLink == null ? void 0 : categoryLink.getAttribute("href")) || "";
    if (pageHref.startsWith("/")) pageHref = "https://www.abbvie.com" + pageHref;
    const linkCell = document.createElement("div");
    if (pageHref) {
      const a = document.createElement("a");
      a.href = pageHref;
      a.textContent = pageHref;
      linkCell.appendChild(a);
    }
    const cells = [["storyCardInfo"], ["false"], ["false"], ["true"], ["true"], ["true"], [""], [""], [linkCell], ["false"], [""], [""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "story-card", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/custom-title.js
  function parse4(element, { document }) {
    var _a, _b;
    const heading = element.querySelector("h1,h2,h3,h4,h5,h6") || element.querySelector(".cmp-title__text");
    const headingText = ((_a = heading == null ? void 0 : heading.textContent) == null ? void 0 : _a.trim()) || "";
    const headingTag = ((_b = heading == null ? void 0 : heading.tagName) == null ? void 0 : _b.toLowerCase()) || "h5";
    const variants = [];
    if (element.classList.contains("light-theme") || element.closest(".light-theme")) variants.push("h1-size");
    else if (element.classList.contains("h5-size") || element.classList.contains("medium-weight")) variants.push("h5-size", "width-large");
    const blockName = variants.length > 0 ? `custom-title (${variants.join(", ")})` : "custom-title";
    const titleCell = document.createElement("div");
    const h = document.createElement(headingTag);
    h.id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    h.textContent = headingText;
    titleCell.appendChild(h);
    const cells = [[titleCell], ["id:"], ["lang:none"], [""]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/text-container.js
  function parse5(element, { document }) {
    const isInHero = !!(element.closest(".cmp-container-full-width") || element.closest(".container.height-default") || element.classList.contains("light-theme") && element.classList.contains("cmp-text-xx-large"));
    const variantClasses = [];
    if (element.classList.contains("cmp-text-xx-large")) {
      if (isInHero) variantClasses.push("body-unica-32-reg");
      else variantClasses.push("spacing-bottom", "width-large");
    } else if (element.classList.contains("cmp-text-x-large")) {
      variantClasses.push("spacing-bottom", "width-large", "body-unica-20-reg");
    } else {
      variantClasses.push("spacing-bottom", "width-large");
    }
    const blockName = variantClasses.length > 0 ? `text-container (${variantClasses.join(", ")})` : "text-container";
    const cmpText = element.querySelector(".cmp-text") || element;
    const contentCell = document.createElement("div");
    const children = cmpText.children;
    if (children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child.textContent.trim() && !child.querySelector("img, a")) continue;
        contentCell.appendChild(child.cloneNode(true));
      }
    }
    if (contentCell.childNodes.length === 0 && cmpText.textContent.trim()) contentCell.textContent = cmpText.textContent.trim();
    const cells = [[isInHero ? "id:" : ""], ["none"], [""], [contentCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/separator.js
  function parse6(element, { document }) {
    const hasHr = !!element.querySelector("hr, .cmp-separator__horizontal-rule");
    const variants = [];
    const cls = element.className || "";
    if (cls.includes("separator-height-24")) variants.push("separator-height-24");
    else if (cls.includes("separator-height-48")) variants.push("separator-height-48");
    else if (cls.includes("separator-height-80")) variants.push("separator-height-80");
    const blockName = variants.length > 0 ? `separator (${variants.join(", ")})` : "separator";
    const cells = [[hasHr ? "true" : "false"], [""], ["none"], [""]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse7(element, { document }) {
    const slides = element.querySelectorAll('.carousel-item, .cmp-carousel__item, .splide__slide, [role="tabpanel"]');
    const uniqueSlides = /* @__PURE__ */ new Set();
    slides.forEach((s) => uniqueSlides.add(s));
    const totalSlides = uniqueSlides.size || 0;
    const variantClasses = [];
    if (element.classList.contains("carousel-show-btn-margin")) variantClasses.push("carousel-show-btn-margin");
    if (element.classList.contains("carousel-minimal")) variantClasses.push("carousel-minimal");
    const blockName = variantClasses.length > 0 ? `carousel (${variantClasses.join(", ")})` : "carousel";
    const cells = [[String(totalSlides)], ["static"], [""], [""], ["false"], ["3000"], ["false"], ["1"], ["false"], ["1"], ["false"], ["false"], ["true"], ["true"], [""], [""], [""], [""], [""], [""], ["false"], [""], ["none"], [""]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    const fragment = document.createDocumentFragment();
    fragment.appendChild(block);
    uniqueSlides.forEach((slide) => {
      const img = slide.querySelector("img");
      if (!img) return;
      const cmpImage = slide.querySelector(".cmp-image, [data-cmp-src]");
      let imgSrc = img.getAttribute("data-cmp-src") || img.getAttribute("data-src") || cmpImage && cmpImage.getAttribute("data-cmp-src") || img.getAttribute("src") || "";
      if (!imgSrc || imgSrc.startsWith("blob:") || imgSrc.startsWith("data:")) return;
      const imageCell = document.createElement("div");
      const pic = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.setAttribute("src", imgSrc);
      imgEl.setAttribute("alt", img.getAttribute("alt") || "");
      imgEl.setAttribute("loading", "lazy");
      pic.appendChild(imgEl);
      imageCell.appendChild(pic);
      const imageCells = [[imageCell], ["false"], ["false"], [""], ["false"], ["false"], ["false"], [""], ["_self"], [""], ["false"], [""], [""], [""], ["none"], [""]];
      fragment.appendChild(WebImporter.Blocks.createBlock(document, { name: "custom-image", cells: imageCells }));
    });
    element.replaceWith(fragment);
  }

  // tools/importer/parsers/custom-image.js
  function parse8(element, { document }) {
    const img = element.querySelector("img");
    let imgSrc = "", imgAlt = "";
    if (img) {
      imgSrc = img.getAttribute("data-cmp-src") || img.getAttribute("src") || "";
      imgAlt = img.getAttribute("alt") || "";
    }
    const imageCell = document.createElement("div");
    if (imgSrc && !imgSrc.startsWith("blob:") && !imgSrc.startsWith("data:")) {
      const pic = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.setAttribute("src", imgSrc);
      imgEl.setAttribute("alt", imgAlt);
      imgEl.setAttribute("loading", "lazy");
      pic.appendChild(imgEl);
      imageCell.appendChild(pic);
    }
    const cells = [[imageCell], ["false"], ["false"], [""], ["false"], ["false"], ["false"], [""], ["_self"], [""], ["false"], [""], [""], [""], ["none"], [""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "custom-image", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse9(element, { document }) {
    var _a, _b, _c, _d;
    const variantClasses = ["accordion-icon-font"];
    if (element.classList.contains("cmp-accordion-xx-large") || element.classList.contains("h5-size")) variantClasses.push("h5-size", "width-large");
    const blockName = `accordion (${variantClasses.join(", ")})`;
    const title = ((_b = (_a = element.querySelector('.cmp-accordion__title, [class*="accordion__title"]')) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "References";
    const expandBtn = element.querySelector('.cmp-accordion__expand-all, [class*="expand-all"]');
    const collapseBtn = element.querySelector('.cmp-accordion__collapse-all, [class*="collapse-all"]');
    const cells = [[title], [((_c = expandBtn == null ? void 0 : expandBtn.textContent) == null ? void 0 : _c.trim()) || "Expand All"], [((_d = collapseBtn == null ? void 0 : collapseBtn.textContent) == null ? void 0 : _d.trim()) || "Collapse All"], ["plus"], ["minus"], ["plus"], ["minus"], [""], [""], [""], [""], [""], [""], [""], ["none"], [""]];
    const items = element.querySelectorAll(".cmp-accordion__item");
    items.forEach((item) => {
      var _a2;
      const headingEl = item.querySelector(".cmp-accordion__header button, .cmp-accordion__button");
      const panelEl = item.querySelector(".cmp-accordion__panel");
      const headingText = ((_a2 = headingEl == null ? void 0 : headingEl.textContent) == null ? void 0 : _a2.trim()) || "";
      const bodyCell = document.createElement("div");
      if (panelEl) {
        const pc = panelEl.querySelectorAll("p, div, ul, ol");
        if (pc.length > 0) pc.forEach((c) => {
          if (c.textContent.trim()) bodyCell.appendChild(c.cloneNode(true));
        });
        else if (panelEl.textContent.trim()) {
          const p = document.createElement("p");
          p.textContent = panelEl.textContent.trim();
          bodyCell.appendChild(p);
        }
      }
      const itemCell = document.createElement("div");
      itemCell.appendChild(document.createTextNode(headingText));
      const br = document.createElement("br");
      itemCell.appendChild(br);
      itemCell.appendChild(bodyCell);
      const typeCell = document.createElement("div");
      typeCell.textContent = "accordion-item";
      cells.push([itemCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/abbvie-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const { document } = payload;
    ["#onetrust-consent-sdk", ".experiencefragment", ".cmp-experiencefragment--header", ".cmp-experiencefragment--footer", "header.nav-bar", ".button.back-to-top", "link[href]", "noscript", "script", "style", ".sticky-nav"].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }

  // tools/importer/transformers/abbvie-sections.js
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const { document } = payload;
    const main = document.body;
    const heroMeta = WebImporter.Blocks.createBlock(document, { name: "section-metadata (content-wide, medium-radius)", cells: [["language", "none"]] });
    const gridContainerMeta = WebImporter.Blocks.createBlock(document, { name: "section-metadata (grid-container, content-regular)", cells: [["language", "none"]] });
    const leftSpacerMeta = WebImporter.Blocks.createBlock(document, { name: "section-metadata (grid-cols-2)", cells: [["", ""]] });
    const mainContentMeta = WebImporter.Blocks.createBlock(document, { name: "section-metadata (grid-section, grid-cols-8)", cells: [["", ""]] });
    const rightSpacerMeta = WebImporter.Blocks.createBlock(document, { name: "section-metadata (grid-cols-2)", cells: [["", ""]] });
    const overlapContainer = main.querySelector(".container.overlap-predecessor");
    const gridEl = main.querySelector(".grid");
    if (overlapContainer) {
      let lastHeroEl = overlapContainer;
      while (lastHeroEl.nextElementSibling && lastHeroEl.nextElementSibling !== gridEl) lastHeroEl = lastHeroEl.nextElementSibling;
      lastHeroEl.after(heroMeta);
      heroMeta.after(document.createElement("hr"));
    }
    if (gridEl) {
      gridEl.before(gridContainerMeta);
      gridContainerMeta.after(document.createElement("hr"));
      const mainCol = main.querySelector(".grid-row__col-with-8");
      if (mainCol) {
        mainCol.before(leftSpacerMeta);
        leftSpacerMeta.after(document.createElement("hr"));
        mainCol.appendChild(mainContentMeta);
        mainCol.after(document.createElement("hr"));
        mainCol.after(rightSpacerMeta);
      }
    }
  }

  // tools/importer/import-story-article.js
  var parsers = { "hero-container": parse, "cta": parse2, "story-card": parse3, "custom-title": parse4, "text-container": parse5, "separator": parse6, "carousel": parse7, "custom-image": parse8, "accordion": parse9 };
  var transformers = [transform, transform2];
  var PAGE_TEMPLATE = { name: "story-article", blocks: [{ name: "hero-container", instances: [".container.cmp-container-full-width.height-default"] }, { name: "cta", instances: [".button.back-cta"] }, { name: "story-card", instances: [".storyinfo"] }, { name: "custom-title", instances: [".title.cmp-title-xx-large"] }, { name: "text-container", instances: [".text.cmp-text-xx-large", ".text.cmp-text-x-large"] }, { name: "separator", instances: [".separator.separator-height-24", ".separator.separator-height-48", ".separator.separator-height-80"] }, { name: "carousel", instances: [".carousel.panelcontainer.carousel-minimal"] }, { name: "custom-image", instances: [".image .cmp-image"] }, { name: "accordion", instances: [".accordion.panelcontainer"] }] };
  function executeTransformers(hookName, element, payload) {
    transformers.forEach((fn) => {
      try {
        fn.call(null, hookName, element, __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE }));
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        elements.forEach((el) => pageBlocks.push({ name: blockDef.name, selector, element: el }));
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_story_article_default = { transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;
    executeTransformers("beforeTransform", main, payload);
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });
    executeTransformers("afterTransform", main, payload);
    const hr = document.createElement("hr");
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const path = WebImporter.FileUtils.sanitizePath(new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, ""));
    return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) } }];
  } };
  return __toCommonJS(import_story_article_exports);
})();
