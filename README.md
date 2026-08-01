# Shreyansh Tripathy Portfolio Static Site

This folder is the plain HTML/CSS/JS version of the portfolio. It is designed to deploy directly on GitHub Pages or Cloudflare Pages with no Django, no database, no Astro, no Keystatic, and no npm install.

## Structure

- `index.html` and route folders such as `projects/`, `experience/`, `skills/`, `certificates/`, and `contact/` are the generated deployable site.
- `assets/css/styles.css` is copied from the original Django site stylesheet.
- `assets/js/site.js` is copied from the original Django site script.
- `assets/images/` contains the original project/profile images.
- `content/*.json` is the editable source of truth.
- `tools/generate-site.mjs` regenerates all HTML from the content JSON.

## Edit Content

Edit the relevant file in `content/`:

- `profile.json`
- `skills.json`
- `education.json`
- `internships.json`
- `projects.json`
- `courses.json`
- `certificates.json`
- `resume.json`

Keep field names unchanged because the generator expects the migrated Django model fields.

## Local Content Editor

You can also edit portfolio content through a local-only web editor. It does not run on GitHub Pages and is not linked from the public site.

Start it from this repository root:

```powershell
node tools/editor/server.mjs
```

Then open:

```text
http://localhost:4321
```

Use the sidebar to edit Profile, Skills, Education, Experience, Projects, Coursework, Certificates, Resume, and Timeline. Click **Save JSON** after changing a section. Use **Regenerate site** to run `tools/generate-site.mjs`, then open **Preview** to check the generated pages at `/preview/`.

Image upload fields copy selected files into `assets/images/` with a hash in the filename, then store the generated filename/path in the matching JSON field. After you are happy with the preview, commit the changed `content/*.json`, `assets/images/*`, and regenerated HTML files.

## Regenerate HTML

Run from the repository root:

```powershell
node portfolio-static/tools/generate-site.mjs
```

If `node` is not on PATH, use any available Node binary to run the same file. No packages are required.

## Deploy

GitHub Pages:

- Source: deploy from branch
- Branch: `main`
- Folder: `portfolio-static/` if supported, or move/copy this folder into a dedicated repository root

Cloudflare Pages:

- Build command: leave empty
- Output directory: `portfolio-static`

After every content edit, regenerate the HTML and commit the changed `content/*.json` plus generated `.html` files.
