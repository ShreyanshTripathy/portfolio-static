import { createHash, randomUUID } from "crypto";
import { execFile } from "child_process";
import { createServer } from "http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, dirname, extname, join, resolve, sep } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");
const publicDir = join(__dirname, "public");
const contentDir = join(rootDir, "content");
const imageDir = join(rootDir, "assets", "images");
const host = "127.0.0.1";
const preferredPort = Number(process.env.PORT || 4321);

const contentFiles = {
  profile: "profile.json",
  skills: "skills.json",
  education: "education.json",
  experience: "internships.json",
  projects: "projects.json",
  coursework: "courses.json",
  certificates: "certificates.json",
  resume: "resume.json",
  timeline: "timeline.json",
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), "application/json; charset=utf-8");
}

function safeJoin(base, requestPath) {
  const cleanPath = decodeURIComponent(requestPath.split("?")[0]).replace(/^\/+/, "");
  const resolved = resolve(base, cleanPath);
  if (resolved !== base && !resolved.startsWith(base + sep)) return null;
  return resolved;
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 50 * 1024 * 1024) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function readContent(type) {
  const file = contentFiles[type];
  if (!file) throw new Error(`Unknown content type: ${type}`);
  return JSON.parse(readFileSync(join(contentDir, file), "utf8"));
}

function writeContent(type, data) {
  const file = contentFiles[type];
  if (!file) throw new Error(`Unknown content type: ${type}`);
  writeFileSync(join(contentDir, file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function validateContent(type, data) {
  const required = {
    profile: ["name", "headline", "bio"],
    skills: ["name", "category"],
    education: ["degree", "institution"],
    experience: ["role", "company"],
    projects: ["title", "summary", "description"],
    coursework: ["title", "description"],
    certificates: ["title", "issuer"],
    resume: ["title"],
    timeline: ["date", "title", "category"],
  };
  const items = Array.isArray(data) ? data : [data];
  const missing = [];
  for (const [index, item] of items.entries()) {
    for (const field of required[type] || []) {
      if (item && Object.prototype.hasOwnProperty.call(item, field) && !String(item[field] ?? "").trim()) {
        missing.push(`${Array.isArray(data) ? `entry ${index + 1}: ` : ""}${field}`);
      }
    }
  }
  return missing;
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!boundaryMatch) throw new Error("Missing multipart boundary.");
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const parts = [];
  let start = buffer.indexOf(boundary);
  while (start !== -1) {
    start += boundary.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), start);
    if (headerEnd === -1) break;
    const rawHeaders = buffer.slice(start, headerEnd).toString("utf8");
    const next = buffer.indexOf(boundary, headerEnd + 4);
    if (next === -1) break;
    let content = buffer.slice(headerEnd + 4, next);
    if (content.slice(-2).toString() === "\r\n") content = content.slice(0, -2);
    parts.push({
      name: /name="([^"]+)"/.exec(rawHeaders)?.[1] || "",
      filename: /filename="([^"]*)"/.exec(rawHeaders)?.[1] || "",
      content,
    });
    start = next;
  }
  return parts;
}

function cleanFilename(name) {
  const ext = extname(name || "").toLowerCase() || ".bin";
  const stem = basename(name || "upload", ext)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "upload";
  return { stem, ext };
}

async function uploadImage(req, res) {
  const body = await readBody(req);
  const file = parseMultipart(body, req.headers["content-type"]).find((part) => part.name === "file" && part.filename);
  if (!file) return sendJson(res, 400, { error: "No file was uploaded." });
  mkdirSync(imageDir, { recursive: true });
  const { stem, ext } = cleanFilename(file.filename);
  const hash = createHash("sha1").update(file.content).digest("hex").slice(0, 10);
  const filename = `${stem}-${hash}${ext}`;
  const target = join(imageDir, filename);
  if (!existsSync(target)) writeFileSync(target, file.content);
  return sendJson(res, 200, { filename, assetPath: `assets/images/${filename}`, legacyPath: `img/${filename}` });
}

function runGenerate(res) {
  execFile(process.execPath, [join(rootDir, "tools", "generate-site.mjs")], { cwd: rootDir }, (error, stdout, stderr) => {
    sendJson(res, error ? 500 : 200, {
      ok: !error,
      code: error?.code ?? 0,
      output: `${stdout || ""}${stderr || ""}`.trim() || "Generator completed with no output.",
    });
  });
}

function serveStatic(res, base, requestPath) {
  let filePath = safeJoin(base, requestPath);
  if (!filePath) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, "index.html");
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) return send(res, 404, "Not found", "text/plain; charset=utf-8");
  send(res, 200, readFileSync(filePath), mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream");
}

async function handle(req, res) {
  try {
    const url = new URL(req.url, `http://${host}`);
    if (req.method === "GET" && url.pathname === "/") return serveStatic(res, publicDir, "index.html");
    if (req.method === "GET" && url.pathname.startsWith("/editor/")) {
      return serveStatic(res, publicDir, url.pathname.replace(/^\/editor\//, ""));
    }
    if (req.method === "GET" && url.pathname.startsWith("/preview/")) {
      return serveStatic(res, rootDir, url.pathname.replace(/^\/preview\/?/, ""));
    }
    if (req.method === "GET" && url.pathname === "/api/types") {
      return sendJson(res, 200, { types: Object.keys(contentFiles) });
    }
    const contentMatch = /^\/api\/content\/([a-z-]+)$/.exec(url.pathname);
    if (contentMatch && req.method === "GET") {
      const type = contentMatch[1];
      return sendJson(res, 200, { type, data: readContent(type) });
    }
    if (contentMatch && req.method === "POST") {
      const type = contentMatch[1];
      const payload = JSON.parse((await readBody(req)).toString("utf8"));
      const missing = validateContent(type, payload.data);
      if (missing.length) return sendJson(res, 400, { error: "Required fields are empty.", missing });
      writeContent(type, payload.data);
      return sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
    }
    if (req.method === "POST" && url.pathname === "/api/upload-image") return uploadImage(req, res);
    if (req.method === "POST" && url.pathname === "/api/generate") return runGenerate(res);
    return send(res, 404, "Not found", "text/plain; charset=utf-8");
  } catch (error) {
    return sendJson(res, 500, { error: error.message || String(error), id: randomUUID() });
  }
}

function listen(port) {
  const server = createServer(handle);
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) return listen(port + 1);
    console.error(error);
    process.exit(1);
  });
  server.listen(port, host, () => {
    console.log(`Portfolio editor running at http://${host}:${port}`);
    console.log("Local-only server. Press Ctrl+C to stop.");
  });
}

listen(preferredPort);
