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
  projectDetailPage,
  projectsPage,
  skillsPage,
} from "./templates/pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentRoot = path.join(root, "content");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(contentRoot, name), "utf8"));
}

function writePage(relativePath, html) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

function dateScore(value) {
  return value ? new Date(`${value}T00:00:00Z`).getTime() : Number.NEGATIVE_INFINITY;
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
  };

  data.skills.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  data.education.sort((a, b) => dateScore(b.start_date) - dateScore(a.start_date) || (a.sort_order || 0) - (b.sort_order || 0));
  data.internships.sort((a, b) => dateScore(b.start_date) - dateScore(a.start_date) || (a.sort_order || 0) - (b.sort_order || 0));
  data.projects.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || (a.sort_order || 0) - (b.sort_order || 0) || dateScore(b.start_date) - dateScore(a.start_date));
  data.certificates.sort((a, b) => dateScore(b.date) - dateScore(a.date) || (a.sort_order || 0) - (b.sort_order || 0));
  data.courses.sort((a, b) => dateScore(b.completion_date) - dateScore(a.completion_date) || (a.sort_order || 0) - (b.sort_order || 0) || a.title.localeCompare(b.title));
  return data;
}

const data = prepareData();

writePage("index.html", homePage(data));
writePage("skills/index.html", skillsPage(data));
writePage("certificates/index.html", certificatesPage(data));
writePage("contact/index.html", contactPage(data));
writePage("projects/index.html", projectsPage(data));
writePage("experience/index.html", experiencePage(data));

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

console.log(`Generated static portfolio in ${root}`);
