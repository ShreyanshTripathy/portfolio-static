import { layout, layoutNextLine, prepare, prepareWithSegments } from "./vendor/pretext/layout.js";

const measuredWidths = new WeakMap();
const preparedTitles = new WeakMap();
const paragraphSources = new WeakMap();
const preparedParagraphs = new WeakMap();
const flowStates = new WeakMap();

function canvasFont(style) {
  return [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily]
    .filter(Boolean)
    .join(" ");
}

function numericLetterSpacing(style) {
  const value = Number.parseFloat(style.letterSpacing);
  return Number.isFinite(value) ? value : 0;
}

function cssLengthInPixels(element, property, fallback) {
  const raw = getComputedStyle(element).getPropertyValue(property).trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  if (raw.endsWith("rem")) {
    return value * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
  }
  if (raw.endsWith("em")) {
    return value * (Number.parseFloat(getComputedStyle(element).fontSize) || 16);
  }
  return value;
}

function measureTitle(element) {
  const width = element.clientWidth;
  if (width <= 0 || measuredWidths.get(element) === width) return;
  measuredWidths.set(element, width);

  const style = getComputedStyle(element);
  const text = element.textContent.trim();
  const font = canvasFont(style);
  const letterSpacing = numericLetterSpacing(style);
  const cacheKey = `${text}|${font}|${letterSpacing}`;
  let cached = preparedTitles.get(element);

  if (!cached || cached.key !== cacheKey) {
    cached = { key: cacheKey, value: prepare(text, font, { letterSpacing }) };
    preparedTitles.set(element, cached);
  }

  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.4;
  const result = layout(cached.value, width, lineHeight);
  element.dataset.pretextLines = String(result.lineCount);
  element.dataset.pretextDensity = result.lineCount > 3 ? "compact" : "normal";
}

function sourceFor(paragraph) {
  if (!paragraphSources.has(paragraph)) {
    paragraphSources.set(paragraph, paragraph.textContent.replace(/\s+/g, " ").trim());
  }
  return paragraphSources.get(paragraph);
}

function restoreParagraph(paragraph) {
  const source = sourceFor(paragraph);
  if (paragraph.textContent !== source || paragraph.querySelector("[data-pretext-line]")) {
    paragraph.textContent = source;
  }
}

function preparedFor(paragraph, style) {
  const text = sourceFor(paragraph);
  const font = canvasFont(style);
  const letterSpacing = numericLetterSpacing(style);
  const key = `${text}|${font}|${letterSpacing}`;
  let cached = preparedParagraphs.get(paragraph);
  if (!cached || cached.key !== key) {
    cached = {
      key,
      value: prepareWithSegments(text, font, { letterSpacing }),
    };
    preparedParagraphs.set(paragraph, cached);
  }
  return cached.value;
}

function renderParagraph(paragraph, availableWidth, startY, lineHeight) {
  const style = getComputedStyle(paragraph);
  const prepared = preparedFor(paragraph, style);
  const fragments = document.createDocumentFragment();
  const accessibleCopy = document.createElement("span");
  accessibleCopy.className = "sr-only";
  accessibleCopy.textContent = sourceFor(paragraph);
  fragments.append(accessibleCopy);

  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = startY;
  let guard = 0;

  while (guard < 500) {
    const width = Math.max(80, availableWidth(y));
    const line = layoutNextLine(prepared, cursor, width);
    if (!line) break;

    const visualLine = document.createElement("span");
    visualLine.dataset.pretextLine = "";
    visualLine.setAttribute("aria-hidden", "true");
    visualLine.style.width = `${width}px`;
    visualLine.textContent = line.text;
    fragments.append(visualLine);

    cursor = line.end;
    y += lineHeight;
    guard += 1;
  }

  paragraph.replaceChildren(fragments);
  return y;
}

function restoreFlow(flow) {
  flow.querySelectorAll(".editorial-flow__copy p").forEach(restoreParagraph);
  flow.classList.remove("is-pretext-enhanced");
  flow.style.removeProperty("min-height");
  flowStates.delete(flow);
}

function layoutFlow(flow) {
  const minWidth = Number.parseFloat(flow.dataset.pretextMinWidth || "680");
  if (flow.clientWidth < minWidth) {
    restoreFlow(flow);
    return;
  }

  const figure = flow.querySelector("[data-pretext-figure]");
  const copy = flow.querySelector(".editorial-flow__copy");
  const paragraphs = [...flow.querySelectorAll(".editorial-flow__copy p")];
  if (!figure || !copy || !paragraphs.length) return;

  paragraphs.forEach(sourceFor);
  flow.classList.add("is-pretext-enhanced");

  const flowWidth = flow.clientWidth;
  const figureRect = figure.getBoundingClientRect();
  const figureWidth = figureRect.width;
  const figureHeight = figureRect.height;
  const gap = cssLengthInPixels(flow, "--pretext-gap", 28);
  const paragraphGap = cssLengthInPixels(flow, "--pretext-paragraph-gap", 16);
  const firstStyle = getComputedStyle(paragraphs[0]);
  const lineHeight = Number.parseFloat(firstStyle.lineHeight) || Number.parseFloat(firstStyle.fontSize) * 1.65;
  const stateKey = [Math.round(flowWidth), Math.round(figureWidth), Math.round(figureHeight), lineHeight, canvasFont(firstStyle)].join("|");
  if (flowStates.get(flow) === stateKey) return;
  flowStates.set(flow, stateKey);

  const narrowWidth = Math.max(80, flowWidth - figureWidth - gap);
  const availableWidth = (y) => (y < figureHeight + gap ? narrowWidth : flowWidth);
  let y = 0;

  paragraphs.forEach((paragraph, index) => {
    if (index > 0) y += paragraphGap;
    y = renderParagraph(paragraph, availableWidth, y, lineHeight);
  });

  flow.style.minHeight = `${Math.ceil(Math.max(y, figureHeight))}px`;
}

const titleTargets = [...document.querySelectorAll("[data-pretext-measure]")];
const flows = [...document.querySelectorAll("[data-pretext-flow]")];

await document.fonts.ready;
titleTargets.forEach(measureTitle);
flows.forEach(layoutFlow);

const titleObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => measureTitle(entry.target));
});
titleTargets.forEach((target) => titleObserver.observe(target));

let resizeTimer = 0;
const scheduleFlowLayout = () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    flows.forEach(layoutFlow);
  }, 110);
};

const flowObserver = new ResizeObserver(scheduleFlowLayout);
flows.forEach((flow) => {
  flowObserver.observe(flow);
  const image = flow.querySelector("img");
  if (image && !image.complete) image.addEventListener("load", scheduleFlowLayout, { once: true });
});
window.addEventListener("resize", scheduleFlowLayout, { passive: true });
