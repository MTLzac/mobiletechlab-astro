const fs = require("fs");
const path = require("path");

const SNAPSHOT_DIR = "./snapshots";
const PAGES_DIR = "./src/pages";

// Convert snapshot filename to Astro route
function slugToRoute(slug) {
  return slug
    .replace(".html", "")
    .replace(/_/g, "/");
}

// Ensure folder exists
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// Clean the snapshot HTML
function cleanHtml(html) {

  // Remove ALL script tags (React hydration, analytics, schema etc.)
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove Vite module preload links
  html = html.replace(/<link rel="modulepreload"[\s\S]*?>/gi, "");

  // Remove references to JS bundles
  html = html.replace(/\/assets\/[^\s"'<>]+\.js/g, "");

  // Remove inline module scripts
  html = html.replace(/type="module"/gi, "");

  return html;
}

// Build Astro page
function buildAstroPage(html, seo) {

  const title = seo?.title || "";
  const description = seo?.description || "";
  const canonical = seo?.canonical || "";

  return `---
const title = ${JSON.stringify(title)}
const description = ${JSON.stringify(description)}
const canonical = ${JSON.stringify(canonical)}
---

<html lang="en">
<head>
<meta charset="utf-8" />
<title>{title}</title>
<meta name="description" content={description} />
${canonical ? `<link rel="canonical" href="${canonical}" />` : ""}
</head>

<body>

${html}

</body>
</html>
`;
}

const files = fs.readdirSync(SNAPSHOT_DIR);

files.forEach(file => {

  if (!file.endsWith(".html")) return;

  const slug = file.replace(".html", "");
  const route = slugToRoute(slug);

  const htmlPath = path.join(SNAPSHOT_DIR, file);
  let htmlContent = fs.readFileSync(htmlPath, "utf8");

  htmlContent = cleanHtml(htmlContent);

  const seoPath = path.join(SNAPSHOT_DIR, `${slug}.seo.json`);
  let seo = null;

  if (fs.existsSync(seoPath)) {
    seo = JSON.parse(fs.readFileSync(seoPath));
  }

  const astroContent = buildAstroPage(htmlContent, seo);

  const outputPath = path.join(PAGES_DIR, route + ".astro");

  ensureDir(path.dirname(outputPath));

  fs.writeFileSync(outputPath, astroContent);

  console.log("Generated:", outputPath);
});

console.log("Done.");