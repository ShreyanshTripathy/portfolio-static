import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlFiles = [];
const errors = [];

function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, item.name);
    if (item.isDirectory()) {
      if ([".git", "assets", "content", "tools"].includes(item.name)) continue;
      walk(current);
    } else if (item.name.endsWith(".html")) {
      htmlFiles.push(current);
    }
  }
}

function existsRoute(route) {
  const target = route.endsWith(".html") ? path.join(root, route) : path.join(root, route, "index.html");
  if (!fs.existsSync(target)) errors.push(`Missing route: ${route}`);
}

walk(root);

[".", "projects", "experience", "skills", "certificates", "contact", "404.html"].forEach(existsRoute);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relativeFile = path.relative(root, file);

  if (/{{|{%|---/.test(html)) errors.push(`Template syntax leaked: ${relativeFile}`);

  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(https?:|mailto:|#|\?)/.test(reference) || reference.endsWith("/")) continue;
    const target = path.resolve(path.dirname(file), reference.split("#")[0].split("?")[0]);
    if (!fs.existsSync(target)) errors.push(`Missing asset from ${relativeFile}: ${reference}`);
  }

  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]+"/.test(match[0])) errors.push(`Image missing alt text: ${relativeFile}`);
  }
}

if (!fs.existsSync(path.join(root, ".nojekyll"))) errors.push("Missing .nojekyll");
if (!fs.existsSync(path.join(root, "sitemap.xml"))) errors.push("Missing sitemap.xml");
if (!fs.existsSync(path.join(root, "robots.txt"))) errors.push("Missing robots.txt");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files.`);
