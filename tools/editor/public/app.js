const labels = {
  profile: "Profile",
  skills: "Skills",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  coursework: "Coursework",
  certificates: "Certificates",
  resume: "Resume",
  timeline: "Timeline",
};

const singletonTypes = new Set(["profile", "resume"]);
const hiddenKeys = new Set(["id", "created_at", "updated_at", "sort_order", "slug", "project", "course", "education_entry"]);
const textAreas = new Set(["bio", "description", "summary", "highlight", "body", "objective", "method", "results", "additional_description"]);
const imageKeys = new Set(["image", "static_image_path", "profile_image", "src", "file"]);
const dateKeys = new Set(["date", "start_date", "end_date", "completion_date"]);
const requiredFields = {
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

const state = {
  types: [],
  currentType: "profile",
  data: null,
  selectedIndex: 0,
};

const typeNav = document.querySelector("#typeNav");
const listPane = document.querySelector("#listPane");
const editorForm = document.querySelector("#editorForm");
const pageTitle = document.querySelector("#pageTitle");
const eyebrow = document.querySelector("#eyebrow");
const statusLine = document.querySelector("#status");
const logPanel = document.querySelector("#logPanel");

function setStatus(message, tone = "") {
  statusLine.textContent = message;
  statusLine.style.color = tone === "bad" ? "var(--danger)" : tone === "good" ? "var(--oxide-blue)" : "var(--ink-soft)";
}

function appendLog(message) {
  logPanel.textContent = `${logPanel.textContent.trim()}\n\n${message}`.trim();
  logPanel.scrollTop = logPanel.scrollHeight;
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ? `${json.error}${json.missing ? `\n${json.missing.join("\n")}` : ""}` : "Request failed.");
  return json;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleFor(item) {
  if (!item || typeof item !== "object") return "Untitled";
  return item.title || item.name || item.role || item.degree || item.company || item.category || "Untitled";
}

function dateFor(item) {
  return item?.date || item?.start_date || item?.completion_date || item?.end_date || item?.category || "";
}

function blankFrom(value, key = "") {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, blankFrom(childValue, childKey)]));
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  return "";
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => Number(item?.id) || 0)) + 1;
}

function pathKey(path) {
  return path.join(".");
}

function getAt(root, path) {
  return path.reduce((value, part) => value?.[part], root);
}

function setAt(root, path, value) {
  const parent = getAt(root, path.slice(0, -1));
  parent[path[path.length - 1]] = value;
}

function deleteAt(root, path) {
  const parent = getAt(root, path.slice(0, -1));
  parent.splice(path[path.length - 1], 1);
}

function activeItem() {
  return singletonTypes.has(state.currentType) ? state.data : state.data[state.selectedIndex];
}

function renderNav() {
  typeNav.innerHTML = "";
  for (const type of state.types) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = labels[type] || type;
    button.setAttribute("aria-current", String(type === state.currentType));
    button.addEventListener("click", () => loadType(type));
    typeNav.append(button);
  }
}

function renderList() {
  listPane.innerHTML = "";
  if (singletonTypes.has(state.currentType)) {
    const box = document.createElement("div");
    box.className = "list-head";
    box.innerHTML = `<span class="meta">Singleton</span><span>${labels[state.currentType]}</span>`;
    listPane.append(box);
    return;
  }

  const head = document.createElement("div");
  head.className = "list-head";
  head.innerHTML = `<span class="meta">${state.data.length} entries</span>`;
  const add = document.createElement("button");
  add.type = "button";
  add.className = "small-button";
  add.textContent = "Add new";
  add.addEventListener("click", addEntry);
  head.append(add);
  listPane.append(head);

  state.data.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "entry-button";
    button.setAttribute("aria-current", String(index === state.selectedIndex));
    button.innerHTML = `<strong>${escapeHtml(titleFor(item))}</strong><span>${escapeHtml(dateFor(item))}</span>`;
    button.addEventListener("click", () => {
      state.selectedIndex = index;
      render();
    });
    listPane.append(button);
  });
}

function fieldType(key, value) {
  if (typeof value === "boolean") return "checkbox";
  if (typeof value === "number") return "number";
  if (dateKeys.has(key)) return "date";
  if (/link|url|github|linkedin/i.test(key)) return "url";
  if (/email/i.test(key)) return "email";
  return "text";
}

function renderScalar(container, root, path, key, value) {
  const field = document.createElement("div");
  field.className = `field ${textAreas.has(key) || imageKeys.has(key) ? "full" : ""}`;
  const id = `field-${pathKey(path).replace(/[^a-z0-9]/gi, "-")}`;
  const required = (requiredFields[state.currentType] || []).includes(key);
  field.innerHTML = `<label for="${id}">${escapeHtml(key)}${required ? " *" : ""}</label>`;

  if (textAreas.has(key)) {
    const input = document.createElement("textarea");
    input.id = id;
    input.value = value ?? "";
    input.addEventListener("input", () => setAt(root, path, input.value));
    field.append(input);
  } else if (imageKeys.has(key)) {
    const row = document.createElement("div");
    row.className = "image-row";
    const input = document.createElement("input");
    input.id = id;
    input.type = "text";
    input.value = value ?? "";
    input.placeholder = key === "static_image_path" ? "img/example.jpg" : "example.jpg";
    input.addEventListener("input", () => setAt(root, path, input.value));
    const upload = document.createElement("input");
    upload.type = "file";
    upload.accept = key === "file" ? ".pdf,application/pdf,image/*" : "image/*";
    upload.addEventListener("change", async () => {
      if (!upload.files?.[0]) return;
      const form = new FormData();
      form.append("file", upload.files[0]);
      setStatus("Uploading file...");
      try {
        const result = await api("/api/upload-image", { method: "POST", body: form });
        const stored = key === "static_image_path" ? result.legacyPath : result.filename;
        input.value = stored;
        setAt(root, path, stored);
        setStatus(`Uploaded ${result.filename}`, "good");
      } catch (error) {
        setStatus("Upload failed", "bad");
        appendLog(error.message);
      }
    });
    row.append(input, upload);
    field.append(row);
  } else {
    const input = document.createElement("input");
    input.id = id;
    input.type = fieldType(key, value);
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
      input.addEventListener("change", () => setAt(root, path, input.checked));
    } else {
      input.value = value ?? "";
      input.addEventListener("input", () => {
        setAt(root, path, input.type === "number" ? Number(input.value) : input.value);
      });
    }
    field.append(input);
  }
  container.append(field);
}

function renderObject(container, root, path, key, value) {
  if (hiddenKeys.has(key)) return;
  const group = document.createElement("section");
  group.className = "object-group";
  group.innerHTML = `<div class="group-head"><span class="meta">${escapeHtml(key)}</span></div>`;
  const grid = document.createElement("div");
  grid.className = "field-grid";
  group.append(grid);
  for (const [childKey, childValue] of Object.entries(value || {})) {
    renderValue(grid, root, [...path, childKey], childKey, childValue);
  }
  container.append(group);
}

function renderArray(container, root, path, key, value) {
  const group = document.createElement("section");
  group.className = "array-group";
  const head = document.createElement("div");
  head.className = "array-head";
  head.innerHTML = `<span class="meta">${escapeHtml(key)} (${value.length})</span>`;
  const add = document.createElement("button");
  add.type = "button";
  add.className = "small-button";
  add.textContent = `Add ${key}`;
  add.addEventListener("click", () => {
    value.push(value[0] ? blankFrom(value[0]) : "");
    render();
  });
  head.append(add);
  group.append(head);

  value.forEach((item, index) => {
    const itemBox = document.createElement("div");
    itemBox.className = "array-item";
    const itemHead = document.createElement("div");
    itemHead.className = "group-head";
    itemHead.innerHTML = `<span>${escapeHtml(titleFor(item) || `${key} ${index + 1}`)}</span>`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger-button small-button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      if (!confirm(`Delete this ${key} item?`)) return;
      deleteAt(root, [...path, index]);
      render();
    });
    itemHead.append(remove);
    itemBox.append(itemHead);
    const grid = document.createElement("div");
    grid.className = "field-grid";
    if (item && typeof item === "object" && !Array.isArray(item)) {
      for (const [childKey, childValue] of Object.entries(item)) {
        renderValue(grid, root, [...path, index, childKey], childKey, childValue);
      }
    } else {
      renderScalar(grid, root, [...path, index], String(index + 1), item);
    }
    itemBox.append(grid);
    group.append(itemBox);
  });
  container.append(group);
}

function renderValue(container, root, path, key, value) {
  if (hiddenKeys.has(key)) return;
  if (Array.isArray(value)) return renderArray(container, root, path, key, value);
  if (value && typeof value === "object") return renderObject(container, root, path, key, value);
  return renderScalar(container, root, path, key, value);
}

function renderEditor() {
  const item = activeItem();
  pageTitle.textContent = labels[state.currentType] || state.currentType;
  eyebrow.textContent = singletonTypes.has(state.currentType) ? "Direct edit" : titleFor(item);
  editorForm.innerHTML = "";
  if (!item) {
    editorForm.innerHTML = "<p>No entry selected.</p>";
    return;
  }
  const grid = document.createElement("div");
  grid.className = "field-grid";
  for (const [key, value] of Object.entries(item)) {
    renderValue(grid, item, [key], key, value);
  }
  editorForm.append(grid);

  const actions = document.createElement("div");
  actions.className = "form-actions";
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "primary-button";
  save.textContent = "Save JSON";
  actions.append(save);
  if (!singletonTypes.has(state.currentType)) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger-button";
    remove.textContent = "Delete entry";
    remove.addEventListener("click", deleteEntry);
    actions.append(remove);
  }
  editorForm.append(actions);
}

function render() {
  renderNav();
  renderList();
  renderEditor();
}

async function loadType(type) {
  state.currentType = type;
  state.selectedIndex = 0;
  setStatus(`Loading ${labels[type] || type}...`);
  const result = await api(`/api/content/${type}`);
  state.data = result.data;
  setStatus(`Loaded ${labels[type] || type}`, "good");
  render();
}

function addEntry() {
  const template = state.data[0] ? blankFrom(state.data[0]) : {};
  if (template && typeof template === "object") {
    template.id = nextId(state.data);
    template.created_at = new Date().toISOString();
    template.updated_at = new Date().toISOString();
  }
  state.data.push(template);
  state.selectedIndex = state.data.length - 1;
  render();
}

function deleteEntry() {
  const item = activeItem();
  if (!confirm(`Delete "${titleFor(item)}"?`)) return;
  state.data.splice(state.selectedIndex, 1);
  state.selectedIndex = Math.max(0, state.selectedIndex - 1);
  render();
}

editorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus("Saving JSON...");
    await api(`/api/content/${state.currentType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: state.data }),
    });
    setStatus("Saved. Regenerate to preview.", "good");
    appendLog(`Saved ${labels[state.currentType]}.`);
  } catch (error) {
    setStatus("Save failed", "bad");
    appendLog(error.message);
  }
});

document.querySelector("#generateButton").addEventListener("click", async () => {
  setStatus("Regenerating site...");
  logPanel.textContent = "Running tools/generate-site.mjs...";
  try {
    const result = await api("/api/generate", { method: "POST" });
    appendLog(result.output);
    setStatus("Regenerated. Preview is ready.", "good");
  } catch (error) {
    setStatus("Generate failed", "bad");
    appendLog(error.message);
  }
});

document.querySelector("#clearLogButton").addEventListener("click", () => {
  logPanel.textContent = "";
});

async function init() {
  const result = await api("/api/types");
  state.types = result.types;
  await loadType(state.currentType);
}

init().catch((error) => {
  setStatus("Editor failed to start", "bad");
  appendLog(error.stack || error.message);
});
