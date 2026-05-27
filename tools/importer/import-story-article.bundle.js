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
  function getMimeType(url) {
    const u = (url || "").toLowerCase().split("?")[0];
    if (u.endsWith(".png")) return "image/png";
    if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
    if (u.endsWith(".webp")) return "image/webp";
    if (u.endsWith(".avif")) return "image/avif";
    if (u.endsWith(".gif")) return "image/gif";
    if (u.endsWith(".svg")) return "image/svg+xml";
    if (url.includes("fmt=webp")) return "image/webp";
    if (url.includes("fmt=png")) return "image/png";
    if (url.includes("fmt=jpg") || url.includes("fmt=jpeg")) return "image/jpeg";
    if (url.includes("scene7.com")) return "image/jpeg";
    return "image/jpeg";
  }
  function parse(element, { document }) {
    const variantClasses = [];
    ["height-default", "height-short", "height-tall", "height-xx-tall", "overlay-height-short", "overlay-height-default", "overlay-height-tall", "overlay-height-xx-tall"].forEach((v) => {
      if (element.classList.contains(v)) variantClasses.push(v);
    });
    if (!variantClasses.some((v) => v.startsWith("height-") && !v.startsWith("height-xx"))) variantClasses.unshift("height-default");
    if (!variantClasses.some((v) => v.startsWith("overlay-height"))) variantClasses.push("overlay-height-short");
    const blockName = variantClasses.length > 0 ? `hero-container (${variantClasses.join(", ")})` : "hero-container";
    const bgImage = element.querySelector("img.cmp-container__bg-image") || element.querySelector(".cmp-container img") || element.querySelector("img");
    const imageCell = document.createElement("div");
    if (bgImage) {
      const src = bgImage.getAttribute("data-cmp-src") || bgImage.getAttribute("src") || "";
      const alt = bgImage.getAttribute("alt") || "";
      if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
        const pic = document.createElement("picture");
        const mimeType2 = getMimeType(src);
        const source = document.createElement("source");
        source.setAttribute("type", mimeType2);
        source.setAttribute("srcset", src);
        pic.appendChild(source);
        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", alt);
        img.setAttribute("loading", "lazy");
        pic.appendChild(img);
        imageCell.appendChild(pic);
      }
    }
    const empty = () => document.createElement("div");
    const mimeType = getMimeType((bgImage == null ? void 0 : bgImage.getAttribute("data-cmp-src")) || (bgImage == null ? void 0 : bgImage.getAttribute("src")) || "");
    const mimeCell = document.createElement("div");
    mimeCell.textContent = mimeType;
    const altCell = document.createElement("div");
    altCell.textContent = (bgImage == null ? void 0 : bgImage.getAttribute("alt")) || "";
    const cells = [
      [empty()],
      [imageCell, mimeCell, altCell, empty(), empty(), empty(), empty(), empty()]
    ];
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
    const cls = element.className || "";
    const isStoryInfo = cls.includes("storyinfo");
    const anchor = element.querySelector("a[href]");
    let pageHref = (anchor == null ? void 0 : anchor.getAttribute("href")) || "";
    if (isStoryInfo) {
      if (pageHref.startsWith("/")) pageHref = "https://www.abbvie.com" + pageHref;
      const linkCell = document.createElement("div");
      if (pageHref) {
        const a = document.createElement("a");
        a.href = pageHref;
        a.textContent = pageHref;
        linkCell.appendChild(a);
      }
      const cells = [
        ["storyCardInfo"],
        // Row 0: storyCardVariant
        ["false"],
        // Row 1: hidePublicationDate
        ["false"],
        // Row 2: hideReadTime
        ["true"],
        // Row 3: hideRole
        ["true"],
        // Row 4: hideDescription
        ["true"],
        // Row 5: hideImage
        [""],
        // Row 6: id
        [""],
        // Row 7: customClass
        [linkCell],
        // Row 8: page
        ["false"],
        // Row 9: openInNewTab
        [""],
        // Row 10: ctaLabel
        [""]
        // Row 11: analyticsInteractionId
      ];
      const block = WebImporter.Blocks.createBlock(document, { name: "story-card", cells });
      element.replaceWith(block);
    } else {
      if (pageHref.endsWith(".html")) pageHref = pageHref.replace(/\.html$/, "");
      if (pageHref.startsWith("/")) pageHref = "/content/abbvie-nextgen-eds/abbvie-com/us/en" + pageHref;
      const linkCell = document.createElement("div");
      if (pageHref) {
        const a = document.createElement("a");
        a.href = pageHref;
        a.textContent = pageHref;
        linkCell.appendChild(a);
      }
      const cells = [
        ["relatedContent"],
        // Row 0: storyCardVariant
        ["false"],
        // Row 1: hidePublicationDate
        ["false"],
        // Row 2: hideReadTime
        ["false"],
        // Row 3: hideRole
        ["false"],
        // Row 4: hideDescription
        ["false"],
        // Row 5: hideImage
        [""],
        // Row 6: id
        [""],
        // Row 7: customClass
        [linkCell],
        // Row 8: page
        ["true"],
        // Row 9: openInNewTab
        [""],
        // Row 10: ctaLabel
        [""]
        // Row 11: analyticsInteractionId
      ];
      const block = WebImporter.Blocks.createBlock(document, { name: "story-card", cells });
      block.setAttribute("data-related-content", "true");
      element.replaceWith(block);
    }
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
  var heroSubtitleFound = false;
  function parse5(element, { document }) {
    let isInHero = false;
    if (!heroSubtitleFound && element.classList.contains("light-theme") && element.classList.contains("cmp-text-xx-large")) {
      isInHero = true;
      heroSubtitleFound = true;
    }
    const variantClasses = [];
    if (element.classList.contains("cmp-text-xx-large")) {
      if (isInHero) variantClasses.push("body-unica-32-reg");
      else variantClasses.push("spacing-bottom", "width-large");
    } else if (element.classList.contains("cmp-text-x-large")) {
      variantClasses.push("spacing-bottom", "width-large", "body-unica-20-reg");
    } else {
      variantClasses.push("spacing-bottom", "width-large");
    }
    if (element.classList.contains("section-padding")) variantClasses.push("section-padding");
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
    const childTypeCell = document.createElement("div");
    childTypeCell.textContent = "text-container-text";
    const cells = [[""], [""], ["none"], [""], [childTypeCell, contentCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/separator.js
  function parse6(element, { document }) {
    const hasHr = !!element.querySelector("hr, .cmp-separator__horizontal-rule");
    const variants = [];
    const cls = element.className || "";
    if (cls.includes("separator-height-24")) variants.push("separator-height-24");
    else if (cls.includes("separator-height-32")) variants.push("separator-height-32");
    else if (cls.includes("separator-height-48")) variants.push("separator-height-48");
    else if (cls.includes("separator-height-64")) variants.push("separator-height-64");
    else if (cls.includes("separator-height-80")) variants.push("separator-height-80");
    else if (cls.includes("separator-height-112")) variants.push("separator-height-112");
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
    const variantClasses = ["carousel-show-btn-margin"];
    if (element.classList.contains("carousel-minimal")) variantClasses.push("carousel-minimal");
    const blockName = `carousel (${variantClasses.join(", ")})`;
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
  function getMimeType2(url) {
    const u = (url || "").toLowerCase().split("?")[0];
    if (u.endsWith(".png")) return "image/png";
    if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
    if (u.endsWith(".webp")) return "image/webp";
    if (u.endsWith(".avif")) return "image/avif";
    if (u.endsWith(".gif")) return "image/gif";
    if (u.endsWith(".svg")) return "image/svg+xml";
    if (url.includes("fmt=webp")) return "image/webp";
    if (url.includes("fmt=png")) return "image/png";
    if (url.includes("fmt=jpg") || url.includes("fmt=jpeg")) return "image/jpeg";
    if (url.includes("scene7.com")) return "image/jpeg";
    return "image/jpeg";
  }
  function parse8(element, { document }) {
    const img = element.querySelector("img");
    const cmpDiv = element.querySelector("[data-cmp-src]");
    const cmpIs = element.querySelector('[data-cmp-is="image"]');
    let imgSrc = "", imgAlt = "";
    if (img) {
      imgSrc = img.getAttribute("data-cmp-src") || img.getAttribute("src") || "";
      imgAlt = img.getAttribute("alt") || "";
    }
    if (!imgSrc && cmpDiv) {
      imgSrc = cmpDiv.getAttribute("data-cmp-src") || "";
      imgAlt = cmpDiv.getAttribute("data-alt") || "";
    }
    if (!imgSrc && cmpIs) {
      imgSrc = cmpIs.getAttribute("data-cmp-src") || "";
    }
    const imageCell = document.createElement("div");
    if (imgSrc && !imgSrc.startsWith("blob:") && !imgSrc.startsWith("data:")) {
      const pic = document.createElement("picture");
      const mimeType = getMimeType2(imgSrc);
      const source = document.createElement("source");
      source.setAttribute("type", mimeType);
      source.setAttribute("srcset", imgSrc);
      pic.appendChild(source);
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
    const blockName = "accordion (accordion-icon-font, h5-size, width-large)";
    const title = ((_b = (_a = element.querySelector('.cmp-accordion__title, [class*="accordion__title"]')) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || "References";
    const expandBtn = element.querySelector('.cmp-accordion__expand-all, [class*="expand-all"]');
    const collapseBtn = element.querySelector('.cmp-accordion__collapse-all, [class*="collapse-all"]');
    const cells = [[title], [((_c = expandBtn == null ? void 0 : expandBtn.textContent) == null ? void 0 : _c.trim()) || "Expand All"], [((_d = collapseBtn == null ? void 0 : collapseBtn.textContent) == null ? void 0 : _d.trim()) || "Collapse All"], ["plus"], ["minus"], ["plus"], ["minus"], [""], [""], [""], [""], [""], [""], [""], ["none"], [""]];
    const items = element.querySelectorAll(".cmp-accordion__item");
    items.forEach((item) => {
      var _a2;
      const headingEl = item.querySelector(".cmp-accordion__button span, .cmp-accordion__header button, .cmp-accordion__button");
      const headingText = ((_a2 = headingEl == null ? void 0 : headingEl.textContent) == null ? void 0 : _a2.trim()) || "";
      const panelEl = item.querySelector(".cmp-accordion__panel");
      const bodyCell = document.createElement("div");
      if (panelEl) {
        const cmpText = panelEl.querySelector(".cmp-text");
        if (cmpText) {
          Array.from(cmpText.children).forEach((child) => {
            if (child.textContent.trim()) bodyCell.appendChild(child.cloneNode(true));
          });
        } else {
          const directPs = panelEl.querySelectorAll(":scope > p, :scope > .cmp-text > p");
          if (directPs.length > 0) {
            directPs.forEach((p) => {
              if (p.textContent.trim()) bodyCell.appendChild(p.cloneNode(true));
            });
          } else if (panelEl.textContent.trim()) {
            const p = document.createElement("p");
            p.textContent = panelEl.textContent.trim();
            bodyCell.appendChild(p);
          }
        }
      }
      cells.push([headingText, bodyCell, "accordion-item", "", ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote.js
  function parse10(element, { document }) {
    var _a, _b, _c, _d, _e;
    const blockName = "quote (quote-standard, quote-h4)";
    const quoteTextEl = element.querySelector(".cmp-quote__text");
    const quoteText = ((_a = quoteTextEl == null ? void 0 : quoteTextEl.textContent) == null ? void 0 : _a.trim()) || "";
    const quotationCell = document.createElement("div");
    if (quoteText) {
      const strong = document.createElement("strong");
      strong.textContent = quoteText;
      quotationCell.appendChild(strong);
    }
    const authorName = ((_c = (_b = element.querySelector(".author-name, .cmp-quote__author-name")) == null ? void 0 : _b.textContent) == null ? void 0 : _c.trim()) || "";
    const authorRole = ((_e = (_d = element.querySelector(".author-title, .cmp-quote__author-role, .cmp-quote__author-title")) == null ? void 0 : _d.textContent) == null ? void 0 : _e.trim()) || "";
    const authorImg = element.querySelector(".cmp-quote__author-block img, .author-img");
    const authorImageCell = document.createElement("div");
    if (authorImg) {
      const src = authorImg.getAttribute("data-cmp-src") || authorImg.getAttribute("src") || "";
      if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
        const pic = document.createElement("picture");
        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", authorImg.getAttribute("alt") || "");
        img.setAttribute("loading", "lazy");
        pic.appendChild(img);
        authorImageCell.appendChild(pic);
      }
    }
    const cells = [["basic"], [quotationCell], [authorName], [authorRole], [authorImageCell], [""], [""], [""], [""], [""], ["none"], [""]];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/brightcove-video.js
  function parse11(element, { document }) {
    var _a, _b;
    const variantClasses = [];
    const blockName = variantClasses.length > 0 ? `brightcove-video (${variantClasses.join(", ")})` : "brightcove-video";
    const videoEl = element.querySelector("[data-video-id]") || element.querySelector("video-js");
    const videoId = (videoEl == null ? void 0 : videoEl.getAttribute("data-video-id")) || "";
    const accountId = (videoEl == null ? void 0 : videoEl.getAttribute("data-account")) || "2157889328001";
    const playerId = (videoEl == null ? void 0 : videoEl.getAttribute("data-player")) || "default";
    const overlayHeading = element.querySelector('.cmp-video__text-content [role="heading"]') || element.querySelector(".cmp-video__title");
    const overlayTitle = ((_a = overlayHeading == null ? void 0 : overlayHeading.textContent) == null ? void 0 : _a.trim()) || "";
    const overlayBtn = element.querySelector(".cmp-video__text-content button span") || element.querySelector(".cmp-video__text-content button");
    const overlayButtonText = ((_b = overlayBtn == null ? void 0 : overlayBtn.textContent) == null ? void 0 : _b.trim()) || "Watch Video";
    const posterImg = element.querySelector(".cmp-video__image img, .video-poster img");
    const posterCell = document.createElement("div");
    if (posterImg) {
      const src = posterImg.getAttribute("data-cmp-src") || posterImg.getAttribute("src") || "";
      const alt = posterImg.getAttribute("alt") || "";
      if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
        const pic = document.createElement("picture");
        const img = document.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", alt);
        img.setAttribute("loading", "lazy");
        pic.appendChild(img);
        posterCell.appendChild(pic);
      }
    }
    const row0 = document.createElement("div");
    if (overlayTitle) {
      const h = document.createElement("h2");
      h.textContent = overlayTitle;
      row0.appendChild(h);
    }
    const row3 = document.createElement("div");
    const p = document.createElement("p");
    p.textContent = overlayButtonText;
    row3.appendChild(p);
    const cells = [
      [row0],
      // Row 0: projectNumber + overlayTitle(collapsed as h2)
      [""],
      // Row 1: overlayDescription
      [posterCell],
      // Row 2: posterImage + posterAlt(collapsed as img alt)
      [row3],
      // Row 3: colorOverlay + overlayButtonText(collapsed as p)
      ["play"],
      // Row 4: overlayButtonFontIcon
      [""],
      // Row 5: overlayButtonImageIcon
      ["left"],
      // Row 6: iconPosition
      [accountId],
      // Row 7: accountId
      [playerId],
      // Row 8: playerId
      [videoId],
      // Row 9: videoId
      [""],
      // Row 10: playlistId
      [""],
      // Row 11: defaultPlaylistVideoId
      ["none"],
      // Row 12: videoContentLayout
      ["false"],
      // Row 13: enablePlaylistThumbnailMetadata
      [""],
      // Row 14: captionDescription
      [""],
      // Row 15: playButtonAriaLabel
      [""],
      // Row 16: videoCaption
      ["false"],
      // Row 17: enableAutoplay
      ["false"],
      // Row 18: enableLoop
      ["false"],
      // Row 19: enableCaptions
      ["false"],
      // Row 20: enableVideoChapters
      ["false"],
      // Row 21: enableRecommendedVideo
      ["true"],
      // Row 22: enablePlayerControls
      ["false"],
      // Row 23: enableSocialShare
      ["false"],
      // Row 24: enableTranscript
      ["transcript"],
      // Row 25: showTranscriptLabel
      ["transcript"],
      // Row 26: hideTranscriptLabel
      ["new-tab"],
      // Row 27: transcriptClickBehavior
      [""],
      // Row 28: modalHiddenPanelId
      [""],
      // Row 29: transcriptLink
      ["play"],
      // Row 30: transcriptShowFontIcon
      [""],
      // Row 31: transcriptShowImageIcon
      ["play"],
      // Row 32: transcriptHideFontIcon
      [""],
      // Row 33: transcriptHideImageIcon
      ["after"],
      // Row 34: transcriptLinkIconPosition
      [""],
      // Row 35: classes_customDynamicClass
      [""],
      // Row 36: blockId
      [""],
      // Row 37: classes_commonCustomClass
      ["none"],
      // Row 38: language
      [""]
      // Row 39: analytics_id
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/abbvie-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName !== "beforeTransform") return;
    const { document } = payload;
    [
      "#onetrust-consent-sdk",
      ".experiencefragment",
      ".cmp-experiencefragment--header",
      ".cmp-experiencefragment--footer",
      "header.nav-bar",
      ".button.back-to-top",
      "link[href]",
      "noscript",
      "script",
      "style",
      ".sticky-nav",
      // Related content / dashboard cards area (renders as junk text)
      ".dashboardcards",
      '[class*="dashboardcards"]',
      // Warn-on-leave / disclaimer popup
      '[class*="warnonleave"]',
      '[class*="warn-on"]',
      ".popup-container",
      "[data-popup-type]",
      // Tracking pixels and ad iframes
      "iframe",
      'img[src*="adsrvr"]',
      'img[src*="twitter.com"]',
      'img[src*="t.co"]',
      'img[src*="bing.com"]',
      'a[href*="adsrvr"]',
      'a[href*="insight.adsrvr"]',
      // Popup close button and related content header
      ".popup-close",
      ".standard-header-with-divider"
    ].forEach((sel) => {
      try {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      } catch (e) {
      }
    });
    const warnContainers = document.querySelectorAll('[class*="warnonthirdparty"], [class*="warn-on-legal"]');
    warnContainers.forEach((el) => el.remove());
    document.querySelectorAll(".container.cmp-container-medium.height-short").forEach((el) => el.remove());
    const overlapContainers = document.querySelectorAll(".container.overlap-predecessor");
    overlapContainers.forEach((overlap) => {
      const unwrap = (el) => {
        const containers = el.querySelectorAll(":scope > .cmp-container, :scope > .container");
        containers.forEach((c) => unwrap(c));
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          el.remove();
        }
      };
      unwrap(overlap);
    });
    document.querySelectorAll("[data-cmp-src]").forEach((el) => {
      if (!el.querySelector("img")) {
        const img = document.createElement("img");
        img.setAttribute("src", el.getAttribute("data-cmp-src"));
        img.setAttribute("alt", el.getAttribute("data-alt") || el.getAttribute("alt") || "");
        img.setAttribute("loading", "lazy");
        el.appendChild(img);
      }
    });
    const relatedCards = document.querySelectorAll(".cardpagestory");
    if (relatedCards.length > 0) {
      const container = document.createElement("div");
      container.id = "related-content-cards";
      relatedCards.forEach((card) => container.appendChild(card));
      document.body.appendChild(container);
    }
  }

  // tools/importer/transformers/abbvie-sections.js
  function transform2(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const { document } = payload;
    const main = document.body;
    main.querySelectorAll("h5").forEach((h) => {
      const text = h.textContent.trim().toLowerCase();
      if (text === "related content" || text === "related contents") h.remove();
    });
    main.querySelectorAll("p").forEach((p) => {
      const text = p.textContent.trim();
      if (text === "Related content" || text === "CLOSE" || text === "No, I disagree" || text === "Yes, I agree") p.remove();
    });
    function getBlockName(el) {
      if (!el || !el.querySelector) return "";
      const th = el.querySelector("th");
      return th ? th.textContent.trim().toLowerCase().replace(/\s+/g, "-") : "";
    }
    function isHeroBlock(el) {
      const name = getBlockName(el);
      if (name === "hero-container") return true;
      if (name.startsWith("cta")) return true;
      if (name === "story-card") {
        const firstTd = el.querySelector("td");
        return firstTd && firstTd.textContent.trim() === "storyCardInfo";
      }
      if (name.startsWith("custom-title") && name.includes("h1")) return true;
      if (name.startsWith("text-container") && name.includes("body-unica-32-reg")) return true;
      return false;
    }
    const allElements = Array.from(main.querySelectorAll(":scope > *, :scope > * > table, :scope > * table"));
    const allTables = Array.from(main.querySelectorAll("table"));
    const relatedCards = [];
    const heroContent = [];
    const bodyContent = [];
    const relatedContainer = main.querySelector("#related-content-cards");
    if (relatedContainer) {
      Array.from(relatedContainer.children).forEach((el) => relatedCards.push(el));
      relatedContainer.remove();
    }
    const mainCol = main.querySelector(".grid-row__col-with-8");
    const allChildren = Array.from(main.children);
    let bodyElements = mainCol ? Array.from(mainCol.children) : [];
    let foundHero = null, foundCta = null, foundStoryCard = null, foundTitle = null, foundSubtitle = null;
    allTables.forEach((table) => {
      const name = getBlockName(table);
      if (!foundHero && name.startsWith("hero-container")) {
        foundHero = table;
        return;
      }
      if (!foundCta && name.startsWith("cta")) {
        foundCta = table;
        return;
      }
      if (!foundStoryCard && name === "story-card") {
        const firstTd = table.querySelector("td");
        if (firstTd && firstTd.textContent.trim() === "storyCardInfo") {
          foundStoryCard = table;
          return;
        }
      }
      if (!foundTitle && name.startsWith("custom-title") && name.includes("h1")) {
        foundTitle = table;
        return;
      }
      if (!foundSubtitle && name.startsWith("text-container") && name.includes("body-unica-32-reg")) {
        foundSubtitle = table;
        return;
      }
    });
    if (foundHero) heroContent.push(foundHero);
    if (foundCta) heroContent.push(foundCta);
    if (foundStoryCard) heroContent.push(foundStoryCard);
    if (foundTitle) heroContent.push(foundTitle);
    if (foundSubtitle) heroContent.push(foundSubtitle);
    const heroSet = new Set(heroContent);
    if (mainCol) {
      Array.from(mainCol.children).forEach((el) => {
        if (!heroSet.has(el)) bodyContent.push(el);
      });
    }
    while (main.firstChild) main.removeChild(main.firstChild);
    heroContent.forEach((el) => main.appendChild(el));
    main.appendChild(WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: [
        ["classes_customClass", "content-wide medium-radius"],
        ["language", "none"]
      ]
    }));
    main.appendChild(document.createElement("hr"));
    main.appendChild(WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: [
        ["name", "Grid Container"],
        ["identifier", "Grid Container"],
        ["classes_container", "grid-container"],
        ["classes_customDynamicClass", "content-regular"],
        ["blockModelId", "grid-container"],
        ["language", "none"]
      ]
    }));
    main.appendChild(document.createElement("hr"));
    main.appendChild(WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: [
        ["name", "Grid Section"],
        ["identifier", "Grid Section"],
        ["classes_container", "grid-section"],
        ["classes_customDynamicClass", "grid-cols-2"],
        ["blockModelId", "grid-section"],
        ["language", "none"]
      ]
    }));
    main.appendChild(document.createElement("hr"));
    bodyContent.forEach((el) => main.appendChild(el));
    main.appendChild(WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: [
        ["name", "Grid Section"],
        ["identifier", "Grid Section"],
        ["classes_container", "grid-section"],
        ["classes_customDynamicClass", "grid-cols-8"],
        ["blockModelId", "grid-section"],
        ["language", "none"]
      ]
    }));
    main.appendChild(document.createElement("hr"));
    if (relatedCards.length > 0) {
      main.appendChild(relatedCards[0]);
    }
    main.appendChild(WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: [
        ["name", "Grid Section"],
        ["identifier", "Grid Section"],
        ["classes_container", "grid-section"],
        ["classes_customDynamicClass", "grid-cols-2"],
        ["blockModelId", "grid-section"],
        ["language", "none"]
      ]
    }));
    if (relatedCards.length > 1) {
      main.appendChild(document.createElement("hr"));
      main.appendChild(WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: [
          ["name", "Grid Container"],
          ["identifier", "Grid Container"],
          ["classes_container", "grid-container"],
          ["classes_customDynamicClass", "bg-f4f4f4 regular-padding no-top-padding no-bottom-margin"],
          ["blockModelId", "grid-container"],
          ["language", "none"]
        ]
      }));
      for (let i = 1; i < relatedCards.length; i++) {
        main.appendChild(document.createElement("hr"));
        main.appendChild(relatedCards[i]);
        main.appendChild(WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: [
            ["name", "Grid Section"],
            ["identifier", "Grid Section"],
            ["classes_container", "grid-section"],
            ["classes_customDynamicClass", "grid-cols-6"],
            ["blockModelId", "grid-section"],
            ["language", "none"]
          ]
        }));
      }
    }
  }

  // tools/importer/import-story-article.js
  var parsers = { "hero-container": parse, "cta": parse2, "story-card": parse3, "custom-title": parse4, "text-container": parse5, "separator": parse6, "carousel": parse7, "custom-image": parse8, "accordion": parse9, "quote": parse10, "brightcove-video": parse11 };
  var transformers = [transform, transform2];
  var PAGE_TEMPLATE = { name: "story-article", blocks: [{ name: "hero-container", instances: [".container.cmp-container-full-width.height-default", ".container.cmp-container-full-width.no-bottom-margin"] }, { name: "cta", instances: [".button.back-cta"] }, { name: "story-card", instances: [".storyinfo", ".cardpagestory"] }, { name: "accordion", instances: [".accordion.panelcontainer"] }, { name: "custom-image", instances: [".image:not(.cmp-video__image)", 'div.image[class="image"]:not(.cmp-video__image)'] }, { name: "custom-title", instances: [".title.cmp-title-xx-large"] }, { name: "text-container", instances: [".text.cmp-text-xx-large", ".text.cmp-text-x-large"] }, { name: "separator", instances: [".separator.separator-height-24", ".separator.separator-height-48", ".separator.separator-height-80"] }, { name: "carousel", instances: [".carousel.panelcontainer.carousel-minimal"] }, { name: "quote", instances: [".quote.cmp-quote-xx-large"] }, { name: "brightcove-video", instances: [".video.cmp-video-xx-large"] }] };
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
