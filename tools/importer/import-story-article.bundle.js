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
    const bgImage = element.querySelector("img.cmp-container__bg-image") || element.querySelector('img[class*="bg-image"]') || element.querySelector(".cmp-container > img");
    const imageCell = document.createElement("div");
    if (bgImage) {
      const pic = document.createElement("picture");
      const img = document.createElement("img");
      img.src = bgImage.getAttribute("src") || bgImage.getAttribute("data-cmp-src") || "";
      img.alt = bgImage.getAttribute("alt") || "";
      pic.appendChild(img);
      imageCell.appendChild(pic);
    }
    const empty = () => document.createElement("div");
    const variants = [];
    const cls = element.className || "";
    if (cls.includes("height-short")) variants.push("height-short");
    else if (cls.includes("height-default")) variants.push("height-default");
    else if (cls.includes("height-tall")) variants.push("height-tall");
    if (cls.includes("overlay-height-short")) variants.push("overlay-height-short");
    else if (cls.includes("overlay-height-default")) variants.push("overlay-height-default");
    if (cls.includes("semi-transparent-layer")) variants.push("navy");
    const cells = [
      [imageCell, empty(), empty(), empty(), empty(), empty()]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-container", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cta.js
  function parse2(element, { document }) {
    var _a, _b, _c;
    const linkEl = element.querySelector("a.cmp-button") || element.querySelector('a[class*="cmp-button"]') || element.querySelector("a");
    const linkText = ((_b = (_a = element.querySelector(".cmp-button__text")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || ((_c = linkEl == null ? void 0 : linkEl.textContent) == null ? void 0 : _c.trim()) || "";
    const href = (linkEl == null ? void 0 : linkEl.getAttribute("href")) || "";
    const target = (linkEl == null ? void 0 : linkEl.getAttribute("target")) || "_self";
    const linkCell = document.createElement("div");
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = linkText;
      linkCell.appendChild(a);
    }
    const val = (v) => {
      const d = document.createElement("div");
      if (v) d.textContent = v;
      return d;
    };
    const cells = [
      [linkCell],
      // Row 0: link
      [val("")],
      // Row 1: aria-label
      [val(target)],
      // Row 2: ctaTarget
      [val("none")],
      // Row 3: iconVariation
      [val("chevron")],
      // Row 4: iconFont
      [val("")],
      // Row 5: iconImage
      [val("before")],
      // Row 6: iconPosition
      [val("false")],
      // Row 7: ariaHidden
      [val("")],
      // Row 8: blockId
      [val("none")],
      // Row 9: language
      [val("")]
      // Row 10: classes group
    ];
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cta",
      variants: ["default-cta", "back-cta"],
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/story-card.js
  function parse3(element, { document }) {
    const cls = element.className || "";
    const isStoryInfo = cls.includes("storyinfo");
    const val = (v) => {
      const d = document.createElement("div");
      if (v !== void 0 && v !== null && v !== "") d.textContent = String(v);
      return d;
    };
    const linkCell = (href) => {
      const d = document.createElement("div");
      if (href) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = href;
        d.appendChild(a);
      }
      return d;
    };
    const categoryLink = element.querySelector("a[href]");
    const pageHref = (categoryLink == null ? void 0 : categoryLink.getAttribute("href")) || "";
    const cells = isStoryInfo ? [
      [val("storyCardInfo")],
      [val("false")],
      [val("false")],
      [val("true")],
      [val("true")],
      [val("true")],
      [val("")],
      [val("")],
      [linkCell(pageHref)],
      [val("false")],
      [val("")],
      [val("")]
    ] : [
      [val("sidePanel")],
      [val("false")],
      [val("false")],
      [val("false")],
      [val("false")],
      [val("false")],
      [val("")],
      [val("")],
      [linkCell(pageHref)],
      [val("false")],
      [val("")],
      [val("")]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "story-card", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/custom-title.js
  function parse4(element, { document }) {
    var _a, _b;
    const heading = element.querySelector("h1, h2, h3, h4, h5, h6");
    const headingText = ((_a = heading == null ? void 0 : heading.textContent) == null ? void 0 : _a.trim()) || "";
    const headingTag = ((_b = heading == null ? void 0 : heading.tagName) == null ? void 0 : _b.toLowerCase()) || "h5";
    const isHero = headingTag === "h1";
    const titleCell = document.createElement("div");
    const h = document.createElement(headingTag);
    h.textContent = headingText;
    if (heading == null ? void 0 : heading.id) h.id = heading.id;
    titleCell.appendChild(h);
    const val = (v) => {
      const d = document.createElement("div");
      if (v) d.textContent = v;
      return d;
    };
    const cells = [
      [titleCell],
      [val(isHero ? "id:" : "")],
      [val(isHero ? "lang:none" : "none")],
      [val("")]
    ];
    const variants = [];
    const cls = element.className || "";
    if (cls.includes("h1-size")) variants.push("h1-size");
    else if (cls.includes("h3-size")) variants.push("h3-size");
    else if (cls.includes("h5-size")) variants.push("h5-size");
    if (cls.includes("width-large")) variants.push("width-large");
    if (cls.includes("medium-weight")) variants.push("medium-weight");
    if (cls.includes("light-theme")) variants.push("light-theme");
    const block = WebImporter.Blocks.createBlock(document, { name: "custom-title", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/text-container.js
  var heroSubtitleDone = false;
  function parse5(element, { document }) {
    const cmpText = element.querySelector(".cmp-text") || element;
    const textCell = document.createElement("div");
    for (let i = 0; i < cmpText.children.length; i++) {
      const child = cmpText.children[i];
      if (child.tagName === "DIV" && !child.textContent.trim()) continue;
      textCell.appendChild(child.cloneNode(true));
    }
    const val = (v) => {
      const d = document.createElement("div");
      if (v) d.textContent = v;
      return d;
    };
    const cells = [
      [val("")],
      // Row 0: splice +1 (extra row consumed)
      [val("")],
      // Row 1: classes group
      [val("")],
      // Row 2: blockId
      [val("none")],
      // Row 3: language
      [textCell]
      // Row 4: child text-container-text content
    ];
    const variants = [];
    const cls = element.className || "";
    if (!heroSubtitleDone && cls.includes("cmp-text-xx-large") && cls.includes("light-theme")) {
      variants.push("body-unica-32-reg");
      heroSubtitleDone = true;
    } else if (cls.includes("cmp-text-x-large")) {
      variants.push("standard", "width-large");
    } else {
      variants.push("spacing-bottom", "width-large");
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "text-container", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/separator.js
  function parse6(element, { document }) {
    const hasHr = !!element.querySelector("hr, .cmp-separator__horizontal-rule");
    const val = (v) => {
      const d = document.createElement("div");
      if (v) d.textContent = v;
      return d;
    };
    const cells = [
      [val(hasHr ? "true" : "false")],
      [val("")],
      [val("none")],
      [val("")]
    ];
    const variants = [];
    const cls = element.className || "";
    const heightMatch = cls.match(/separator-height-(\d+)/);
    if (heightMatch) variants.push("separator-height-" + heightMatch[1]);
    const block = WebImporter.Blocks.createBlock(document, { name: "separator", variants, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel.js
  function parse7(element, { document }) {
    const slides = element.querySelectorAll('[role="tabpanel"], .carousel-item, .splide__slide');
    const slideCount = slides.length || 0;
    const val = (v) => {
      const d = document.createElement("div");
      if (v !== void 0 && v !== null && v !== "") d.textContent = String(v);
      return d;
    };
    const configCells = [
      [val(slideCount)],
      [val("static")],
      [val("")],
      [val("")],
      [val("false")],
      [val("3000")],
      [val("false")],
      [val("1")],
      [val("false")],
      [val("1")],
      [val("false")],
      [val("false")],
      [val("true")],
      [val("true")],
      [val("")],
      [val("")],
      [val("")],
      [val("")],
      [val("")],
      [val("")],
      [val("false")],
      [val("")],
      [val("none")],
      [val("")]
    ];
    const carouselBlock = WebImporter.Blocks.createBlock(document, { name: "carousel", cells: configCells });
    const fragment = document.createDocumentFragment();
    fragment.appendChild(carouselBlock);
    slides.forEach((slide) => {
      const img = slide.querySelector("img");
      if (!img) return;
      const imageCell = document.createElement("div");
      const pic = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.src = img.getAttribute("src") || img.getAttribute("data-cmp-src") || "";
      imgEl.alt = img.getAttribute("alt") || "";
      pic.appendChild(imgEl);
      imageCell.appendChild(pic);
      const imageCells = [
        [imageCell],
        // Row 0: image
        [val("false")],
        // Row 1: getAltFromDAM
        [val("false")],
        // Row 2: imageIsDecorative
        [val("")],
        // Row 3: caption
        [val("false")],
        // Row 4: getCaptionFromDAM
        [val("false")],
        // Row 5: displayCaptionBelowImage
        [val("false")],
        // Row 6: enableLink
        [val("")],
        // Row 7: target
        [val("_self")],
        // Row 8: clickBehavior
        [val("")],
        // Row 9: modalPanelId
        [val("false")],
        // Row 10: enableWarnOnLeave
        [val("")],
        // Row 11: warnOnLeavePath
        [val("")],
        // Row 12: linkAriaLabel
        [val("")],
        // Row 13: classes group
        [val("none")],
        // Row 14: language
        [val("")]
        // Row 15: blockId
      ];
      const imageBlock = WebImporter.Blocks.createBlock(document, { name: "custom-image", cells: imageCells });
      fragment.appendChild(imageBlock);
    });
    element.replaceWith(fragment);
  }

  // tools/importer/parsers/custom-image.js
  function parse8(element, { document }) {
    const img = element.querySelector("img.cmp-image__image") || element.querySelector('img[class*="cmp-image"]') || element.querySelector("img");
    const imageCell = document.createElement("div");
    if (img) {
      const pic = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.src = img.getAttribute("src") || img.getAttribute("data-cmp-src") || "";
      imgEl.alt = img.getAttribute("alt") || "";
      pic.appendChild(imgEl);
      imageCell.appendChild(pic);
    }
    const val = (v) => {
      const d = document.createElement("div");
      if (v) d.textContent = v;
      return d;
    };
    const cells = [
      [imageCell],
      // Row 0: image
      [val("false")],
      // Row 1: getAltFromDAM
      [val("false")],
      // Row 2: imageIsDecorative
      [val("")],
      // Row 3: caption
      [val("false")],
      // Row 4: getCaptionFromDAM
      [val("false")],
      // Row 5: displayCaptionBelowImage
      [val("false")],
      // Row 6: enableLink
      [val("")],
      // Row 7: target
      [val("_self")],
      // Row 8: clickBehavior
      [val("")],
      // Row 9: modalPanelId
      [val("false")],
      // Row 10: enableWarnOnLeave
      [val("")],
      // Row 11: warnOnLeavePath
      [val("")],
      // Row 12: linkAriaLabel
      [val("")],
      // Row 13: classes group
      [val("none")],
      // Row 14: language
      [val("")]
      // Row 15: blockId
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "custom-image", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/abbvie-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
      const dupContainer = element.querySelector("#container-64b2d703f1");
      if (dupContainer) {
        const parentContainer = dupContainer.closest(".container.abbvie-container.cmp-container-large");
        if (parentContainer) {
          parentContainer.remove();
        } else {
          dupContainer.remove();
        }
      }
      const dupCarousel = element.querySelector("#splide02");
      if (dupCarousel) {
        const carouselWrapper = dupCarousel.closest(".carousel.panelcontainer.carousel-minimal");
        if (carouselWrapper && carouselWrapper !== element.querySelector(".carousel.panelcontainer.carousel-minimal")) {
          carouselWrapper.remove();
        } else if (dupCarousel) {
          dupCarousel.remove();
        }
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [".cmp-experiencefragment--header"]);
      WebImporter.DOMUtils.remove(element, [".cmp-experiencefragment--footer"]);
      WebImporter.DOMUtils.remove(element, ["a.skip-link"]);
      WebImporter.DOMUtils.remove(element, [".search-input"]);
      WebImporter.DOMUtils.remove(element, [".button.back-to-top"]);
      WebImporter.DOMUtils.remove(element, [
        "iframe#universal_pixel_qeyyfbt",
        'img[src*="t.co/i/adsct"]',
        'img[src*="analytics.twitter.com"]',
        "iframe:not([id])"
      ]);
      WebImporter.DOMUtils.remove(element, ["#yt-player-initiated"]);
      WebImporter.DOMUtils.remove(element, ["link"]);
      WebImporter.DOMUtils.remove(element, ["noscript", "meta"]);
      WebImporter.DOMUtils.remove(element, [
        ".splide__pagination",
        ".splide__arrows",
        ".carousel-nav"
      ]);
      element.querySelectorAll(":scope div:empty").forEach((div) => {
        if (!div.id && !div.className && !div.children.length && !div.textContent.trim()) {
          div.remove();
        }
      });
    }
  }

  // tools/importer/transformers/abbvie-sections.js
  var HERO_BLOCK_COUNT = 5;
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const document = element.ownerDocument;
    const main = element;
    const allTables = [...main.querySelectorAll("table")];
    if (allTables.length === 0) return;
    const heroTables = allTables.slice(0, HERO_BLOCK_COUNT);
    const bodyTables = allTables.slice(HERO_BLOCK_COUNT);
    if (heroTables.length === 0) return;
    while (main.firstChild) main.removeChild(main.firstChild);
    function sectionMeta(variantClasses, hasLanguageRow) {
      const name = "Section Metadata";
      const cells = hasLanguageRow ? { language: "none" } : {};
      return WebImporter.Blocks.createBlock(document, {
        name,
        variants: variantClasses,
        cells
      });
    }
    heroTables.forEach((t) => main.appendChild(t));
    main.appendChild(sectionMeta(["content-wide", "medium-radius"], true));
    main.appendChild(document.createElement("hr"));
    main.appendChild(sectionMeta(["grid-container", "content-regular"], true));
    main.appendChild(document.createElement("hr"));
    main.appendChild(sectionMeta(["grid-cols-2"], false));
    main.appendChild(document.createElement("hr"));
    bodyTables.forEach((t) => main.appendChild(t));
    main.appendChild(sectionMeta(["grid-section", "grid-cols-8"], true));
    main.appendChild(document.createElement("hr"));
    main.appendChild(sectionMeta(["grid-cols-2"], false));
    console.log(`[sections] Restructured: ${heroTables.length} hero + ${bodyTables.length} body into 5 sections`);
  }

  // tools/importer/import-story-article.js
  var parsers = {
    "hero-container": parse,
    "cta": parse2,
    "story-card": parse3,
    "custom-title": parse4,
    "text-container": parse5,
    "separator": parse6,
    "carousel": parse7,
    "custom-image": parse8
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "story-article",
    description: "Story/feature article page with hero, content body sections, image carousels, and related content card. Part of T04 template group covering 116 pages on abbvie.com.",
    urls: [
      "https://www.abbvie.com/who-we-are/our-stories/can-unlocking-one-million-genomes.html"
    ],
    blocks: [
      {
        name: "hero-container",
        instances: [".container.cmp-container-full-width.height-default.no-bottom-margin"]
      },
      {
        name: "cta",
        instances: [".button.back-cta.light-theme"]
      },
      {
        name: "story-card",
        instances: [".storyinfo", ".cardpagestory.card-dashboard"]
      },
      {
        name: "custom-title",
        instances: [".title.cmp-title-xx-large.light-theme", ".title.cmp-title-xx-large.h5-size"]
      },
      {
        name: "text-container",
        instances: [".text.cmp-text-xx-large.light-theme", ".text.cmp-text-xx-large", ".text.cmp-text-x-large.light-theme.single-column.standard"]
      },
      {
        name: "separator",
        instances: [".separator.separator-height-24"]
      },
      {
        name: "carousel",
        instances: [".carousel.panelcontainer.carousel-minimal"]
      },
      {
        name: "custom-image",
        instances: [".cmp-image"]
      }
    ],
    sections: [
      {
        id: "section-1-hero",
        name: "Hero Section",
        selector: ".container.cmp-container-full-width.height-default.no-bottom-margin",
        style: null,
        blocks: ["hero-container", "cta", "story-card", "custom-title", "text-container"],
        defaultContent: []
      },
      {
        id: "section-2-grid-container",
        name: "Grid Container (article body wrapper)",
        selector: ".container.overlap-predecessor.cmp-container-xx-large",
        style: null,
        blocks: [],
        defaultContent: []
      },
      {
        id: "section-3-left-spacer",
        name: "Left Spacer Column",
        selector: ".grid-row__col-with-2.grid-cell:first-child",
        style: null,
        blocks: [],
        defaultContent: []
      },
      {
        id: "section-4-main-content",
        name: "Article Body - Main Content Column",
        selector: ".grid-row__col-with-8.grid-cell",
        style: null,
        blocks: ["custom-title", "text-container", "separator", "carousel"],
        defaultContent: []
      },
      {
        id: "section-5-sidebar",
        name: "Right Sidebar Column (Related Content)",
        selector: ".grid-row__col-with-2.grid-cell:last-child",
        style: null,
        blocks: ["story-card"],
        defaultContent: []
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_story_article_default = {
    transform: (payload) => {
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
        } else {
          console.warn(`No parser found for block: ${block.name}`);
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
  return __toCommonJS(import_story_article_exports);
})();
