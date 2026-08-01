import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  certificatesPage,
  contactPage,
  courseDetailPage,
  educationDetailPage,
  experienceDetailPage,
  experiencePage,
  homePage,
  notFoundPage,
  projectDetailPage,
  projectsPage,
  skillsPage,
} from "./templates/pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentRoot = path.join(root, "content");

function readJson(name) {
  const file = path.join(contentRoot, name);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writePage(relativePath, html) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

function dateScore(value) {
  return value ? new Date(`${value}T00:00:00Z`).getTime() : Number.NEGATIVE_INFINITY;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "entry";
}

function prepareData() {
  const data = {
    profile: readJson("profile.json"),
    resume: readJson("resume.json"),
    skills: readJson("skills.json"),
    education: readJson("education.json"),
    internships: readJson("internships.json"),
    projects: readJson("projects.json"),
    courses: readJson("courses.json"),
    certificates: readJson("certificates.json"),
    timeline: readJson("timeline.json"),
  };

  for (const collection of [data.projects, data.internships, data.education, data.courses, data.certificates, data.timeline]) {
    for (const entry of collection) {
      entry.slug ||= slugify(entry.title || entry.role || entry.degree || entry.name);
    }
  }

  data.skills.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  data.education.sort((a, b) => dateScore(b.start_date) - dateScore(a.start_date) || (a.sort_order || 0) - (b.sort_order || 0));
  data.internships.sort((a, b) => dateScore(b.start_date) - dateScore(a.start_date) || (a.sort_order || 0) - (b.sort_order || 0));
  data.projects.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.sort_order || 0) - (b.sort_order || 0) || dateScore(b.start_date) - dateScore(a.start_date));
  data.certificates.sort((a, b) => dateScore(b.date) - dateScore(a.date) || (a.sort_order || 0) - (b.sort_order || 0));
  data.courses.sort((a, b) => dateScore(b.completion_date) - dateScore(a.completion_date) || (a.sort_order || 0) - (b.sort_order || 0) || a.title.localeCompare(b.title));
  data.timeline.sort((a, b) => dateScore(b.date) - dateScore(a.date) || a.title.localeCompare(b.title));
  return data;
}

function allRoutes(data) {
  return [
    "",
    "skills/",
    "certificates/",
    "contact/",
    "projects/",
    "experience/",
    ...data.projects.map((project) => `projects/${project.slug}/`),
    ...data.internships.map((experience) => `experience/${experience.slug}/`),
    ...data.education.map((education) => `education/${education.slug}/`),
    ...data.courses.map((course) => `coursework/${course.slug}/`),
  ];
}

function writeSitemap(data) {
  const base = "https://shreyanshtripathy.github.io/portfolio-static/";
  const urls = allRoutes(data)
    .map((route) => `  <url><loc>${base}${route}</loc></url>`)
    .join("\n");
  writePage("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writePage("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
}

const data = prepareData();

writePage("index.html", homePage(data));
writePage("skills/index.html", skillsPage(data));
writePage("certificates/index.html", certificatesPage(data));
writePage("contact/index.html", contactPage(data));
writePage("projects/index.html", projectsPage(data));
writePage("experience/index.html", experiencePage(data));
writePage("404.html", notFoundPage(data));

for (const project of data.projects) {
  writePage(`projects/${project.slug}/index.html`, projectDetailPage(data, project));
}

for (const [index, experience] of data.internships.entries()) {
  writePage(
    `experience/${experience.slug}/index.html`,
    experienceDetailPage(data, experience, index > 0 ? data.internships[index - 1] : null, index < data.internships.length - 1 ? data.internships[index + 1] : null),
  );
}

for (const education of data.education) {
  writePage(`education/${education.slug}/index.html`, educationDetailPage(data, education));
}

for (const course of data.courses) {
  writePage(`coursework/${course.slug}/index.html`, courseDetailPage(data, course));
}

writeSitemap(data);

console.log(`Generated static portfolio in ${root}`);
