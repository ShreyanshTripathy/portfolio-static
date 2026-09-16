export const skillCategoryLabels = {
  programming: "Programming",
  tools: "Tools",
  research: "Research",
  communication: "Communication",
  other: "Other",
};

const skillCategoryOrder = ["programming", "tools", "research", "communication", "other"];
const assetVersion = "20260809-experience-dates-v11";

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function escapeAttr(value = "") {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

export function formatMonthYear(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatDateRange(start, end) {
  const startLabel = formatMonthYear(start);
  const endLabel = end ? formatMonthYear(end) : "Present";
  return startLabel ? `${startLabel} - ${endLabel}` : endLabel;
}

export function truncate(value = "", limit = 160) {
  const copy = String(value).replace(/\s+/g, " ").trim();
  if (copy.length <= limit) return copy;
  const shortened = copy.slice(0, limit).replace(/\s+\S*$/, "").trim();
  return `${shortened || copy.slice(0, limit).trim()}...`;
}

export function paragraphs(value = "", className = "") {
  return String(value)
    .split(/\r?\n\s*\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p${className ? ` class="${className}"` : ""}>${escapeHtml(item)}</p>`)
    .join("");
}

export function techStackList(project) {
  return String(project.tech_stack || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildColumns(items, columnCount = 2) {
  if (!items.length) return [];
  const columns = Array.from({ length: Math.min(columnCount, items.length) }, () => []);
  items.forEach((item, index) => columns[index % columns.length].push(item));
  return columns.filter((column) => column.length);
}

export function buildSkillGroups(skills) {
  return skillCategoryOrder
    .map((key) => ({
      key,
      label: skillCategoryLabels[key],
      items: skills.filter((skill) => skill.category === key),
    }))
    .filter((group) => group.items.length);
}

export function buildSkillSummaryGroups(groups, limit = 2) {
  return groups.map((group) => ({
    ...group,
    items: group.items.slice(0, limit),
    remaining_count: Math.max(group.items.length - limit, 0),
  }));
}

export function buildSkillColumns(groups) {
  if (!groups.length) return [];
  const columns = Array.from({ length: groups.length > 1 ? 2 : 1 }, () => ({ groups: [], weight: 0 }));
  [...groups]
    .sort((a, b) => b.items.length - a.items.length)
    .forEach((group) => {
      const column = columns.reduce((lightest, item) => (item.weight < lightest.weight ? item : lightest));
      column.groups.push(group);
      column.weight += Math.max(group.items.length, 1);
    });
  return columns.map((column) => column.groups).filter((column) => column.length);
}

export function imageUrl(image, depth) {
  const value = image?.image || image?.static_image_path || "";
  if (!value) return "";
  if (/^https?:\/\//.test(value)) return value;
  const clean = value.replaceAll("\\", "/").replace(/^static\/img\//, "").replace(/^img\//, "").replace(/^public\/images\//, "");
  return `${assetPrefix(depth)}/images/${clean}`;
}

export function assetPrefix(depth) {
  return depth === 0 ? "assets" : `${"../".repeat(depth)}assets`;
}

export function pagePrefix(depth) {
  return depth === 0 ? "./" : "../".repeat(depth);
}

function activeAttr(active, key) {
  return active === key ? ' data-active="true" aria-current="page"' : "";
}

export function layout({ title, metaTitle, metaDescription, profile, active = "", depth = 0, content }) {
  const assets = assetPrefix(depth);
  const root = pagePrefix(depth);
  const siteName = profile?.name || "Portfolio";
  const headline = profile?.headline || "Academic and professional portfolio";
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="description" content="${escapeAttr(metaDescription || headline)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeAttr(siteName)}">
  <meta property="og:title" content="${escapeAttr(metaTitle || title || siteName)}">
  <meta property="og:description" content="${escapeAttr(metaDescription || headline)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeAttr(metaTitle || title || siteName)}">
  <meta name="twitter:description" content="${escapeAttr(metaDescription || headline)}">
  <title>${escapeHtml(title || "Portfolio")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Recursive:CASL,CRSV,MONO,slnt,wght@0..1,0..1,0..1,-15..0,300..1000&display=swap">
  <script>
    (() => {
      const root = document.documentElement;
      try {
        const savedTheme = localStorage.getItem("portfolio-theme");
        const theme = savedTheme === "light" ? "light" : "dark";
        root.dataset.theme = theme;
        root.classList.toggle("dark", theme === "dark");
        root.style.colorScheme = theme;
      } catch (error) {
        root.dataset.theme = "dark";
      }

      try {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const shouldShowIntro = !reduceMotion && sessionStorage.getItem("seenIntro") !== "true";
        if (shouldShowIntro) {
          sessionStorage.setItem("seenIntro", "true");
          root.classList.add("intro-pending");
        }
      } catch (error) {
        root.classList.remove("intro-pending");
      }
    })();
  </script>
  <style>
    .splash-intro { display: none; }
    html.intro-pending body { overflow: hidden; }
    html.intro-pending .site-content { opacity: 0; }
    html.intro-pending .splash-intro {
      position: fixed;
      z-index: 100;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: var(--paper, #101214);
      color: var(--ink, #eceae2);
      opacity: 0;
    }
    html.intro-pending.intro-visible .splash-intro {
      opacity: 1;
      transition: opacity 520ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    html.intro-pending.intro-revealing .site-content {
      opacity: 1;
      transition: opacity 520ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    html.intro-pending.intro-revealing .splash-intro {
      opacity: 0;
      transition: opacity 500ms cubic-bezier(0.22, 1, 0.36, 1);
    }
  </style>
  <script src="https://cdn.tailwindcss.com?plugins=typography,forms"></script>
  <script>
    tailwind.config = {
      darkMode: "class",
      theme: { extend: { colors: { sand: { 50: "#f8f4ee", 100: "#efe7db", 200: "#dcc5aa", 700: "#6e4e2e", 900: "#221c18" } }, boxShadow: { warm: "0 24px 60px rgba(67, 47, 27, 0.08)" } } }
    }
  </script>
  <link rel="stylesheet" href="${assets}/css/styles.css?v=${assetVersion}">
</head>
<body class="shell antialiased">
  <div class="splash-intro" data-splash-intro aria-hidden="true">
    <div class="splash-intro__quotes">
      <div class="splash-intro__quote splash-intro__quote--primary">
        <p lang="hi">वरदान माँगूँगा नहीं।</p>
        <cite>Harivansh Rai Bachchan</cite>
      </div>
      <div class="splash-intro__quote splash-intro__quote--secondary">
        <p>A man can be destroyed but not defeated.</p>
        <cite>Ernest Hemingway</cite>
      </div>
    </div>
  </div>
  <div class="site-content" data-site-content>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <header class="site-masthead">
      <div class="site-masthead__frame">
        <div class="masthead-primary">
          <a href="${root}" class="masthead-id" aria-label="${escapeAttr(siteName)} — home">
            <span class="masthead-monogram" aria-hidden="true">ST</span>
            <span class="masthead-copy">
              <span class="masthead-name">${escapeHtml(siteName)}</span>
              <span class="masthead-role">Physics · Technology · Experiments</span>
            </span>
          </a>
          <button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false">
            <span class="theme-toggle__option">Dark</span>
            <span class="theme-toggle__option">Light</span>
            <span class="theme-toggle__thumb" aria-hidden="true"></span>
          </button>
        </div>
        <div class="masthead-secondary">
          <p class="masthead-register" aria-hidden="true"><span>Portfolio index</span><span>Vol. 2026</span></p>
          <button type="button" class="masthead-menu-toggle" data-menu-toggle aria-controls="primary-navigation" aria-expanded="false" hidden>Menu <span data-menu-state>Open</span></button>
          <nav id="primary-navigation" class="nav-scroll masthead-navigation" aria-label="Primary navigation">
            <a href="${root}#about" class="masthead-link" data-nav-link><span aria-hidden="true">01</span>About</a>
            <a href="${root}skills/" class="masthead-link" data-nav-link${activeAttr(active, "skills")}><span aria-hidden="true">02</span>Skills</a>
            <a href="${root}certificates/" class="masthead-link" data-nav-link${activeAttr(active, "certificates")}><span aria-hidden="true">03</span>Certificates</a>
            <a href="${root}projects/" class="masthead-link" data-nav-link${activeAttr(active, "projects")}><span aria-hidden="true">04</span>Projects</a>
            <a href="${root}experience/" class="masthead-link" data-nav-link${activeAttr(active, "experience")}><span aria-hidden="true">05</span>Experience</a>
            <a href="${root}#education" class="masthead-link" data-nav-link><span aria-hidden="true">06</span>Education</a>
            <a href="${root}#timeline" class="masthead-link" data-nav-link><span aria-hidden="true">07</span>Timeline</a>
            <a href="${root}contact/" class="masthead-link masthead-link--contact" data-nav-link${activeAttr(active, "contact")}><span aria-hidden="true">08</span>Contact</a>
          </nav>
        </div>
      </div>
    </header>
  </div>
  <main>${content}</main>
  <footer class="mx-auto mt-16 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
    <div class="glass flex flex-col gap-4 rounded-[2rem] px-6 py-8 text-sm text-sand-900/70 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="font-display text-xl text-sand-900">${escapeHtml(siteName)}</p>
        <p class="mt-1">Thank you for visiting!</p>
      </div>
      <div class="flex flex-wrap gap-4">
        <a href="${root}skills/" class="hover:text-sand-900">Skills</a>
        <a href="${root}certificates/" class="hover:text-sand-900">Certificates</a>
        <a href="${root}projects/" class="hover:text-sand-900">Projects</a>
        <a href="${root}experience/" class="hover:text-sand-900">Experience</a>
        <a href="${root}#education" class="hover:text-sand-900">Education</a>
        <a href="${root}contact/" class="hover:text-sand-900">Contact</a>
      </div>
    </div>
    <p class="footer-colophon">
      <span class="footer-colophon__quote"><span lang="hi">वरदान माँगूँगा नहीं।</span> <cite>—Shivmangal Singh ‘Suman’</cite></span>
      <span class="footer-colophon__separator" aria-hidden="true">/</span>
      <span class="footer-colophon__quote"><span>A man can be destroyed but not defeated.</span> <cite>— Ernest Hemingway</cite></span>
    </p>
  </footer>
  </div>
  <div class="lightbox fixed inset-0 z-50 bg-sand-900/85 px-4 py-6 sm:py-8" data-lightbox role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="lightbox-title" hidden>
    <h2 id="lightbox-title" class="sr-only">Project image viewer</h2>
    <div class="mx-auto flex h-full max-w-6xl flex-col gap-4 lg:flex-row lg:items-center" data-lightbox-dialog>
      <div class="order-2 flex justify-center gap-3 lg:order-1 lg:flex-col">
        <button class="rounded-full border border-white/20 px-4 py-3 text-white" data-lightbox-prev aria-label="Previous image">Prev</button>
        <button class="rounded-full border border-white/20 px-4 py-3 text-white" data-lightbox-next aria-label="Next image">Next</button>
        <button class="rounded-full border border-white/20 px-4 py-3 text-white" data-lightbox-close aria-label="Close lightbox">Close</button>
      </div>
      <div class="order-1 flex-1 overflow-hidden rounded-[2rem] bg-black/20 p-3 sm:p-4">
        <img class="mx-auto max-h-[80vh] w-auto rounded-[1.5rem] object-contain" src="" alt="Selected project image" data-lightbox-image>
        <p class="mt-4 text-center text-sm text-white/80" data-lightbox-caption></p>
      </div>
    </div>
  </div>
  <script>
    if (document.documentElement.classList.contains("intro-pending")) {
      window.__portfolioIntroReadyAt = performance.now();
      window.__portfolioIntroFallback = window.setTimeout(() => {
        const root = document.documentElement;
        root.classList.remove("intro-pending", "intro-visible", "intro-revealing");
        root.classList.add("intro-complete");
        const intro = document.querySelector("[data-splash-intro]");
        if (intro) intro.hidden = true;
      }, 3800);
    }
  </script>
  <script src="${assets}/js/site.js?v=${assetVersion}"></script>
  <script type="module" src="${assets}/js/pretext-layout.js?v=${assetVersion}"></script>
</body>
</html>
`;
}

export function skillItem(skill) {
  return `<article class="skill-line-item rounded-[1.1rem] px-1 py-1">
  <h4 class="text-sm font-semibold tracking-[0.01em] text-sand-900 sm:text-base">${escapeHtml(skill.name)}</h4>
  ${skill.highlight ? `<p class="mt-1 text-sm leading-5 text-sand-900/62">${escapeHtml(skill.highlight)}</p>` : ""}
</article>`;
}

export function skillCategory(group, summary = false) {
  return `<section class="skill-category-block">
  <p class="skill-group-label">${escapeHtml(group.label)}</p>
  <div class="${summary ? "mt-3.5 space-y-3" : "mt-4 space-y-4"}">${group.items.map(skillItem).join("")}</div>
  ${summary && group.remaining_count ? `<p class="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-sand-900/48">+ ${group.remaining_count} more in this category</p>` : ""}
</section>`;
}

export function certificateItem(certificate) {
  return `<article class="skill-line-item editorial-entry editorial-entry--certificate px-1 py-5">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h4 class="text-sm font-semibold tracking-[0.01em] text-sand-900 sm:text-base">${escapeHtml(certificate.title)}</h4>
      <p class="mt-1.5 text-sm leading-6 text-sand-900/62">${escapeHtml(certificate.issuer)}</p>
      ${certificate.credential_link ? `<a href="${escapeAttr(certificate.credential_link)}" target="_blank" rel="noreferrer" class="mt-2 inline-block text-sm font-medium text-sand-700">View credential</a>` : ""}
    </div>
    ${certificate.date ? `<span class="shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-sand-700/80">${formatMonthYear(certificate.date)}</span>` : ""}
  </div>
</article>`;
}

export function projectCard(project, depth, reveal = false, searchable = false) {
  const firstImage = (project.images || []).map((image) => ({ ...image, display_url: imageUrl(image, depth) })).find((image) => image.display_url);
  const tech = techStackList(project);
  const root = pagePrefix(depth);
  const searchText = [project.title, project.summary, project.description].join(" ").toLowerCase();
  return `<article class="paper-entry editorial-entry editorial-project${reveal ? " reveal" : ""}"${searchable ? ` data-project-card data-project-text="${escapeAttr(searchText)}" data-project-tech="${escapeAttr(tech.join("|").toLowerCase())}"` : ""}>
  <div class="editorial-project__body">
    <div class="editorial-entry__meta">
      <span>${project.start_date ? formatMonthYear(project.start_date) : "Field note"}</span>
      <span>${tech.length} ${tech.length === 1 ? "method" : "methods"}</span>
    </div>
    <h3 data-pretext-measure><a href="${root}projects/${escapeAttr(project.slug)}/">${escapeHtml(project.title)}</a></h3>
    ${project.summary ? `<p class="editorial-entry__abstract">${escapeHtml(project.summary)}</p>` : ""}
    <div class="editorial-tag-row">${tech.map((item) => `<span class="editorial-tag">${escapeHtml(item)}</span>`).join("")}</div>
    <div class="editorial-entry__links">
      <a href="${root}projects/${escapeAttr(project.slug)}/">${searchable ? "Open project" : "View project"} <span aria-hidden="true">-&gt;</span></a>
      ${project.github_link ? `<a href="${escapeAttr(project.github_link)}" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>` : ""}
    </div>
  </div>
  ${firstImage ? `<a href="${root}projects/${escapeAttr(project.slug)}/" class="project-image editorial-project__figure"><img src="${escapeAttr(firstImage.display_url)}" alt="${escapeAttr(firstImage.caption || project.title)}" loading="lazy" decoding="async"></a>` : ""}
</article>`;
}

function splitTimelineCopy(value = "", limit = 155) {
  const copy = String(value).replace(/\s+/g, " ").trim();
  if (copy.length <= limit) return { preview: copy, remainder: "", hasLongSummary: false };
  const preview = copy.slice(0, limit).replace(/\s+\S*$/, "").trim() || copy.slice(0, limit).trim();
  return { preview, remainder: copy.slice(preview.length).trim(), hasLongSummary: true };
}

function timelineDate(item) {
  return item.end_date || item.completion_date || item.start_date || "";
}

export function buildExperienceEntries(experience) {
  const entries = experience
    .map((item) => {
      const split = splitTimelineCopy(item.description);
      return {
        kind_label: "Experience",
        date: item.end_date || item.start_date,
        start_date: item.start_date,
        end_date: item.end_date,
        title: item.role,
        organization: item.company,
        summary_preview: split.preview,
        summary_remainder: split.remainder,
        has_long_summary: split.hasLongSummary,
        is_current: Boolean(item.start_date) && !item.end_date,
        detail_url: `experience/${item.slug}/`,
        is_focus: false,
      };
    })
    .sort((a, b) => new Date(`${b.date}T00:00:00Z`) - new Date(`${a.date}T00:00:00Z`));
  const focus = entries.find((entry) => entry.is_current) || entries[0];
  if (focus) focus.is_focus = true;
  return entries;
}

export function experienceEntry(entry, depth, heading = "h3") {
  const root = pagePrefix(depth);
  return `<article class="paper-entry experience-entry editorial-entry group relative px-1 py-6"${entry.is_current ? ' data-current="true"' : ""}${entry.is_focus ? " data-timeline-focus" : ""}>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <p class="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sand-700/70">${escapeHtml(entry.kind_label)}</p>
      <${heading} class="mt-2 text-lg font-semibold text-sand-900"><a href="${root}${escapeAttr(entry.detail_url)}" class="hover:text-sand-700">${escapeHtml(entry.title)}</a></${heading}>
      <p class="mt-1 text-sm text-sand-900/62">${escapeHtml(entry.organization)}</p>
    </div>
    <div class="flex items-center gap-2">
      ${entry.is_current ? `<span class="editorial-status">Current</span>` : ""}
      <span class="text-sm font-medium text-sand-900/48">${formatDateRange(entry.start_date, entry.end_date)}</span>
    </div>
  </div>
  ${entry.summary_preview ? `<div class="mt-4 text-sm leading-7 text-sand-900/72"><p>${escapeHtml(entry.summary_preview)}${entry.has_long_summary ? "..." : ""}</p></div>` : ""}
  <div class="mt-4"><a href="${root}${escapeAttr(entry.detail_url)}" class="text-sm font-semibold text-sand-700 transition hover:text-sand-900">Open experience -></a></div>
</article>`;
}

export function buildTimelineEntries(education, experience, projects) {
  const entries = [
    ...education.map((item) => ({ kind_label: "Education", date: timelineDate(item), title: item.degree, summary: item.description || "", image: item.figure || null, is_current: Boolean(item.start_date) && !item.end_date })),
    ...experience.map((item) => ({ kind_label: "Internship", date: item.end_date || item.start_date, title: item.role, summary: item.description || "", image: item.figure || null, is_current: Boolean(item.start_date) && !item.end_date })),
    ...projects.filter((item) => timelineDate(item)).map((item) => ({ kind_label: "Project", date: timelineDate(item), title: item.title, summary: item.summary || "", image: (item.images || [])[0] || null, is_current: false })),
  ].sort((a, b) => new Date(`${b.date}T00:00:00Z`) - new Date(`${a.date}T00:00:00Z`));
  return entries;
}
