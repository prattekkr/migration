/**
 * Generate AEM JCR content package from imported .plain.html files.
 *
 * Usage: node tools/importer/generate-jcr-package.js --urls tools/importer/urls-story-batch-5.txt
 *
 * Produces: tools/importer/packages/story-article-batch.zip
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONTENT_BASE = '/content/migration';
const DAM_BASE = '/content/dam/migration';
const PACKAGE_DIR = '/tmp/aem-batch-package';

// Read URLs from file
const urlsFile = process.argv.find(a => a.startsWith('--urls='))?.split('=')[1]
  || process.argv[process.argv.indexOf('--urls') + 1];
const urls = fs.readFileSync(urlsFile, 'utf8').trim().split('\n').filter(u => u.trim());

console.log(`Processing ${urls.length} pages...`);

// Helper: download file
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return; }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Helper: XML-encode
function xmlEnc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Helper: extract page slug from URL
function getSlug(url) {
  return new URL(url).pathname.replace(/\.html$/, '').replace(/^\//, '');
}

// Helper: extract page name from slug
function getPageName(slug) {
  return slug.split('/').pop();
}

// Parse .plain.html and extract content for JCR XML
function parsePageContent(htmlFile) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const lines = html.split('\n');

  // Extract all image URLs from the HTML
  const imageUrls = [];
  const imgRegex = /src="([^"]+\.(jpeg|jpg|png|gif|webp|avif)[^"]*)"/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (!match[1].startsWith('data:')) imageUrls.push(match[1]);
  }

  // Extract text content from text-container blocks
  const textBlocks = [];
  const tcRegex = /<div class="text-container[^"]*">([\s\S]*?)<\/div><\/div><\/div><\/div><\/div>/g;
  while ((match = tcRegex.exec(html)) !== null) {
    // Get the last row's content (the richtext)
    const inner = match[1];
    const lastDiv = inner.match(/<div><div>([\s\S]*?)<\/div><\/div>$/);
    if (lastDiv) textBlocks.push(lastDiv[1]);
  }

  // Extract titles
  const titles = [];
  const titleRegex = /<div class="custom-title[^"]*">[\s\S]*?<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/g;
  while ((match = titleRegex.exec(html)) !== null) {
    titles.push({ tag: match[1], text: match[2].replace(/<[^>]+>/g, '') });
  }

  return { imageUrls, textBlocks, titles, html, lines };
}

async function processPage(url) {
  const slug = getSlug(url);
  const pageName = getPageName(slug);
  const pagePath = `who-we-are/our-stories/${pageName}`;
  const htmlFile = `content/${pagePath}.plain.html`;

  if (!fs.existsSync(htmlFile)) {
    console.log(`  SKIP: ${htmlFile} not found`);
    return;
  }

  console.log(`  Processing: ${pageName}`);

  const { imageUrls } = parsePageContent(htmlFile);

  // Create page directory
  const pageDir = `${PACKAGE_DIR}/jcr_root${CONTENT_BASE}/${pagePath}`;
  fs.mkdirSync(pageDir, { recursive: true });

  // Create DAM directory
  const damDir = `${PACKAGE_DIR}/jcr_root${DAM_BASE}/${pagePath}`;
  fs.mkdirSync(damDir, { recursive: true });
  fs.writeFileSync(`${damDir}/.content.xml`, '<?xml version="1.0" encoding="UTF-8"?><jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="sling:Folder"/>');

  // Download images and build DAM assets
  const imageMap = {};
  let imgIdx = 0;
  for (const imgUrl of [...new Set(imageUrls)]) {
    imgIdx++;
    const ext = imgUrl.match(/\.(jpeg|jpg|png|gif|webp|avif)/i)?.[1] || 'jpeg';
    let filename;

    // Try to extract meaningful name from URL
    const urlPath = new URL(imgUrl.split('?')[0]).pathname;
    const urlFilename = urlPath.split('/').pop();
    if (urlFilename && urlFilename.length > 3) {
      filename = urlFilename.replace(/[^a-zA-Z0-9._-]/g, '-');
    } else {
      filename = `image-${String(imgIdx).padStart(2, '0')}.${ext}`;
    }
    if (!filename.includes('.')) filename += `.${ext}`;

    const assetDir = `${damDir}/${filename}`;
    const renditionsDir = `${assetDir}/_jcr_content/renditions`;
    fs.mkdirSync(renditionsDir, { recursive: true });

    // Download image
    try {
      await download(imgUrl, `${renditionsDir}/original`);
      const size = fs.statSync(`${renditionsDir}/original`).size;
      console.log(`    Image: ${filename} (${(size/1024).toFixed(0)} KB)`);
    } catch (e) {
      console.log(`    Image FAILED: ${filename} - ${e.message}`);
      continue;
    }

    // Asset .content.xml
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    fs.writeFileSync(`${assetDir}/.content.xml`,
      `<?xml version="1.0" encoding="UTF-8"?><jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:dam="http://www.day.com/dam/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" jcr:primaryType="dam:Asset"><jcr:content jcr:primaryType="dam:AssetContent"><metadata jcr:primaryType="nt:unstructured" dc:format="${mimeType}"/></jcr:content></jcr:root>`);

    imageMap[imgUrl] = `${DAM_BASE}/${pagePath}/${filename}`;
  }

  // Generate JCR XML by reading the .plain.html and converting
  // For now, use a simplified approach: read the existing .content.xml template
  // and adapt it based on the page content
  const jcrXml = generateJcrXml(htmlFile, pageName, pagePath, imageMap);
  fs.writeFileSync(`${pageDir}/.content.xml`, jcrXml);

  console.log(`    JCR XML: ${(jcrXml.length/1024).toFixed(1)} KB`);
  return pagePath;
}

function generateJcrXml(htmlFile, pageName, pagePath, imageMap) {
  const html = fs.readFileSync(htmlFile, 'utf8');

  // Parse the HTML sections
  const sections = html.split('\n');

  // Extract hero image
  const heroImgMatch = html.match(/class="hero-container[^"]*"[\s\S]*?src="([^"]+)"/);
  const heroImg = heroImgMatch ? (imageMap[heroImgMatch[1]] || heroImgMatch[1]) : '';

  // Extract page title
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const pageTitle = titleMatch ? xmlEnc(titleMatch[1]) : pageName;

  // Extract hero subtitle (first text-container in hero section)
  const subtitleMatch = sections[0]?.match(/class="text-container[^"]*"[\s\S]*?<div><div>(?:<p>)?([\s\S]*?)(?:<\/p>)?<\/div><\/div><\/div>$/);

  // Extract story card category link
  const categoryMatch = html.match(/class="story-card"[\s\S]*?href="([^"]+)"/);
  const categoryHref = categoryMatch ? categoryMatch[1] : '/science';

  // Extract all body content blocks from section 4 (grid-cols-8)
  const bodySection = sections[3] || '';

  // Extract text-containers from body
  const bodyTexts = [];
  const tcRegex = /<div class="(text-container[^"]*)">([\s\S]*?)<\/div><\/div><\/div><\/div><\/div>/g;
  let m;
  let inBody = false;
  // Process line 4 (body section)
  while ((m = tcRegex.exec(bodySection)) !== null) {
    const cls = m[1];
    const content = m[2];
    // Get the richtext from last row
    const rows = content.split('</div></div><div><div>');
    const lastRow = rows[rows.length - 1]?.replace(/<\/div>.*$/, '') || '';
    const variant = cls.replace('text-container', '').trim().replace(/\s+/g, ',');
    bodyTexts.push({ variant: variant || 'spacing-bottom,width-large', text: xmlEnc(lastRow) });
  }

  // Extract custom-titles from body
  const bodyTitles = [];
  const ctRegex = /<div class="(custom-title[^"]*)"[\s\S]*?<(h[1-6])[^>]*>([^<]+)<\/\2>/g;
  while ((m = ctRegex.exec(bodySection)) !== null) {
    const cls = m[1].replace('custom-title', '').trim().replace(/\s+/g, ',');
    bodyTitles.push({ variant: cls || 'h5-size,width-large', tag: m[2], text: xmlEnc(m[3]) });
  }

  // Extract custom-images from body
  const bodyImages = [];
  const ciRegex = /<div class="custom-image"[\s\S]*?src="([^"]+)"/g;
  while ((m = ciRegex.exec(bodySection)) !== null) {
    const src = imageMap[m[1]] || m[1];
    bodyImages.push(src);
  }

  // Extract subtitle text
  let subtitleText = '';
  const heroLine = sections[0] || '';
  const stMatch = heroLine.match(/<div class="text-container[^"]*">[\s\S]*?<div><div><div><div>[\s\S]*?<div><div><div><div>[\s\S]*?<div><div>([\s\S]*?)<\/div><\/div><\/div>/);
  if (!stMatch) {
    // Simpler extraction: find text after the last custom-title in hero section
    const lastTcInHero = heroLine.match(/class="text-container[^"]*"[\s\S]*$/);
    if (lastTcInHero) {
      const pMatch = lastTcInHero[0].match(/<p>([^<]+)<\/p>/);
      if (pMatch) subtitleText = xmlEnc(pMatch[1]);
    }
  } else {
    subtitleText = xmlEnc(stMatch[1].replace(/<[^>]+>/g, ''));
  }

  // Build JCR XML using blocks found in body
  // Interleave titles and texts in order of appearance
  const bodyBlocks = [];
  const allBlocksRegex = /<div class="(text-container|custom-title|separator|carousel|custom-image)[^"]*"/g;
  let blockIdx = { text: 0, title: 0, image: 0 };
  while ((m = allBlocksRegex.exec(bodySection)) !== null) {
    const type = m[1];
    if (type === 'text-container') {
      if (blockIdx.text < bodyTexts.length) bodyBlocks.push({ type: 'text', data: bodyTexts[blockIdx.text++] });
    } else if (type === 'custom-title') {
      if (blockIdx.title < bodyTitles.length) bodyBlocks.push({ type: 'title', data: bodyTitles[blockIdx.title++] });
    } else if (type === 'separator') {
      bodyBlocks.push({ type: 'separator' });
    } else if (type === 'carousel') {
      bodyBlocks.push({ type: 'carousel' });
    } else if (type === 'custom-image') {
      if (blockIdx.image < bodyImages.length) bodyBlocks.push({ type: 'image', data: bodyImages[blockIdx.image++] });
    }
  }

  // Generate XML
  let bodyXml = '';
  let nodeIdx = 0;
  for (const block of bodyBlocks) {
    nodeIdx++;
    const nodeSuffix = nodeIdx > 1 ? `_${nodeIdx}` : '';

    if (block.type === 'text') {
      bodyXml += `<text_container${nodeSuffix} jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="text-container" classes_customDynamicClass="${block.data.variant}" filter="text-container" language="none" model="text-container" modelFields="[classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Text Container">
<text_container_text jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block/item" aueComponentId="text-container-text" model="text-container-text" modelFields="[text@richtext]" name="Text Container Text" text="${block.data.text}"/>
</text_container${nodeSuffix}>
`;
    } else if (block.type === 'title') {
      const titleType = block.data.tag || 'h5';
      bodyXml += `<custom_title${nodeSuffix} jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="custom-title" classes_customDynamicClass="${block.data.variant}" filter="custom-title" language="none" model="custom-title" modelFields="[title@text,classes_customDynamicClass@ngaem:dynamic-picklist,titleType@select,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Custom Title" title="${block.data.text}" titleType="${titleType}"/>
`;
    } else if (block.type === 'separator') {
      bodyXml += `<separator${nodeSuffix} jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="separator" classes_customDynamicClass="separator-height-24" language="none" model="separator" modelFields="[showLine@boolean,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Separator" showLine="{Boolean}false"/>
`;
    } else if (block.type === 'carousel') {
      bodyXml += `<carousel${nodeSuffix} jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="carousel" autoplay="{Boolean}false" bypassCarouselOnMobile="{Boolean}false" carouselType="static" centerActiveSlide="{Boolean}false" enableDotNavigation="{Boolean}true" enableLooping="{Boolean}false" enableNextPreviousControls="{Boolean}true" filter="carousel" itemLabel="{Boolean}false" language="none" model="carousel" modelFields="[totalSlides@number,carouselType@select,rssFeedUrl@text,numberOfItems@number,autoplay@boolean,slideTransitionTime@number,pauseOnHover@boolean,numberOfSlidesToShow@number,bypassCarouselOnMobile@boolean,startingSlideIndex@number,centerActiveSlide@boolean,enableLooping@boolean,enableNextPreviousControls@boolean,enableDotNavigation@boolean,carouselLabel@text,previousButtonLabel@text,nextButtonLabel@text,playButtonLabel@text,pauseButtonLabel@text,tablistLabel@text,itemLabel@boolean,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Carousel" numberOfSlidesToShow="{Long}1" pauseOnHover="{Boolean}false" slideTransitionTime="{Long}3000" startingSlideIndex="{Long}1" totalSlides="{Long}7"/>
`;
    } else if (block.type === 'image') {
      bodyXml += `<custom_image${nodeSuffix} jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="custom-image" clickBehavior="_self" displayCaptionBelowImage="{Boolean}false" enableLink="{Boolean}false" enableWarnOnLeave="{Boolean}false" getAltFromDAM="{Boolean}false" getCaptionFromDAM="{Boolean}false" image="${xmlEnc(block.data)}" imageIsDecorative="{Boolean}false" imageMimeType="image/jpeg" language="none" model="custom-image" modelFields="[image@custom-asset-namespace:custom-asset,imageMimeType@custom-asset-namespace:custom-asset-mimetype,imageAlt@text,getAltFromDAM@boolean,imageIsDecorative@boolean,caption@text,getCaptionFromDAM@boolean,displayCaptionBelowImage@boolean,enableLink@boolean,target@aem-content,clickBehavior@select,modalPanelId@text,enableWarnOnLeave@boolean,warnOnLeavePath@aem-content,linkAriaLabel@text,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Custom Image"/>
`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
<jcr:content cq:isDelivered="{Boolean}false" cq:template="/libs/core/franklin/templates/page" jcr:primaryType="cq:PageContent" jcr:title="${pageName}" sling:resourceType="core/franklin/components/page/v1/page">
<root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
<section_hero jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/section/v1/section" aueComponentId="section" classes_customDynamicClass="content-wide,medium-radius" language="none" model="section" modelFields="[name@text,background@reference,backgroundAlt@text,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]">
<hero_container jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="hero-container" classes="[height-default]" classes_overlayHeight="overlay-height-short" filter="hero-container" model="hero-container" modelFields="[classes@multiselect,classes_overlayHeight@select]" name="Hero Container">
<hero_container_item jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block/item" aueComponentId="hero-container-item" image="${xmlEnc(heroImg)}" imageMimeType="image/jpeg" model="hero-container-item" modelFields="[image@custom-asset-namespace:custom-asset,imageMimeType@custom-asset-namespace:custom-asset-mimetype,imageAlt@text,videoUrl@text,text@richtext,bgColor@select,ctaLabel@text,ctaUrl@aem-content]" name="Hero Container Item"/>
</hero_container>
<cta jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" ariaHidden="{Boolean}false" aueComponentId="cta" classes="default-cta" classes_customDynamicClass="back-cta" ctaTarget="_self" iconFont="chevron" iconPosition="before" iconVariation="none" language="none" link="https://www.abbvie.com/who-we-are/our-stories.html" linkText="All Stories" model="cta" modelFields="[linkText@text,link@aem-content,aria-label@text,ctaTarget@select,iconVariation@select,iconFont@text,iconImage@reference,iconPosition@select,ariaHidden@boolean,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Cta"/>
<story_card jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="story-card" blockId="id:" hideDescription="{Boolean}true" hideImage="{Boolean}true" hidePublicationDate="{Boolean}false" hideReadTime="{Boolean}false" hideRole="{Boolean}true" language="lang:none" model="story-card" modelFields="[storyCardVariant@select,hidePublicationDate@boolean,hideReadTime@boolean,hideRole@boolean,hideDescription@boolean,hideImage@boolean,id@text,customClass@text,page@aem-content,openInNewTab@boolean,ctaLabel@text,analyticsInteractionId@text]" name="Story Card" openInNewTab="{Boolean}false" page="${categoryHref}" storyCardVariant="storyCardInfo"/>
<custom_title jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="custom-title" blockId="id:" classes_customDynamicClass="h1-size" filter="custom-title" language="lang:none" model="custom-title" modelFields="[title@text,classes_customDynamicClass@ngaem:dynamic-picklist,titleType@select,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Custom Title" title="${pageTitle}" titleType="h1"/>
<text_container jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block" aueComponentId="text-container" blockId="id:" classes_commonCustomClass="body-unica-32-reg" filter="text-container" language="none" model="text-container" modelFields="[classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Text Container">
<text_container_text jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/block/v1/block/item" aueComponentId="text-container-text" model="text-container-text" modelFields="[text@richtext]" name="Text Container Text" text="${subtitleText}"/>
</text_container>
</section_hero>
<grid_container jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/section/v1/section" aueComponentId="grid-container" classes_container="grid-container" classes_customDynamicClass="content-regular" filter="grid-container" identifier="Grid Container" language="none" model="grid-container" modelFields="[name@text,classes_container@text,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Grid Container"/>
<grid_section jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/section/v1/section" aueComponentId="grid-section" classes_customDynamicClass="grid-cols-2" filter="grid-section" identifier="Grid Section" model="grid-section" modelFields="[name@text,classes_container@text,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Grid Section"/>
<grid_section_main jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/section/v1/section" aueComponentId="grid-section" classes_container="grid-section" classes_customDynamicClass="grid-cols-8" filter="grid-section" identifier="Grid Section" language="none" model="grid-section" modelFields="[name@text,classes_container@text,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Grid Section">
${bodyXml}</grid_section_main>
<grid_section_sidebar jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/section/v1/section" aueComponentId="grid-section" classes_customDynamicClass="grid-cols-2" filter="grid-section" identifier="Grid Section" model="grid-section" modelFields="[name@text,classes_container@text,classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]" name="Grid Section"/>
</root>
</jcr:content>
</jcr:root>`;
}

// Main
async function main() {
  // Clean up
  fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });
  fs.mkdirSync(`${PACKAGE_DIR}/META-INF/vault`, { recursive: true });

  // Create DAM folder hierarchy
  for (const dir of ['migration', 'migration/who-we-are', 'migration/who-we-are/our-stories']) {
    const d = `${PACKAGE_DIR}/jcr_root/content/dam/${dir}`;
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(`${d}/.content.xml`, '<?xml version="1.0" encoding="UTF-8"?><jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="sling:Folder"/>');
  }

  const pagePaths = [];
  for (const url of urls) {
    try {
      const p = await processPage(url);
      if (p) pagePaths.push(p);
    } catch (e) {
      console.log(`  ERROR: ${url} - ${e.message}`);
    }
  }

  // Generate filter.xml
  const filters = pagePaths.map(p =>
    `    <filter root="${CONTENT_BASE}/${p}"/>\n    <filter root="${DAM_BASE}/${p}"/>`
  ).join('\n');

  // Also include the already-migrated genomics page
  fs.writeFileSync(`${PACKAGE_DIR}/META-INF/vault/filter.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<workspaceFilter version="1.0">\n${filters}\n</workspaceFilter>`);

  fs.writeFileSync(`${PACKAGE_DIR}/META-INF/vault/properties.xml`,
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">\n<properties>\n<entry key="name">story-article-batch-5</entry>\n<entry key="version">1.0.0</entry>\n<entry key="group">migration</entry>\n<entry key="description">Migrated story articles batch (5 pages)</entry>\n<entry key="packageType">content</entry>\n</properties>`);

  fs.writeFileSync(`${PACKAGE_DIR}/META-INF/vault/config.xml`,
    '<?xml version="1.0" encoding="UTF-8"?>\n<vaultfs version="1.1">\n    <aggregates/>\n    <handlers/>\n</vaultfs>');

  // Create zip
  const yazl = require('/tmp/node_modules/yazl');
  const zipfile = new yazl.ZipFile();

  function addDirToZip(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const zipPath = prefix + '/' + entry.name;
      if (entry.isDirectory()) {
        addDirToZip(fullPath, zipPath);
      } else {
        zipfile.addFile(fullPath, zipPath);
      }
    }
  }

  addDirToZip(`${PACKAGE_DIR}/META-INF`, 'META-INF');
  addDirToZip(`${PACKAGE_DIR}/jcr_root`, 'jcr_root');

  const outPath = 'tools/importer/packages/story-article-batch-5.zip';
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  return new Promise((resolve) => {
    zipfile.outputStream.pipe(fs.createWriteStream(outPath)).on('close', () => {
      const stats = fs.statSync(outPath);
      console.log(`\nPackage created: ${outPath} (${(stats.size / 1024).toFixed(0)} KB)`);
      console.log(`Pages: ${pagePaths.length}`);
      resolve();
    });
    zipfile.end();
  });
}

main().catch(console.error);
