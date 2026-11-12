# LearnDev — AI PRD Generator

A lightweight Single-Page Application to generate structured PRDs (Project Requirements Documents) using
Gemini 2.5 Flash / Pro (or any OpenAI-compatible endpoint via 9Router) with a pure client-side stack.

Tech: HTML5, Tailwind CSS (v3.4.19), Vanilla JS, Mermaid, SweetAlert2, Lucide icons.
PWA enabled via `sw.js` + `manifest.json`.

## Index

| # | Section |
|---|---------|
| 1 | Quick Start |
| 2 | Configuration (API Key, 9Router) |
| 3 | Prompt Structure & Token Saver |
| 4 | **Replika Mode** |
| 5 | Output Actions |
| 6 | History |
| 7 | Theme |
| 8 | Development / Cache Busting |

---

## 1. Quick Start

1. Open `index.html` in a modern browser (Chrome/Edge/Firefox) or run the local dev server:
   `node .bcode/serve.js`
2. Enter your Gemini API Key in the navbar (top-right) — or use the default **9Router / Local endpoint** path.
3. Type your app idea in the left panel and click **Generate PRD**.

## 2. Configuration

- **API Key**: `Gemini API --> Button` (top navbar). Stored in `localStorage: learndev_gemini_api_key`.
- **9Router URL**: Local endpoint (`:8899`) stores it to `learndev_9router_url`. If a 9Router URL is set, messages are sent as an OpenAI-compatible chat, with `Bearer` auth if the key exists.

Both settings are persistent in the browser.

## 3. Prompt Structure & Token Saver

The system prompt is built by `app.js / buildSystemPrompt()`. Every PRD contains:

1. Executive Summary & Problem Statement
2. Technical Architecture & Tech Stack
3. **Product Design Specification** (palette, typography, layout — forced)
4. User Stories & Requirements
5. **Database Schema (ERD)** — Mermaid `erDiagram`, no SQL-typed chars
6. API Endpoints Specification
7. Feature Details & User Stories (MoSCoW)
8. **AGENTS.md File Guide / Cursor Rules**
9. Timeline & Milestones / Appendix

**Token Saver & Optimization** section includes 3 flags:

- `Compress Prompt & Context` — sentence compression / reduced repetition.
- `Concise` — code notation.
- `Minimalist` — YAGNI-only architecture.

## 4. Replika Mode

Replika Mode turns the generator into a **recon-style app analyst**: give it a target app URL, and the prompt builds a structured discovery pass before synthesizing the PRD.

### Usage

1. **(Recommended) Toggle On** — `Replika Mode` toggle at the bottom of the config panel.
2. **Enter the Target URL** — e.g. `https://web.whatsapp.com` (the URL must be reachable by the AI agent; the target does not need to support scraping, the AI infers the app's structure from public info).
3. **Choose a Template** (optional):
   - `Clone` — full-feasibility PRD mirroring the target app (default).
   - `Swift MVP` — minimal set of core features for quick validation.
   - `Full Build` — full system blueprint incl. infra, migrations, and deployments.
4. Type your app idea (optional) and hit **Generate PRD**.

The prompt builder injects the **REPLICA RECON (ACTIVE)** block into the system prompt:

```
REPLICA MODE — TARGET APP RECON (ACTIVE):
Target App URL: https://web.whatsapp.com
Replika Template: clone

PHASE 1 — Discovery & Analysis (outline before writing):
1. Screen Inventory: identify and list all screens or pages visible or inferable.
2. User Flows: describe key user journeys from entry to completion.
3. Feature Matrix: catalog all features with priority.
4. Data Model: identify core entities and relationships.
5. UI Direction: visual style, layout patterns, tone, and components used.

PHASE 2 — Clone Synthesis: ...
```

### Rules

- URL validation happens on `input` / `blur` / `generate` — an invalid/empty URL aborts generation (error badge shown).
- `replikaMode`, `replikaUrl`, `replikaTemplate` are persisted to `localStorage` key `learndev_replika_settings`.
- History items keep `replikaMode` / `replikaUrl` / `replikaTemplate` fields; the History modal marks them with a **Replika** chip.
- Mermaid sanitizer (`cleanMermaidCode`) now preserves `namespace` blocks (`namespace replika { ... }`), so the AI-safe diagram namespace is rendered correctly.

## 5. Output Actions

After generation the toolbar shows:

- **Copy** — markdown to clipboard.
- **Download .pdf** — `html2pdf` / `style.css` print rules.
- **Download .doc** — Word document (`application/msword`).
- **Download AGENTS.md** — re-formatted extraction of Section 8 of the PRD, ready to paste into Cursor / Claude / Windsurf / OpenCode.
- **Share** — copy the markdown via `navigator.share`.
- **Mermaid Diagram** — expand/copy/download (SVG, PNG, JPG, fullscreen).

## 6. History

History is kept in `localStorage` under `learndev_prd_history`, max 20 items. The modal supports:

- Bulk select / select-all, delete selected, delete all (`Swal` inline confirm).
- Preview on load (resets the generation state).
- Item history rows are rendered with the title, date, and a Replika chip if applicable.

## 7. Theme

Pick `Dark (Emerald)` or `Light` from the top dropdown. `uiTheme` and the dark/light class change both the MIN/toolbar and the Mermaid config.

## 8. Development / Cache Busting

- `app.js` has a **cache buster** in `index.html`: `<script src="./app.js?v=49"></script>`. Every change to `app.js` must bump this number (v47 → v48 → v49...).
- `style.css` is a hand-compiled Tailwind v3.4.19 subset — new utilities must be appended manually.
- Nodes served by `node .bcode/serve.js` on port 8899.
- Mermaid `htmlLabels: false` + `sanitizeSvgForCanvas` are the only text-rendering paths to keep PNG/JPG export working.

## Lints / Tests

Located in `.bcode/`:

- `test_live_v48.cjs` — checks HTML/JS/CSS/prompt structure against the live file layout (14/14).
- `test_extract_full_prd_sections.cjs` — end-to-end download/AP context test (17/17).
- `test_prompt_sections.cjs` — section structure test (14/14).
- `test_subgraph_clean.cjs` — Mermaid subgraph normalization.
- `test_extract_real_source.cjs` — AGENTS.md extraction fidelity.

To run: `node .bcode/test_live_v48.cjs`.
