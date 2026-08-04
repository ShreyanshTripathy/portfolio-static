import {
  buildColumns,
  buildExperienceEntries,
  buildSkillColumns,
  buildSkillGroups,
  buildSkillSummaryGroups,
  buildTimelineEntries,
  certificateItem,
  escapeAttr,
  escapeHtml,
  experienceEntry,
  formatDateRange,
  formatMonthYear,
  imageUrl,
  layout,
  pagePrefix,
  paragraphs,
  projectCard,
  skillCategory as siteSkillCategory,
  techStackList,
  truncate,
} from "./site.mjs";

export function homePage(data) {
  const { profile, resume, skills, education, internships, projects, certificates } = data;
  const skillColumns = buildSkillColumns(buildSkillSummaryGroups(buildSkillGroups(skills)));
  const masters = education.filter((item) => item.type === "masters");
  const bachelors = education.filter((item) => item.type === "bachelors");
  const experienceEntries = buildExperienceEntries(internships);
  const featuredProjects = projects.filter((project) => project.featured).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).slice(0, 3);
  const certificateColumns = buildColumns(certificates.slice(0, 4), 2);
  const timeline = buildTimelineEntries(education, internships, featuredProjects);
  const profileFigure = profile.figure || { src: "profile.jpg", alt: profile.name || "Portfolio profile", caption: "Profile portrait" };
  const keywords = profile.keywords || ["applied physics", "experimental systems", "simulation"];

  const educationCard = (item) => `<a href="education/${escapeAttr(item.slug)}/" class="editorial-entry editorial-education-entry block px-1 py-5">
    <div class="flex items-start justify-between gap-4">
      <div><p class="font-semibold">${escapeHtml(item.degree)}</p><p class="mt-1 text-sm text-sand-900/70">${escapeHtml(item.institution)}</p></div>
      <span class="text-sm text-sand-900/55">${item.courses?.length || 0} courses</span>
    </div>
    <p class="mt-2 text-sm text-sand-900/55">${formatDateRange(item.start_date, item.end_date)}</p>
    ${item.description ? `<p class="mt-3 text-sm leading-6 text-sand-900/70">${escapeHtml(item.description)}</p>` : ""}
    ${item.type === "bachelors" ? `<span class="mt-4 inline-block text-sm font-semibold text-sand-700">Open coursework</span>` : ""}
  </a>`;

  return layout({
    title: profile.name,
    metaTitle: profile.name,
    metaDescription: profile.headline,
    profile,
    depth: 0,
    content: `<div class="home-page"><section id="about" class="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20">
  <div class="editorial-hero reveal">
    <div class="editorial-hero__header">
      <p class="eyebrow">Personal field log / Physics · Systems · Code</p>
      <h2 class="mt-4 section-title max-w-3xl">${escapeHtml(profile.name)}</h2>
      <p class="home-dream-line">I build to understand what could exist.</p>
    </div>
    <div class="hero-intro-row">
      <div class="hero-intro-copy">
        <p class="hero-abstract">${escapeHtml(profile.bio)}</p>
        <p class="editorial-keywords"><span>keywords:</span> ${keywords.map(escapeHtml).join(", ")}</p>
        <div class="hero-actions flex flex-wrap gap-3">
          ${resume?.is_active && resume?.file ? `<a href="${escapeAttr(resume.file)}" class="rounded-full bg-sand-900 px-5 py-3 text-sm font-semibold text-sand-50 transition hover:bg-sand-700">Download resume</a>` : ""}
          <a href="projects/" class="rounded-full border border-sand-900/15 px-5 py-3 text-sm font-semibold text-sand-900">Browse projects</a>
          ${profile.github ? `<a href="${escapeAttr(profile.github)}" target="_blank" rel="noreferrer" class="rounded-full border border-sand-900/15 px-5 py-3 text-sm font-semibold text-sand-900">GitHub</a>` : ""}
        </div>
      </div>
      <figure class="hero-figure profile-figure">
        <div class="figure-frame overflow-hidden">
          <img src="assets/images/${escapeAttr(profileFigure.src)}" alt="${escapeAttr(profileFigure.alt || profile.name || "Portfolio profile")}" loading="eager" decoding="async" fetchpriority="high">
        </div>
        <figcaption>Fig. 0 - ${escapeHtml(profileFigure.caption || "Profile figure")}</figcaption>
      </figure>
    </div>
  </div>
</section>
<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  <div class="editorial-section reveal">
    <div class="max-w-3xl"><p class="eyebrow">Skills</p><h3 class="section-title mt-4">Skill Matrix</h3><p class="mt-4 text-base leading-7 text-sand-900/70">A focused blend of physics, computation, and engineering applied to real-world problems.</p></div>
    ${skillColumns.length ? `<div class="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-2">${skillColumns.map((column) => `<div class="space-y-8">${column.map((group) => siteSkillCategory(group, true)).join("")}</div>`).join("")}</div><div class="mt-6 flex justify-start"><a href="skills/" class="rounded-full border border-sand-900/10 bg-white/55 px-5 py-3 text-sm font-semibold text-sand-900 transition hover:border-sand-900/20 hover:bg-white/80">View all skills</a></div>` : `<div class="mt-8 rounded-[1.4rem] border border-dashed border-sand-900/10 p-6 text-sm text-sand-900/70">Add skills in the admin dashboard to populate this section.</div>`}
  </div>
</section>
<section id="education" class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
  <div class="grid gap-8 xl:grid-cols-2">
    <div class="editorial-section reveal">
      <p class="eyebrow">Education</p><h3 class="section-title mt-4">Academic foundation</h3>
      <div class="mt-8 space-y-8">
        <div><h4 class="text-sm uppercase tracking-[0.22em] text-sand-900/45">Masters</h4><div class="mt-4 space-y-4">${masters.length ? masters.map(educationCard).join("") : `<p class="text-sm text-sand-900/65">No masters record added yet.</p>`}</div></div>
        <div><h4 class="text-sm uppercase tracking-[0.22em] text-sand-900/45">Bachelors</h4><div class="mt-4 space-y-4">${bachelors.length ? bachelors.map(educationCard).join("") : `<p class="text-sm text-sand-900/65">No bachelors record added yet.</p>`}</div></div>
      </div>
    </div>
    <div class="editorial-section reveal">
      <div class="max-w-2xl"><p class="eyebrow">Experience</p><h3 class="section-title mt-4">Applied Experience</h3><p class="mt-4 text-base leading-7 text-sand-900/70">Hands-on experience applying physics, computation, and engineering in real-world settings.</p></div>
      ${experienceEntries.length ? `<div class="timeline-scroll-shell mt-8 is-at-top" data-scroll-fade><div class="timeline-scroll pr-1" data-timeline-scroll><div class="space-y-5 pb-2">${experienceEntries.map((entry) => experienceEntry(entry, 0, "h4")).join("")}</div></div></div><div class="mt-6 flex justify-start"><a href="experience/" class="rounded-full border border-sand-900/10 bg-white/55 px-5 py-3 text-sm font-semibold text-sand-900 transition hover:border-sand-900/20 hover:bg-white/80">View all experience</a></div>` : `<div class="mt-8 rounded-[1.4rem] border border-dashed border-sand-900/10 p-6 text-sm text-sand-900/70">Add internships in admin to populate this section.</div>`}
    </div>
  </div>
</section>
<section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
  <div class="editorial-section reveal">
    <div class="max-w-3xl"><p class="eyebrow">Certificates</p><h3 class="section-title mt-4">Accolades and Achievements</h3><p class="mt-4 text-base leading-7 text-sand-900/70">Recognition of skills and accomplishments across various domains.</p></div>
    ${certificateColumns.length ? `<div class="mt-10 grid gap-x-12 gap-y-8 lg:grid-cols-2">${certificateColumns.map((column) => `<div class="space-y-4">${column.map(certificateItem).join("")}</div>`).join("")}</div><div class="mt-8 flex justify-start"><a href="certificates/" class="rounded-full border border-sand-900/10 bg-white/55 px-5 py-3 text-sm font-semibold text-sand-900 transition hover:border-sand-900/20 hover:bg-white/80">View all certificates</a></div>` : `<div class="mt-10 rounded-[1.4rem] border border-dashed border-sand-900/10 p-6 text-sm text-sand-900/70">Add certificates in admin to populate this section.</div>`}
  </div>
</section>
<section id="projects" class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
  <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div class="max-w-2xl"><p class="eyebrow">Projects</p><h3 class="section-title mt-4">Research and build work</h3><p class="mt-4 max-w-2xl text-base leading-7 text-sand-900/70">Experiments, simulations, prototypes, and the lessons that came with them.</p></div><a href="projects/" class="rounded-full bg-sand-900 px-5 py-3 text-sm font-semibold text-sand-50">View all projects</a></div>
  <div class="editorial-list mt-10">${featuredProjects.length ? featuredProjects.map((project) => projectCard(project, 0, true)).join("") : `<div class="editorial-empty text-sand-900/70">Add featured projects in admin to populate this section.</div>`}</div>
</section>
<section id="timeline" class="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
  <div class="timeline-panel editorial-section reveal">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><p class="eyebrow">Journey</p><p class="text-xs uppercase tracking-[0.18em] text-sand-900/45">A chronological view of my academic and professional growth.</p></div>
    ${timeline.length ? `<div class="timeline-strip-shell timeline-strip-shell--journey" data-horizontal-timeline data-horizontal-timeline-auto="false"><div class="timeline-controls" aria-label="Journey controls"><button type="button" class="timeline-control" data-horizontal-timeline-prev aria-label="Scroll journey backward">&larr;</button><button type="button" class="timeline-control" data-horizontal-timeline-next aria-label="Scroll journey forward">&rarr;</button></div><div class="timeline-strip" data-horizontal-timeline-strip>${timeline.map((entry) => `<article class="timeline-chip${entry.is_current ? " is-current" : ""}"><p>${escapeHtml(entry.kind_label)}</p><time datetime="${escapeAttr(entry.date)}">${formatMonthYear(entry.date)}</time><h4>${escapeHtml(entry.title)}</h4></article>`).join("")}</div><div class="timeline-position" aria-hidden="true"><span data-horizontal-timeline-marker></span></div></div>` : `<div class="mt-4 border border-dashed border-sand-900/10 p-4 text-sm text-sand-900/68">Timeline items appear automatically when education, internships, or featured projects are added.</div>`}
  </div>
</section></div>`,
  });
}

export function skillsPage(data) {
  const skillColumns = buildSkillColumns(buildSkillGroups(data.skills));
  return layout({ title: "Skills", metaTitle: `Skills | ${data.profile.name}`, metaDescription: "Explore technical and research skills in this portfolio.", profile: data.profile, active: "skills", depth: 1, content: `<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><nav class="text-sm text-sand-900/55"><a href="../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span><span>Skills</span></nav><div class="mt-6 glass rounded-[2rem] p-8 sm:p-10"><div class="max-w-3xl"><p class="eyebrow">Skills</p><h2 class="section-title mt-4">Full technical profile.</h2><p class="mt-4 text-base leading-7 text-sand-900/70">My evergrowing list of technical proficiencies and areas of expertise.</p></div>${skillColumns.length ? `<div class="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-2">${skillColumns.map((column) => `<div class="space-y-10">${column.map((group) => siteSkillCategory(group)).join("")}</div>`).join("")}</div>` : `<div class="mt-10 rounded-[1.4rem] border border-dashed border-sand-900/10 p-6 text-sm text-sand-900/70">Add skills in the admin dashboard to populate this page.</div>`}</div></section>` });
}

export function certificatesPage(data) {
  const columns = buildColumns(data.certificates, 2);
  return layout({ title: "Certificates", metaTitle: `Certificates | ${data.profile.name}`, metaDescription: `Academic and professional certificates earned by ${data.profile.name}.`, profile: data.profile, active: "certificates", depth: 1, content: `<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><nav class="text-sm text-sand-900/55"><a href="../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span><span>Certificates</span></nav><div class="mt-6 glass rounded-[2rem] p-8 sm:p-10"><div class="max-w-3xl"><p class="eyebrow">Certificates</p><h2 class="section-title mt-4">Full credentials archive.</h2><p class="mt-4 text-base leading-7 text-sand-900/70">These are all the certificates I've earned, from industry-recognized credentials to academic achievements.</p></div>${columns.length ? `<div class="mt-10 grid gap-x-12 gap-y-8 lg:grid-cols-2">${columns.map((column) => `<div class="space-y-4">${column.map(certificateItem).join("")}</div>`).join("")}</div>` : `<div class="mt-10 rounded-[1.4rem] border border-dashed border-sand-900/10 p-6 text-sm text-sand-900/70">Add certificates in admin to populate this page.</div>`}</div></section>` });
}

export function contactPage(data) {
  const profile = data.profile;
  return layout({ title: "Contact", metaTitle: `Contact | ${profile.name}`, metaDescription: `Contact ${profile.name} for research, engineering, and collaboration opportunities.`, profile, active: "contact", depth: 1, content: `<section class="contact-page mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"><div class="glass rounded-[2rem] p-8 sm:p-10"><p class="eyebrow">Contact</p><h2 class="section-title contact-title mt-4">Open to research, engineering, and collaboration.</h2><p class="mt-5 max-w-2xl text-base leading-8 text-sand-900/72">Contact me via email or connect with me on LinkedIn or GitHub. I'm always open to discussing new projects, research opportunities, or potential collaborations. Whether you're interested in my work, have a question, or just want to say hello, feel free to reach out!</p></div><div class="glass rounded-[2rem] p-8"><dl class="space-y-6 text-sm"><div><dt class="uppercase tracking-[0.18em] text-sand-900/45">Email</dt><dd class="mt-2 text-base"><a href="mailto:${escapeAttr(profile.email)}" class="text-sand-900">${escapeHtml(profile.email)}</a></dd></div>${profile.location ? `<div><dt class="uppercase tracking-[0.18em] text-sand-900/45">Location</dt><dd class="mt-2 text-base text-sand-900">${escapeHtml(profile.location)}</dd></div>` : ""}${profile.linkedin ? `<div><dt class="uppercase tracking-[0.18em] text-sand-900/45">LinkedIn</dt><dd class="mt-2 text-base"><a href="${escapeAttr(profile.linkedin)}" target="_blank" rel="noreferrer" class="text-blue-600 underline underline-offset-4 hover:text-blue-800 transition">Professional profile ↗</a></dd></div>` : ""}${profile.github ? `<div><dt class="uppercase tracking-[0.18em] text-sand-900/45">GitHub</dt><dd class="mt-2 text-base"><a href="${escapeAttr(profile.github)}" target="_blank" rel="noreferrer" class="text-blue-600 underline underline-offset-4 hover:text-blue-800 transition">Code repositories ↗</a></dd></div>` : ""}</dl></div></div></section>` });
}

export function projectsPage(data) {
  const availableTech = [...new Set(data.projects.flatMap(techStackList))].sort((a, b) => a.localeCompare(b));
  return layout({ title: "Projects", metaTitle: `Projects | ${data.profile.name}`, metaDescription: `Browse research and build projects by ${data.profile.name}.`, profile: data.profile, active: "projects", depth: 1, content: `<section class="editorial-index mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><nav class="flex flex-wrap items-center gap-y-2 text-sm text-sand-900/55"><a href="../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span><span>Projects</span></nav><div class="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p class="eyebrow">Projects</p><h2 class="section-title mt-4">Full research and build archive</h2><p class="mt-4 max-w-2xl text-base leading-7 text-sand-900/70">These are all the projects I've worked on, from concept to completion or failure.</p></div><form method="get" class="editorial-filter flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-2xl lg:items-center" data-project-filter-form><input type="text" name="q" placeholder="Search projects" class="w-full rounded-full border-sand-900/10 bg-white/70 px-4 py-3 text-sm sm:min-w-[16rem] sm:flex-1" data-project-search><select name="tech" class="w-full rounded-full border-sand-900/10 bg-white/70 px-4 py-3 text-sm sm:w-auto" data-project-tech-filter><option value="">All technologies</option>${availableTech.map((tech) => `<option value="${escapeAttr(tech)}">${escapeHtml(tech)}</option>`).join("")}</select><button type="submit" class="w-full rounded-full bg-sand-900 px-5 py-3 text-sm font-semibold text-sand-50 sm:w-auto">Search</button></form></div><p class="mt-5 hidden text-sm text-sand-900/60" data-project-results></p><div class="editorial-list mt-10" data-project-grid>${data.projects.map((project) => projectCard(project, 1, false, true)).join("")}<div class="editorial-empty hidden text-sand-900/70" data-project-empty>No projects matched the current search. Try a different keyword or clear the technology filter.</div></div></section>${projectFilterScript()}` });
}

function projectFilterScript() {
  return `<script>(()=>{const form=document.querySelector("[data-project-filter-form]"),searchInput=document.querySelector("[data-project-search]"),techSelect=document.querySelector("[data-project-tech-filter]"),resultLine=document.querySelector("[data-project-results]"),emptyState=document.querySelector("[data-project-empty]"),cards=[...document.querySelectorAll("[data-project-card]")];if(!form||!searchInput||!techSelect||!resultLine)return;const sync=()=>{const params=new URLSearchParams(window.location.search);searchInput.value=params.get("q")||"";techSelect.value=params.get("tech")||""};const apply=()=>{const query=searchInput.value.trim().toLowerCase(),tech=techSelect.value.trim().toLowerCase();let visibleCount=0;cards.forEach(card=>{const text=card.dataset.projectText||"",techList=card.dataset.projectTech||"",visible=(!query||text.includes(query))&&(!tech||techList.split("|").includes(tech));card.hidden=!visible;if(visible)visibleCount+=1});const hasFilter=Boolean(query||tech);resultLine.classList.toggle("hidden",!hasFilter);emptyState?.classList.toggle("hidden",!hasFilter||visibleCount>0);if(hasFilter){const pieces=[\`Showing \${visibleCount} result\${visibleCount===1?"":"s"}\`];if(query)pieces.push(\`for "\${searchInput.value.trim()}"\`);if(tech)pieces.push(\`in \${techSelect.value}\`);resultLine.textContent=\`\${pieces.join(" ")}.\`}};form.addEventListener("submit",event=>{event.preventDefault();const url=new URL(window.location.href),query=searchInput.value.trim(),tech=techSelect.value.trim();query?url.searchParams.set("q",query):url.searchParams.delete("q");tech?url.searchParams.set("tech",tech):url.searchParams.delete("tech");window.history.replaceState({},"",url);apply()});techSelect.addEventListener("change",()=>form.requestSubmit());sync();apply()})();</script>`;
}

function projectGallery(images, project) {
  const count = images.length;
  const countLabel = `${count} ${count === 1 ? "figure" : "figures"}`;
  return `<section class="project-gallery glass rounded-[1.8rem] p-6" data-project-gallery data-gallery-count="${count}" data-gallery-expanded="false">
  <div class="project-gallery__header">
    <div><p class="eyebrow">Gallery</p><h3>Project images</h3><p class="project-gallery__count">${countLabel}</p></div>
    <div class="project-gallery__actions">
      ${count > 1 ? `<div class="project-gallery__arrows" aria-label="Gallery scroll controls"><button type="button" data-gallery-scroll-prev aria-label="Scroll gallery backward">&larr;</button><button type="button" data-gallery-scroll-next aria-label="Scroll gallery forward">&rarr;</button></div>` : ""}
      ${count > 3 ? `<button type="button" class="project-gallery__toggle" data-gallery-toggle aria-expanded="false">View all ${count}</button>` : ""}
    </div>
  </div>
  <div class="project-gallery__viewport" data-gallery-scroll${count > 1 ? ` tabindex="0" aria-label="Scrollable project image gallery"` : ""}>
    <div class="project-gallery__track">${images.map((image) => `<button type="button" class="project-image project-gallery__item" data-gallery-item data-image-src="${escapeAttr(image.display_url)}" data-image-caption="${escapeAttr(image.caption || project.title)}"><img src="${escapeAttr(image.display_url)}" alt="${escapeAttr(image.caption || project.title)}" loading="lazy" decoding="async"></button>`).join("")}</div>
  </div>
  <p class="project-gallery__hint">${count > 1 ? "Scroll to explore. " : ""}Select an image to enlarge.</p>
</section>`;
}

export function projectDetailPage(data, project) {
  const images = (project.images || []).map((image) => ({ ...image, display_url: imageUrl(image, 2) })).filter((image) => image.display_url);
  const team = project.team_members || [];
  return layout({ title: project.title, metaTitle: `${project.title} | ${data.profile.name}`, metaDescription: project.summary || truncate(project.description, 155), profile: data.profile, active: "projects", depth: 2, content: `<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><nav class="flex flex-wrap items-center gap-y-2 text-sm text-sand-900/55"><a href="../../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span><a href="../" class="hover:text-sand-900">Projects</a><span class="mx-2">/</span><span>${escapeHtml(project.title)}</span></nav><div class="mt-6 glass rounded-[2rem] p-8 sm:p-10"><div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"><div class="max-w-4xl"><p class="eyebrow">Project</p><h2 class="section-title mt-4 max-w-4xl">${escapeHtml(project.title)}</h2></div>${project.github_link ? `<a href="${escapeAttr(project.github_link)}" target="_blank" rel="noreferrer" class="w-fit rounded-full bg-sand-900 px-5 py-3 text-sm font-semibold text-sand-50">View repository</a>` : ""}</div>${project.summary ? `<p class="mt-6 max-w-3xl text-lg leading-8 text-sand-900/70">${escapeHtml(project.summary)}</p>` : ""}<div class="prose prose-stone prose-portfolio mt-8 max-w-none">${paragraphs(project.description)}</div><div class="mt-8 flex flex-wrap gap-2">${techStackList(project).map((tech) => `<span class="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sand-700">${escapeHtml(tech)}</span>`).join("")}</div></div>${images.length || team.length ? `<div class="mt-8 ${images.length && team.length ? "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]" : "space-y-6"}">${images.length ? projectGallery(images, project) : ""}${team.length ? `<section class="glass rounded-[1.8rem] p-6"><p class="eyebrow">Team</p><h3 class="mt-2 text-xl font-semibold text-sand-900">Team members</h3><div class="mt-6 space-y-4">${team.map((member) => `<article class="rounded-[1.2rem] border border-sand-900/10 bg-white/35 px-4 py-4"><p class="font-semibold text-sand-900">${escapeHtml(member.name)}</p>${member.role ? `<p class="mt-1 text-sm text-sand-900/62">${escapeHtml(member.role)}</p>` : ""}</article>`).join("")}</div></section>` : ""}</div>` : ""}</section>` });
}

export function experiencePage(data) {
  const entries = buildExperienceEntries(data.internships);
  return layout({ title: "Experience", metaTitle: `Experience | ${data.profile.name}`, metaDescription: "Applied experience in research, computation, and engineering work.", profile: data.profile, active: "experience", depth: 1, content: `<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><nav class="flex flex-wrap items-center gap-y-2 text-sm text-sand-900/55"><a href="../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span><span>Experience</span></nav><div class="mt-6 glass rounded-[2rem] p-8 sm:p-10"><div class="max-w-3xl"><p class="eyebrow">Experience</p><h2 class="section-title mt-4">Applied Experience</h2><p class="mt-4 text-base leading-7 text-sand-900/70">Hands-on work applying physics, computation, and engineering in practical settings.</p></div>${entries.length ? `<div class="timeline-scroll-shell mt-8 is-at-top" data-scroll-fade><div class="timeline-scroll pr-1" data-timeline-scroll><div class="space-y-5 pb-2">${entries.map((entry) => experienceEntry(entry, 1)).join("")}</div></div></div>` : `<div class="mt-8 rounded-[1.4rem] border border-dashed border-sand-900/10 p-6 text-sm text-sand-900/70">Add internships in admin to populate this page.</div>`}</div></section>` });
}

export function experienceDetailPage(data, experience, previousExperience, nextExperience) {
  return layout({ title: experience.role, metaTitle: `${experience.role} | ${data.profile.name}`, metaDescription: truncate(experience.description, 155), profile: data.profile, active: "experience", depth: 2, content: `<section class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><nav class="flex flex-wrap items-center gap-y-2 text-sm text-sand-900/55"><a href="../../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span><a href="../" class="hover:text-sand-900">Experience</a><span class="mx-2">/</span><span>${escapeHtml(experience.role)}</span></nav><article class="mt-6 glass rounded-[2rem] p-8 sm:p-10"><p class="eyebrow">Experience</p><h2 class="section-title mt-4">${escapeHtml(experience.role)}</h2><div class="mt-5 flex flex-wrap items-center gap-3"><span class="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-sand-700">${escapeHtml(experience.company)}</span><span class="text-sm text-sand-900/60">${formatDateRange(experience.start_date, experience.end_date)}</span></div><div class="prose prose-stone mt-8 max-w-none">${paragraphs(experience.description)}</div>${previousExperience || nextExperience ? `<div class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-sand-900/10 pt-6"><div>${previousExperience ? `<a href="../${escapeAttr(previousExperience.slug)}/" class="rounded-full border border-sand-900/10 bg-white/55 px-4 py-2 text-sm font-semibold text-sand-900 transition hover:border-sand-900/20 hover:bg-white/80">← ${escapeHtml(previousExperience.role)}</a>` : ""}</div><div>${nextExperience ? `<a href="../${escapeAttr(nextExperience.slug)}/" class="rounded-full border border-sand-900/10 bg-white/55 px-4 py-2 text-sm font-semibold text-sand-900 transition hover:border-sand-900/20 hover:bg-white/80">${escapeHtml(nextExperience.role)} →</a>` : ""}</div></div>` : ""}<div class="mt-4"><a href="../" class="text-sm font-semibold text-sand-700 transition hover:text-sand-900">Back to all experience</a></div></article></section>` });
}

export function educationDetailPage(data, education) {
  return layout({ title: education.degree, metaTitle: `${education.degree} | ${data.profile.name}`, metaDescription: truncate(education.description || education.institution, 155), profile: data.profile, depth: 2, content: `<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><nav class="flex flex-wrap items-center gap-y-2 text-sm text-sand-900/55"><a href="../../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span><span>${escapeHtml(education.degree)}</span></nav><div class="mt-6 glass rounded-[2rem] p-8 sm:p-10"><p class="eyebrow">Education</p><div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h2 class="section-title">${escapeHtml(education.degree)}</h2><p class="mt-3 text-base text-sand-900/70">${escapeHtml(education.institution)}</p><p class="mt-1 text-sm text-sand-900/55">${formatDateRange(education.start_date, education.end_date)}</p></div><span class="w-fit rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-sand-700">${education.courses?.length || 0} courses</span></div>${education.description ? `<p class="mt-6 max-w-3xl text-base leading-7 text-sand-900/72">${escapeHtml(education.description)}</p>` : ""}</div><div class="mt-8 glass overflow-hidden rounded-[2rem]"><div class="border-b border-sand-900/10 px-6 py-5"><h3 class="text-xl font-semibold text-sand-900">Coursework</h3><p class="mt-2 text-sm text-sand-900/60">Each row opens a dedicated course page with the full subject details.</p></div><div class="overflow-x-auto"><table class="min-w-full text-left text-sm"><thead class="bg-sand-100/70 text-sand-900/70"><tr><th class="px-6 py-4 font-semibold">#</th><th class="px-6 py-4 font-semibold">Course Name</th><th class="px-6 py-4 font-semibold">Course Description</th><th class="px-6 py-4 font-semibold">Experiments</th></tr></thead><tbody>${education.courses?.length ? education.courses.map((course, index) => `<tr class="table-row-link border-t border-sand-900/10 transition hover:bg-white/60" data-row-link="../../coursework/${escapeAttr(course.slug)}/"><td class="px-6 py-4">${index + 1}</td><td class="px-6 py-4"><a href="../../coursework/${escapeAttr(course.slug)}/" class="font-semibold text-sand-900">${escapeHtml(course.title)}</a></td><td class="px-6 py-4 text-sand-900/70">${escapeHtml(truncate(course.description, 120))}</td><td class="px-6 py-4 text-sand-900/70">${course.experiments?.length || 0}</td></tr>`).join("") : `<tr><td colspan="4" class="px-6 py-8 text-sand-900/65">Add courses in admin to populate this table.</td></tr>`}</tbody></table></div></div></section>` });
}

export function courseDetailPage(data, course) {
  const education = course.education_entry;
  return layout({ title: course.title, metaTitle: `${course.title} | ${data.profile.name}`, metaDescription: truncate(course.description || course.additional_description, 155), profile: data.profile, depth: 2, content: `<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><nav class="flex flex-wrap items-center gap-y-2 text-sm text-sand-900/55"><a href="../../" class="hover:text-sand-900">Home</a><span class="mx-2">/</span>${education ? `<a href="../../education/${escapeAttr(education.slug)}/" class="hover:text-sand-900">${escapeHtml(education.degree)}</a><span class="mx-2">/</span>` : ""}<span>${escapeHtml(course.title)}</span></nav><div class="mt-6 glass rounded-[2rem] p-8 sm:p-10"><p class="eyebrow">Course</p><h2 class="section-title mt-4">${escapeHtml(course.title)}</h2>${course.description || course.additional_description ? `<div class="mt-6 max-w-4xl space-y-4">${course.description ? `<p class="text-base leading-8 text-sand-900/72">${escapeHtml(course.description)}</p>` : ""}${course.additional_description ? `<p class="text-base leading-8 text-sand-900/65">${escapeHtml(course.additional_description)}</p>` : ""}</div>` : ""}</div>${course.experiments?.length ? `<div class="mt-8 glass overflow-hidden rounded-[2rem]"><div class="border-b border-sand-900/10 px-6 py-5"><h3 class="text-xl font-semibold text-sand-900">Experiments</h3></div><div class="overflow-x-auto"><table class="min-w-full text-left text-sm"><thead class="bg-sand-100/70 text-sand-900/70"><tr><th class="px-6 py-4 font-semibold">Experiment</th><th class="px-6 py-4 font-semibold">Description</th></tr></thead><tbody>${course.experiments.map((experiment) => `<tr class="border-t border-sand-900/10 align-top"><td class="px-6 py-4 font-semibold text-sand-900">${escapeHtml(experiment.name)}</td><td class="px-6 py-4 text-sand-900/72">${experiment.objective || experiment.method || experiment.results ? `<div class="space-y-2">${experiment.objective ? `<p>${escapeHtml(experiment.objective)}</p>` : ""}${experiment.method ? `<p>${escapeHtml(experiment.method)}</p>` : ""}${experiment.results ? `<p>${escapeHtml(experiment.results)}</p>` : ""}</div>` : `<p class="text-sand-900/55">Details can be added in admin when available.</p>`}</td></tr>`).join("")}</tbody></table></div></div>` : ""}</section>` });
}

export function notFoundPage(data) {
  return layout({
    title: "Page not found",
    metaTitle: `Page not found | ${data.profile.name}`,
    metaDescription: "The requested portfolio page could not be found.",
    profile: data.profile,
    depth: 0,
    content: `<section class="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
  <div class="section-rule mb-10"><p class="eyebrow">404 / Missing Coordinate</p></div>
  <h1 class="section-title">Page not found</h1>
  <p class="mt-6 max-w-2xl text-base leading-8 text-sand-900/72">This route is not present in the static portfolio. Return to the index or use the masthead links to re-enter the archive.</p>
  <a href="./" class="mt-8 inline-block rounded-full border border-sand-900/15 px-5 py-3 text-sm font-semibold text-sand-900">Return home</a>
</section>`,
  });
}
