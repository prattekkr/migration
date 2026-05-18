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
      imageCell.appendChild(document.createComment(" field:image "));
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
    if (cls.includes("semi-transparent-layer")) variants.push("navy");
    const childTypeCell = document.createElement("div");
    childTypeCell.textContent = "hero-container-item";
    const cells = [
      [empty()],
      [childTypeCell, imageCell, empty(), empty(), empty(), empty(), empty()]
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
      const p = document.createElement("p");
      p.appendChild(document.createComment(" field:link "));
      const a = document.createElement("a");
      a.href = href;
      a.textContent = linkText;
      p.appendChild(a);
      linkCell.appendChild(p);
    }
    const hintVal = (fieldName, v) => {
      const d = document.createElement("div");
      if (v) {
        const p = document.createElement("p");
        p.appendChild(document.createComment(" field:" + fieldName + " "));
        p.appendChild(document.createTextNode(v));
        d.appendChild(p);
      }
      return d;
    };
    const empty = () => document.createElement("div");
    const cells = [
      [linkCell],
      // Row 0: link (with hint)
      [empty()],
      // Row 1: aria-label (empty)
      [hintVal("ctaTarget", target)],
      // Row 2: ctaTarget
      [hintVal("iconVariation", "none")],
      // Row 3: iconVariation
      [hintVal("iconFont", "chevron")],
      // Row 4: iconFont
      [empty()],
      // Row 5: iconImage (empty)
      [hintVal("iconPosition", "before")],
      // Row 6: iconPosition
      [hintVal("ariaHidden", "false")],
      // Row 7: ariaHidden
      [empty()],
      // Row 8: classes group (empty)
      [hintVal("blockId", "")],
      // Row 9: blockId (empty value = no hint needed)
      [hintVal("language", "none")]
      // Row 10: language
    ];
    cells[9] = [empty()];
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
    const hintVal = (fieldName, v) => {
      const d = document.createElement("div");
      const p = document.createElement("p");
      p.appendChild(document.createComment(" field:" + fieldName + " "));
      p.appendChild(document.createTextNode(v));
      d.appendChild(p);
      return d;
    };
    const empty = () => document.createElement("div");
    const hintLink = (fieldName, href) => {
      const d = document.createElement("div");
      if (href) {
        const p = document.createElement("p");
        p.appendChild(document.createComment(" field:" + fieldName + " "));
        const a = document.createElement("a");
        a.href = href;
        a.textContent = href;
        p.appendChild(a);
        d.appendChild(p);
      }
      return d;
    };
    const categoryLink = element.querySelector("a[href]");
    const pageHref = (categoryLink == null ? void 0 : categoryLink.getAttribute("href")) || "";
    const cells = isStoryInfo ? [
      [hintVal("storyCardVariant", "storyCardInfo")],
      [hintVal("hidePublicationDate", "false")],
      [hintVal("hideReadTime", "false")],
      [hintVal("hideRole", "true")],
      [hintVal("hideDescription", "true")],
      [hintVal("hideImage", "true")],
      [empty()],
      // id (empty)
      [empty()],
      // customClass (empty)
      [hintLink("page", pageHref)],
      [hintVal("openInNewTab", "false")],
      [empty()],
      // ctaLabel (empty)
      [empty()]
      // analyticsInteractionId (empty)
    ] : [
      [hintVal("storyCardVariant", "sidePanel")],
      [hintVal("hidePublicationDate", "false")],
      [hintVal("hideReadTime", "false")],
      [hintVal("hideRole", "false")],
      [hintVal("hideDescription", "false")],
      [hintVal("hideImage", "false")],
      [empty()],
      [empty()],
      [hintLink("page", pageHref)],
      [hintVal("openInNewTab", "false")],
      [empty()],
      [empty()]
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
    const titleCell = document.createElement("div");
    titleCell.appendChild(document.createComment(" field:title "));
    const h = document.createElement(headingTag);
    h.textContent = headingText;
    if (heading == null ? void 0 : heading.id) h.id = heading.id;
    titleCell.appendChild(h);
    const hintVal = (fieldName, v) => {
      const d = document.createElement("div");
      const p = document.createElement("p");
      p.appendChild(document.createComment(" field:" + fieldName + " "));
      p.appendChild(document.createTextNode(v));
      d.appendChild(p);
      return d;
    };
    const empty = () => document.createElement("div");
    const cells = [
      [titleCell],
      // Row 0: title (with hint)
      [empty()],
      // Row 1: classes group (empty, no hint)
      [hintVal("blockId", "id:")],
      // Row 2: blockId (with hint)
      [hintVal("language", "none")]
      // Row 3: language (with hint)
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
    const textContentCell = document.createElement("div");
    textContentCell.appendChild(document.createComment(" field:text "));
    let firstPara = true;
    const nodes = cmpText.childNodes;
    for (let i = 0; i < nodes.length; i++) {
      const child = nodes[i];
      if (child.nodeType === 3) {
        if (!child.textContent.trim()) continue;
        if (!firstPara) {
          textContentCell.appendChild(document.createElement("br"));
          textContentCell.appendChild(document.createElement("br"));
        }
        textContentCell.appendChild(document.createTextNode(child.textContent));
        firstPara = false;
      } else if (child.nodeType === 1) {
        if (child.tagName === "DIV" && !child.textContent.trim()) continue;
        if (!child.textContent.trim() && !child.querySelector("img, a")) continue;
        if (!firstPara) {
          textContentCell.appendChild(document.createElement("br"));
          textContentCell.appendChild(document.createElement("br"));
        }
        if (child.tagName === "P") {
          for (let j = 0; j < child.childNodes.length; j++) {
            textContentCell.appendChild(child.childNodes[j].cloneNode(true));
          }
        } else if (child.tagName === "UL" || child.tagName === "OL") {
          textContentCell.appendChild(child.cloneNode(true));
        } else {
          for (let j = 0; j < child.childNodes.length; j++) {
            textContentCell.appendChild(child.childNodes[j].cloneNode(true));
          }
        }
        firstPara = false;
      }
    }
    const childTypeCell = document.createElement("div");
    childTypeCell.textContent = "text-container-text";
    const blockIdCell = document.createElement("div");
    blockIdCell.appendChild(document.createComment(" field:blockId "));
    blockIdCell.appendChild(document.createTextNode("id:"));
    const languageCell = document.createElement("div");
    languageCell.appendChild(document.createComment(" field:language "));
    languageCell.appendChild(document.createTextNode("none"));
    const emptyCell = () => document.createElement("div");
    const cells = [
      [emptyCell()],
      // Row 0: classes group (empty, no hint)
      [blockIdCell],
      // Row 1: blockId (with hint)
      [languageCell],
      // Row 2: language (with hint)
      [childTypeCell, textContentCell]
      // Row 3: child item (2 cols)
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
    const hintVal = (fieldName, v) => {
      const d = document.createElement("div");
      const p = document.createElement("p");
      p.appendChild(document.createComment(" field:" + fieldName + " "));
      p.appendChild(document.createTextNode(v));
      d.appendChild(p);
      return d;
    };
    const empty = () => document.createElement("div");
    const cells = [
      [hintVal("showLine", hasHr ? "true" : "false")],
      // Row 0: showLine
      [empty()],
      // Row 1: classes group
      [empty()],
      // Row 2: blockId (empty)
      [hintVal("language", "none")]
      // Row 3: language
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
    const hintVal = (fieldName, v) => {
      const d = document.createElement("div");
      if (v !== void 0 && v !== null && v !== "") {
        const p = document.createElement("p");
        p.appendChild(document.createComment(" field:" + fieldName + " "));
        p.appendChild(document.createTextNode(String(v)));
        d.appendChild(p);
      }
      return d;
    };
    const empty = () => document.createElement("div");
    const cells = [
      [hintVal("totalSlides", slideCount)],
      [hintVal("carouselType", "static")],
      [empty()],
      // rssFeedUrl
      [empty()],
      // numberOfItems
      [hintVal("autoplay", "false")],
      [hintVal("slideTransitionTime", "3000")],
      [hintVal("pauseOnHover", "false")],
      [hintVal("numberOfSlidesToShow", "1")],
      [hintVal("bypassCarouselOnMobile", "false")],
      [hintVal("startingSlideIndex", "1")],
      [hintVal("centerActiveSlide", "false")],
      [hintVal("enableLooping", "false")],
      [hintVal("enableNextPreviousControls", "true")],
      [hintVal("enableDotNavigation", "true")],
      [empty()],
      // carouselLabel
      [empty()],
      // previousButtonLabel
      [empty()],
      // nextButtonLabel
      [empty()],
      // playButtonLabel
      [empty()],
      // pauseButtonLabel
      [empty()],
      // tablistLabel
      [hintVal("itemLabel", "false")],
      [empty()],
      // classes group
      [empty()],
      // blockId
      [hintVal("language", "none")]
    ];
    const carouselBlock = WebImporter.Blocks.createBlock(document, { name: "carousel", cells });
    const fragment = document.createDocumentFragment();
    fragment.appendChild(carouselBlock);
    slides.forEach((slide) => {
      const img = slide.querySelector("img");
      if (!img) return;
      let imgSrc = img.getAttribute("data-cmp-src") || img.getAttribute("src") || "";
      if (imgSrc.startsWith("blob:") || imgSrc.startsWith("data:")) return;
      if (!imgSrc) return;
      const imageCell = document.createElement("div");
      imageCell.appendChild(document.createComment(" field:image "));
      const pic = document.createElement("picture");
      const imgEl = document.createElement("img");
      imgEl.src = imgSrc;
      imgEl.alt = img.getAttribute("alt") || "";
      pic.appendChild(imgEl);
      imageCell.appendChild(pic);
      const imageCells = [
        [imageCell],
        [hintVal("getAltFromDAM", "false")],
        [hintVal("imageIsDecorative", "false")],
        [empty()],
        // caption
        [hintVal("getCaptionFromDAM", "false")],
        [hintVal("displayCaptionBelowImage", "false")],
        [hintVal("enableLink", "false")],
        [empty()],
        // target
        [hintVal("clickBehavior", "_self")],
        [empty()],
        // modalPanelId
        [hintVal("enableWarnOnLeave", "false")],
        [empty()],
        // warnOnLeavePath
        [empty()],
        // linkAriaLabel
        [empty()],
        // classes group
        [empty()],
        // blockId
        [hintVal("language", "none")]
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

  // tools/importer/parsers/quote.js
  function parse9(element, { document }) {
    var _a, _b, _c, _d, _e, _f;
    const quoteText = ((_b = (_a = element.querySelector(".cmp-quote__text")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "";
    const authorName = ((_d = (_c = element.querySelector(".author-name")) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim()) || "";
    const authorRole = ((_f = (_e = element.querySelector(".author-title")) == null ? void 0 : _e.textContent) == null ? void 0 : _f.trim()) || "";
    const val = (v) => {
      const d = document.createElement("div");
      if (v) d.textContent = v;
      return d;
    };
    const quotationCell = document.createElement("div");
    if (quoteText) {
      const p = document.createElement("p");
      p.textContent = quoteText;
      quotationCell.appendChild(p);
    }
    const cells = [
      [val("basic")],
      // quoteVariant
      [quotationCell],
      // quotation (richtext)
      [val(authorName)],
      // attributionName
      [val(authorRole)],
      // attributionRole
      [val("")],
      // attributionImage
      [val("")],
      // quoteFragment
      [val("")],
      // backgroundImage
      [val("")],
      // classes group
      [val("")],
      // blockId
      [val("none")],
      // language
      [val("")]
      // commonCustomClass/analytics
    ];
    const variants = [];
    const cls = element.className || "";
    if (cls.includes("quote-standard")) variants.push("quote-standard");
    if (cls.includes("quote-h4")) variants.push("quote-h4");
    const block = WebImporter.Blocks.createBlock(document, { name: "quote", variants, cells });
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
    function sectionMeta(keyValuePairs) {
      const cells = {};
      keyValuePairs.forEach(([key, value]) => {
        cells[key] = value;
      });
      return WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells
      });
    }
    heroTables.forEach((t) => main.appendChild(t));
    main.appendChild(sectionMeta([
      ["classes_customClass", "content-wide medium-radius"]
    ]));
    main.appendChild(document.createElement("hr"));
    main.appendChild(sectionMeta([
      ["classes_container", "grid-container"],
      ["blockModelId", "grid-container"]
    ]));
    main.appendChild(document.createElement("hr"));
    main.appendChild(sectionMeta([
      ["classes_gridCols", "grid-cols-2"],
      ["blockModelId", "grid-section"]
    ]));
    main.appendChild(document.createElement("hr"));
    bodyTables.forEach((t) => main.appendChild(t));
    main.appendChild(sectionMeta([
      ["classes_gridCols", "grid-cols-8"],
      ["blockModelId", "grid-section"]
    ]));
    main.appendChild(document.createElement("hr"));
    main.appendChild(sectionMeta([
      ["classes_gridCols", "grid-cols-2"],
      ["blockModelId", "grid-section"]
    ]));
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
    "custom-image": parse8,
    "quote": parse9
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
        instances: [
          ".container.cmp-container-full-width.height-default.no-bottom-margin",
          ".container.cmp-container-full-width.height-tall.no-bottom-margin",
          ".container.cmp-container-full-width.height-short.no-bottom-margin",
          ".container.cmp-container-full-width.no-bottom-margin:not(.overlap-predecessor):not(.footer-overlap)"
        ]
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
        instances: [".title.cmp-title-xx-large.light-theme", ".title.cmp-title-xx-large.h5-size", ".title.cmp-title-xx-large"]
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
      },
      {
        name: "quote",
        instances: [".quote.cmp-quote-xx-large", ".cmp-quote"]
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
