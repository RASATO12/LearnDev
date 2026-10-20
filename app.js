document.addEventListener('DOMContentLoaded', () => {
    // Utility Selector
    const el = (id) => document.getElementById(id);

    // DOM Elements
    const promptInput = el('promptInput');
    const aiProvider = el('aiProvider');
    const uiTheme = el('uiTheme');
    const uiThemeCustom = el('uiThemeCustom');
    const toggleCompress = el('toggle-compress');
    const toggleConcise = el('toggle-concise');
    const toggleMinimalist = el('toggle-minimalist');
    const btnGenerate = el('btnGenerate');
    const generateText = el('generateText');
    const generateSpinner = el('generateSpinner');

    const panelConfig = el('panel-config');
    const panelResult = el('panel-result');
    const mobTabConfig = el('mob-tab-config');
    const mobTabResult = el('mob-tab-result');

    const generationProgress = el('generationProgress');
    const previewActionBar = el('previewActionBar');
    const progressSteps = el('progressSteps');
    const progressBar = el('progressBar');
    const progressStepText = el('progressStepText');
    const skeletonLoader = el('skeletonLoader');
    const previewEmpty = el('previewEmpty');
    const prdPreview = el('prdPreview');

    const btnCopyPrd = el('btnCopyPrd');
    const btnDownloadPdf = el('btnDownloadPdf');
    const btnDownloadDocx = el('btnDownloadDocx');
    const btnDownloadAgents = el('btnDownloadAgents');
    const btnSharePrd = el('btnSharePrd');

    const btnApiKey = el('btnApiKey');
    const btnSettings = el('btnSettings');
    const btnHistory = el('btnHistory');
    const installBtn = el('installBtn');

    // State
    let generatedMarkdown = '';
    let deferredPrompt = null;
    const HISTORY_KEY = 'learndev_prd_history';
    const API_KEY_STORAGE = 'learndev_gemini_api_key';
    const NINEROUTER_URL_STORAGE = 'learndev_9router_url';
    const NINEROUTER_KEY_STORAGE = 'learndev_9router_key';

    // Initialize Libraries
    if (window.mermaid) {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            // htmlLabels: false -> label dirender sebagai SVG <text> murni, BUKAN
            // <foreignObject> (HTML inline). SVG yang mengandung foreignObject
            // selalu men-taint canvas saat dirasterisasi (Chrome/Firefox security),
            // sehingga export PNG/JPG mustahil dilakukan.
            flowchart: { htmlLabels: false },
            sequence: { htmlLabels: false },
            er: { htmlLabels: false },
            state: { htmlLabels: false },
            themeVariables: {
                darkMode: true,
                background: '#0f172a',
                fontFamily: '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14px',
                primaryColor: '#10b981',
                primaryTextColor: '#f8fafc',
                primaryBorderColor: '#334155',
                lineColor: '#38bdf8',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a'
            }
        });
    }

    // UI Theme toggle
    if (uiTheme) {
        uiTheme.addEventListener('change', () => {
            if (uiThemeCustom) {
                uiThemeCustom.classList.toggle('hidden', uiTheme.value !== 'custom');
                if (uiTheme.value === 'custom') uiThemeCustom.focus();
            }
        });
    }

    // Mobile Navigation Tabs
    const switchTab = (tab) => {
        const isMobile = window.innerWidth < 768;

        if (mobTabConfig && mobTabResult) {
            if (tab === 'config') {
                mobTabConfig.classList.add('border-emerald-500', 'text-emerald-400', 'bg-slate-800/80');
                mobTabConfig.classList.remove('border-transparent', 'text-slate-400');
                mobTabResult.classList.remove('border-emerald-500', 'text-emerald-400', 'bg-slate-800/80');
                mobTabResult.classList.add('border-transparent', 'text-slate-400');
            } else {
                mobTabResult.classList.add('border-emerald-500', 'text-emerald-400', 'bg-slate-800/80');
                mobTabResult.classList.remove('border-transparent', 'text-slate-400');
                mobTabConfig.classList.remove('border-emerald-500', 'text-emerald-400', 'bg-slate-800/80');
                mobTabConfig.classList.add('border-transparent', 'text-slate-400');
            }
        }

        if (!panelConfig || !panelResult) return;

        if (isMobile) {
            if (tab === 'config') {
                panelConfig.classList.remove('hidden');
                panelResult.classList.add('hidden');
            } else {
                panelConfig.classList.add('hidden');
                panelResult.classList.remove('hidden');
            }
        } else {
            panelConfig.classList.remove('hidden');
            panelResult.classList.remove('hidden');
        }
    };

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            if (panelConfig) panelConfig.classList.remove('hidden');
            if (panelResult) panelResult.classList.remove('hidden');
        } else {
            // Keep active tab state on resize to mobile
            const isResultActive = mobTabResult && mobTabResult.classList.contains('border-emerald-500');
            switchTab(isResultActive ? 'result' : 'config');
        }
    });

    if (mobTabConfig) mobTabConfig.addEventListener('click', () => switchTab('config'));
    if (mobTabResult) mobTabResult.addEventListener('click', () => switchTab('result'));

    // Initialize layout state immediately
    if (window.innerWidth < 768) {
        switchTab('config');
    } else {
        if (panelConfig) panelConfig.classList.remove('hidden');
        if (panelResult) panelResult.classList.remove('hidden');
    }

    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.classList.remove('hidden');
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') installBtn.classList.add('hidden');
            deferredPrompt = null;
        });
    }

    // Helper: Toast Notification
    const showToast = (icon, title) => {
        if (window.Swal) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: icon,
                title: title,
                showConfirmButton: false,
                timer: 2200,
                timerProgressBar: true,
                background: '#0f172a',
                color: '#f8fafc',
                iconColor: icon === 'success' ? '#10b981' : (icon === 'info' ? '#38bdf8' : '#f59e0b')
            });
        }
    };

    // Helper: Salin teks ke clipboard dengan fallback
    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (e) {
            // fallback
        }
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            const success = document.execCommand('copy');
            document.body.removeChild(ta);
            return success;
        } catch (err) {
            return false;
        }
    };

    // Helper: Action Toolbar Status
    const setActionButtonsState = (enabled) => {
        const buttons = [btnCopyPrd, btnDownloadPdf, btnDownloadDocx, btnDownloadAgents, btnSharePrd];
        buttons.forEach(btn => {
            if (!btn) return;
            btn.disabled = !enabled;
            if (enabled) {
                btn.classList.remove('opacity-40', 'cursor-not-allowed');
            } else {
                btn.classList.add('opacity-40', 'cursor-not-allowed');
            }
        });
    };

    setActionButtonsState(false);

    // Helper: Progress Step Visualizer
    const updateProgressStep = (stepNumber, label, percent) => {
        if (progressStepText) progressStepText.textContent = label;
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (generationProgress) {
            generationProgress.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> <span>${label} (${percent}%)</span>`;
        }
    };

    // Prompt Synthesis Builder
    const buildSystemPrompt = () => {
        let selectedTheme = uiTheme ? uiTheme.value : 'auto';
        if (selectedTheme === 'custom' && uiThemeCustom && uiThemeCustom.value.trim()) {
            selectedTheme = uiThemeCustom.value.trim();
        }

        const isCompress = toggleCompress && toggleCompress.checked;
        const isConcise = toggleConcise && toggleConcise.checked;
        const isMinimalist = toggleMinimalist && toggleMinimalist.checked;

        return `Anda adalah Principal Staff Software Architect & Lead Product Designer kelas dunia.
Tugas Anda adalah menghasilkan dokumen PRD (Project Requirements Document) teknis komprehensif, terstruktur tinggi, modular, dan siap diimplementasikan developer.

ATURAN STRUKTUR & INTEGRITAS (MUTLAK):
1. DILARANG KERAS menyertakan salam pembuka, kata pengantar, sapaan percakapan ("Tentu, saya akan...", "Halo!", "Sebagai seorang..."), atau catatan penutup.
2. Respons HARUS LANGSUNG DIMULAI pada karakter pertama dengan judul markdown level 1:
# [Nama Aplikasi / Produk] - Project Requirements Document (PRD)
3. Diagram Mermaid WAJIB menggunakan sintaks yang valid dan sederhana (flowchart TD atau erDiagram). Gunakan tanda kutip dua untuk teks yang mengandung tanda kurung atau karakter khusus (contoh: ["Frontend (Client)"], STORES ||--o{ USERS : "has"]).

STRUKTUR DOKUMEN:
# [Nama Aplikasi / Produk] - Project Requirements Document (PRD)

## 1. Executive Summary & Problem Statement
- Solusi, persona pengguna utama, dan value proposition.

## 2. Arsitektur Teknis & Tech Stack
- Frontend, Backend, Database, State Management, Auth, Hosting/Infra.
- Alasan pemilihan stack yang efisien.

## 3. Desain Sistem & Panduan UI/UX
- Tema Visual Terpilih: ${selectedTheme}
- Color Palette (Hex codes: Background, Surface, Primary Accent, Text, Border).
- Typography Scale & Komponen UI Inti.

## 4. Alur Kerja Sistem & Diagram Mermaid
Sertakan blok diagram Mermaid valid (arsitektur atau alur pengguna):
\`\`\`mermaid
flowchart TD
    A["Pengguna"] --> B["Frontend Client"]
    B --> C["API Gateway / Router"]
    C --> D[("Database Utama")]
\`\`\`

## 5. Skema Database (ERD / Relational / Collections)
Sertakan diagram ERD visual dengan sintaks Mermaid erDiagram. Tampilkan entitas utama, atribut tipe data kunci (PK/FK), dan relasi antar tabel. Contoh format yang valid:

\`\`\`mermaid
erDiagram
    STORES ||--o{ USERS : "has"
    STORES ||--o{ PRODUCTS : "contains"
    STORES ||--o{ CATEGORIES : "classifies"
    USERS ||--o{ ORDERS : "processes"
    PRODUCTS ||--o{ ORDER_ITEMS : "included in"
    ORDERS ||--|{ ORDER_ITEMS : "contains"

    STORES {
        string id PK "UUID"
        string name
        string address TEXT
        string currency "IDR"
        decimal tax_rate
        timestamp created_at
        timestamp updated_at
    }
    USERS {
        string id PK "UUID"
        string store_id FK
        string username UNIQUE
        string password_hash
        string role
        string full_name
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
\`\`\`

- Definisi tabel, kolom, tipe data, indeks, dan relasi utama.

## 6. Spesifikasi API Endpoints (RESTful / RPC)
- Method, Path, Request Body, Response Status, Auth Header.

## 7. Rincian Fitur & User Stories (MoSCoW Prioritization)
- Must Have, Should Have, Could Have.

## 8. Panduan File AGENTS.md / Cursor Rules
Sertakan blok panduan eksekusi untuk AI coding agent (Cursor, Windsurf, OpenCode) untuk proyek ini.

OPTIMASI TOKEN:
${isCompress ? '- Gunakan formulasi kalimat padat, informatif, hilangkan basa-basi.' : ''}
${isConcise ? '- Notasi kode ringkas dan representatif.' : ''}
${isMinimalist ? '- Utamakan prinsip YAGNI (You Aren\'t Gonna Need It) dan arsitektur modular yang ramping.' : ''}
`;
    };

    // AI API Call Handler
    const callAIEndpoint = async (userPrompt) => {
        const provider = aiProvider ? aiProvider.value : 'gemini-2.5-flash';
        const customUrl = localStorage.getItem(NINEROUTER_URL_STORAGE);
        const customKey = localStorage.getItem(NINEROUTER_KEY_STORAGE);
        const geminiKey = localStorage.getItem(API_KEY_STORAGE);

        // Option 1: 9Router / OpenAI-compatible endpoint
        if (customUrl) {
            const endpoint = customUrl.replace(/\/+$/, '') + '/chat/completions';
            const headers = { 'Content-Type': 'application/json' };
            if (customKey) headers['Authorization'] = `Bearer ${customKey}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: provider,
                    messages: [
                        { role: 'system', content: buildSystemPrompt() },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`9Router error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        }

        // Option 2: Direct Google Gemini API
        if (!geminiKey) {
            throw new Error('API Key belum diatur. Klik tombol API Key di navbar atas untuk memasukkan Gemini API Key.');
        }

        const modelName = provider.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;

        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `${buildSystemPrompt()}\n\nIDE PENGGUNA:\n${userPrompt}` }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192
            }
        };

        const fetchWithRetry = async (attempt = 1) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const msg = err.error?.message || `Google API error status ${res.status}`;
                // Retry on 503 (overloaded) up to 3 times with backoff
                if (res.status === 503 && attempt < 3) {
                    await new Promise(r => setTimeout(r, 1500 * attempt));
                    return fetchWithRetry(attempt + 1);
                }
                throw new Error(msg);
            }

            const json = await res.json();
            return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        };

        const result = await fetchWithRetry();
        return result;
    };

    // Helper: Clean & Sanitize Mermaid Syntax
    const cleanMermaidCode = (raw) => {
        let text = (raw || '').trim();
        text = text.replace(/^```mermaid\s*/i, '').replace(/```$/i, '').trim();

        const lines = text.split('\n');
        const cleanedLines = [];
        let inErdEntity = false;
        const definedNodeIds = new Set();
        const referencedNodeIds = new Set();
        const outputtedNodeIds = new Set();

        // Pass 1: collect all defined node IDs and referenced node IDs
        for (let rawLine of lines) {
            const tl = rawLine.trim();
            if (!tl) continue;

            // Node definitions: `ID[...]` `ID(...)` `ID{...}` `ID>...]` (anywhere in line, including edge lines)
            const nodeDefs = tl.matchAll(/(\w+)\s*[\[\(\{<]/g);
            for (const nd of nodeDefs) {
                definedNodeIds.add(nd[1]);
            }

            // Edge references: `A --> B` or `A -->|label| B` or `A --- B`
            const edgeRefs = tl.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*(-->|---)\s*/g);
            if (edgeRefs) {
                for (const ref of edgeRefs) {
                    const m = ref.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
                    if (m) referencedNodeIds.add(m[1]);
                }
            }

            // Edge targets: `--> B` or `-->|label| B` or `---> B`
            const edgeTargets = tl.match(/(-->|---)\s*\|?[^|]*\|?\s*([A-Za-z_][A-Za-z0-9_]*)/g);
            if (edgeTargets) {
                for (const t of edgeTargets) {
                    const m = t.match(/([A-Za-z_][A-Za-z0-9_]*)\s*$/);
                    if (m) referencedNodeIds.add(m[1]);
                }
            }
        }

        // Pass 2: sanitize lines, skip duplicate node defs, remove edges to undefined nodes
        for (let line of lines) {
            let l = line.trim();
            if (!l) continue;

            // Track erDiagram entity blocks
            if (/erDiagram/i.test(l)) inErdEntity = false;
            if (/^\w+\s*\{/.test(l)) { inErdEntity = true; cleanedLines.push('    ' + l); continue; }
            if (/^\}/.test(l)) { inErdEntity = false; cleanedLines.push('    ' + l); continue; }

            // Inside erDiagram entity block: keep only `type name`
            // Normalisasi tipe SQL berukuran: varchar(255) → varchar, decimal(5,2) → decimal
            // (tanda kurung ditolak parser Mermaid ERD)
            if (inErdEntity) {
                l = l.replace(/([A-Za-z_][\w]*)\s*\([^)]*\)/g, '$1');
                l = l.replace(/"[^"]*"/g, '');
                l = l.replace(/^\s*(\w+)\s+(\w+)\b.*$/, '$1 $2');
                cleanedLines.push('        ' + l);
                continue;
            }

            // Skip duplicate node definitions (keep first occurrence)
            const nodeDef = l.match(/^(\w+)\s*[\[\(\{<]/);
            if (nodeDef && !l.includes('-->') && !l.includes('---')) {
                const id = nodeDef[1];
                if (outputtedNodeIds.has(id)) {
                    continue;
                }
                outputtedNodeIds.add(id);
            }

            // Remove edges that reference undefined nodes (source or target not defined)
            const isEdge = l.includes('-->') || l.includes('---');
            if (isEdge) {
                const sourceMatch = l.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(-->|---)/);
                const targetMatch = l.match(/(-->|---)\s*\|?[^|]*\|?\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/);
                const src = sourceMatch ? sourceMatch[1] : null;
                const tgt = targetMatch ? targetMatch[targetMatch.length - 1] : null;
                if ((src && !definedNodeIds.has(src)) || (tgt && !definedNodeIds.has(tgt))) {
                    continue;
                }

                // Strip bracketed text from already-output node refs (avoid duplicate definitions; keep first occurrence with brackets)
                l = l.replace(/\b(\w+)\[[^\]]*\]/g, (match, id) => {
                    if (outputtedNodeIds.has(id)) return id;
                    outputtedNodeIds.add(id);
                    return match;
                });
            }

            // Fix arrow labels: Convert `A -- label --> B` to `A -->|"label"| B` (flowchart)
            l = l.replace(/\s+--\s+([^\n>]+?)\s+-->\s+/g, (match, label) => {
                const cleanLabel = label.replace(/"/g, '').trim();
                return ` -->|"${cleanLabel}"| `;
            });

            // Fix erDiagram relationship labels: `ENTITY ||--o{ ENTITY : label` -> `... : "label"`
            l = l.replace(/(\s*:\s*)([^"\n]+?)\s*$/g, (match, colon, label) => {
                const cleanLabel = label.replace(/"/g, '').trim();
                return `${colon}"${cleanLabel}"`;
            });

            // Fix bracket node text without quotes: e.g. A[Label Text / Info?] -> A["Label Text / Info?"]
            l = l.replace(/(\b[a-zA-Z0-9_]+)\[([^"\]\n]+?)\]/g, (match, id, content) => {
                if (outputtedNodeIds.has(id)) return match;
                return `${id}["${content.trim()}"]`;
            });

            // Fix curly bracket (decision) text without quotes: e.g. B{Status OK?} -> B{"Status OK?"}
            l = l.replace(/(\b[a-zA-Z0-9_]+)\{([^"\}\n]+?)\}/g, (match, id, content) => {
                return `${id}{"${content.trim()}"}`;
            });

            cleanedLines.push('    ' + l);
        }

        if (!cleanedLines.some(line => /^(flowchart|graph|sequenceDiagram|classDiagram|erDiagram)/i.test(line.trim()))) {
            cleanedLines.unshift('flowchart TD');
        } else {
            const firstIdx = cleanedLines.findIndex(line => /^(flowchart|graph|sequenceDiagram|classDiagram|erDiagram)/i.test(line.trim()));
            if (firstIdx !== -1) {
                cleanedLines[firstIdx] = cleanedLines[firstIdx].trim();
            }
        }

        return cleanedLines.join('\n');
    };

    // Render Pipeline
    const renderMarkdownPRD = async (rawMarkdown) => {
        // Clean markdown: strip conversational greetings / preambles before the first heading
        let cleanMarkdown = (rawMarkdown || '').trim();
        const firstHeadingIndex = cleanMarkdown.search(/^#\s+/m);
        if (firstHeadingIndex > 0) {
            cleanMarkdown = cleanMarkdown.slice(firstHeadingIndex).trim();
        }
        generatedMarkdown = cleanMarkdown;
        if (!prdPreview) return;

        // Marked configuration
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true
        });

        prdPreview.innerHTML = marked.parse(cleanMarkdown);
        prdPreview.classList.remove('hidden');

        // Prism syntax highlighting
        if (window.Prism) {
            Prism.highlightAllUnder(prdPreview);
        }

        // Mermaid Rendering
        if (window.mermaid) {
            const mermaidBlocks = Array.from(prdPreview.querySelectorAll('pre code.language-mermaid'));
            for (let i = 0; i < mermaidBlocks.length; i++) {
                const block = mermaidBlocks[i];
                const pre = block.parentElement;
                let code = cleanMermaidCode(block.textContent);

                const container = document.createElement('div');
                container.className = 'mermaid-wrapper my-6 p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto flex justify-center';
                const mermaidId = `mermaid-diag-${Date.now()}-${i}`;

                // Mermaid render with progressive fallback
                const renderWithRetry = async (codeToRender) => {
                    const isErd = /^erDiagram\b/im.test(codeToRender);
                    let attempts;
                    if (isErd) {
                        // ERD: 1) kode utuh → 2) badan entitas dikosongkan (atribut rusak
                        // diabaikan, entitas tetap tergambar) → 3) relasi saja (dijamin valid)
                        const relsOnly = ['erDiagram'];
                        for (const l of codeToRender.split('\n')) {
                            const m = l.match(/^\s*([A-Za-z_]\w*)\s+(\S*[|{}]\S*)\s+([A-Za-z_]\w*)/);
                            if (m) {
                                const lbl = (l.match(/"([^"]*)"/) || [])[1] || 'rel';
                                relsOnly.push(`${m[1]} ${m[2]} ${m[3]} : ${lbl}`);
                            }
                        }
                        attempts = [
                            codeToRender,
                            codeToRender.replace(/([A-Za-z_]\w*)\s*\{[^}]*\}/gs, '$1 {}'),
                            relsOnly.join('\n'),
                        ];
                    } else {
                        attempts = [
                            codeToRender, // Attempt 1: full sanitized code
                            codeToRender.replace(/\|"[^"]*"\|/g, ' --> '), // Attempt 2: no edge labels
                            codeToRender.replace(/\|"[^"]*"\|/g, ' --> ').replace(/\[[^\]]*\]/g, ''), // Attempt 3: no brackets, no edge labels (simplest valid Mermaid)
                        ];
                    }

                    for (const attempt of attempts) {
                        try {
                            const { svg } = await mermaid.render(mermaidId, attempt);
                            return svg;
                        } catch (e) {
                            // try next attempt
                        }
                    }
                    return null;
                };

                try {
                    const svg = await renderWithRetry(code);
                    if (svg) {
                        container.innerHTML = svg;
                        container.dataset.mermaidCode = code;
                        container.dataset.mermaidId = mermaidId;

                        // Unduh kontrol diagram
                        const downloadControls = document.createElement('div');
                        downloadControls.className = 'flex items-center gap-2 mt-2 px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg flex-wrap';
                        downloadControls.innerHTML = `
                            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Unduh Diagram</span>
                            <button class="download-svg p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition" title="Unduh SVG"><i class="fa-solid fa-file-code"></i></button>
                            <button class="download-png p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition" title="Unduh PNG"><i class="fa-solid fa-image"></i></button>
                            <button class="download-jpg p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition" title="Unduh JPG"><i class="fa-solid fa-file-image"></i></button>
                            <button class="download-fullscreen p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition" title="Fullscreen Diagram"><i class="fa-solid fa-expand"></i></button>
                        `;
                        const parent = pre.parentNode;
                        parent.replaceChild(container, pre);
                        parent.insertBefore(downloadControls, container.nextSibling);

                        downloadControls.querySelector('.download-svg').addEventListener('click', () => downloadMermaidSVG(container));
                        downloadControls.querySelector('.download-png').addEventListener('click', () => downloadMermaidImage(container, 'png'));
                        downloadControls.querySelector('.download-jpg').addEventListener('click', () => downloadMermaidImage(container, 'jpg'));
                        downloadControls.querySelector('.download-fullscreen').addEventListener('click', () => openMermaidFullscreen(container));
                    } else {
                        throw new Error('All render attempts failed');
                    }
                } catch (diagErr) {
                    console.error('Mermaid Render Error [' + mermaidId + ']:', diagErr, '\nCode:\n' + code);
                    const errEl = document.getElementById('d' + mermaidId) || document.getElementById(mermaidId);
                    if (errEl) errEl.remove();

                    const errMsg = diagErr?.message || String(diagErr);
                    container.className = 'mermaid-wrapper my-6 p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto';
                    container.innerHTML = `
                        <div class="text-xs text-emerald-400 font-mono mb-2 flex items-center gap-1.5">
                            <i class="fa-solid fa-diagram-project"></i> Diagram Mermaid (Syntax Fallback)
                        </div>
                        <div class="text-[10px] text-red-400 font-mono mb-1 px-2 py-1 bg-red-500/10 rounded border border-red-500/20 max-w-fit">${errMsg}</div>
                        <pre class="text-xs text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg overflow-x-auto border border-slate-800">${code}</pre>
                    `;
                    pre.parentNode.replaceChild(container, pre);
                }
            }
        }
    };

    // Helper: Filename sanitizer
    const getPrdTitle = () => {
        if (!generatedMarkdown) return 'PRD-LearnDev';
        const match = generatedMarkdown.match(/^#\s+(.+)$/m);
        if (match) {
            return match[1].replace(/[\/\\:*?"<>|#]/g, '').trim().replace(/\s+/g, '-');
        }
        return 'PRD-LearnDev';
    };

    // Helper: Sanitize SVG agar tidak tainted saat dirasterisasi ke canvas
    // Bekerja di level string untuk menangkap SEMUA pola referensi external
    // (@import font Google, url() external, href external, dll) di mana pun posisinya
    const sanitizeSvgForCanvas = (svgEl) => {
        const clone = svgEl.cloneNode(true);

        // 1. Hapus elemen <link> stylesheet external
        clone.querySelectorAll('link').forEach((link) => link.remove());

        // 2. Konversi <foreignObject> (label HTML) menjadi SVG <text> pada posisi
        //    ABSOLUT + word-wrap manual. SVG yang berisi foreignObject SELALU
        //    men-taint canvas (security model browser). Mermaid merender label
        //    panjang sebagai HTML multi-line (break-spaces + max-width), sedangkan
        //    SVG <text> tidak ada wrapping — tanpa pemotongan baris, teks muncrat
        //    kesamping melewati batas node. Posisi absolut = x/y foreignObject +
        //    akumulasi translate() semua elemen <g> induk.
        const svgNs = 'http://www.w3.org/2000/svg';
        const FONT_SIZE = 16;
        const LINE_HEIGHT = FONT_SIZE * 1.5; // line-height: 1.5 (sama dengan Mermaid)
        const CHAR_W = FONT_SIZE * 0.55;     // estimasi lebar char rata-rata + margin
        // Pecah teks menjadi baris-baris yang muat dalam maxWidth (px).
        const wrapText = (text, maxWidth) => {
            const words = text.split(/\s+/).filter(Boolean);
            const lines = [];
            let cur = '';
            for (const word of words) {
                let candidate = cur ? cur + ' ' + word : word;
                if (candidate.length * CHAR_W <= maxWidth) { cur = candidate; continue; }
                if (cur) { lines.push(cur); cur = ''; }
                // kata tunggal lebih panjang dari baris -> hard split per char
                if (word.length * CHAR_W > maxWidth) {
                    const perLine = Math.max(1, Math.floor(maxWidth / CHAR_W));
                    for (let i = 0; i < word.length; i += perLine) lines.push(word.slice(i, i + perLine));
                } else { cur = word; }
            }
            if (cur) lines.push(cur);
            return lines;
        };
        clone.querySelectorAll('foreignObject').forEach((fo) => {
            const num = (name) => {
                const v = fo.getAttribute(name);
                return v ? parseFloat(v) : 0;
            };
            const fx = num('x'), fy = num('y'), fw = num('width');
            let tx = 0, ty = 0;
            let ancestor = fo.parentElement;
            while (ancestor && ancestor !== clone) {
                const t = ancestor.getAttribute && ancestor.getAttribute('transform');
                if (t) {
                    const m = t.match(/translate\s*\(\s*([-\d.eE]+)[\s,]+([-\d.eE]+)/);
                    if (m) { tx += parseFloat(m[1]); ty += parseFloat(m[2]); }
                }
                ancestor = ancestor.parentElement;
            }
            // textContent: browser decode entity, XMLSerializer encode ulang -> aman
            const text = (fo.textContent || '').replace(/\s+/g, ' ').trim();
            if (!text) { fo.remove(); return; }
            const cx = tx + fx + fw / 2;
            const cy = ty + fy + num('height') / 2;
            // max-width aktual label (dari inline style), fallback ke width foreignObject
            let maxW = fw;
            const div = fo.querySelector('div');
            if (div) {
                const mw = div.getAttribute && div.getAttribute('style');
                const mm = mw && mw.match(/max-width:\s*(\d+(?:\.\d+)?)px/);
                if (mm) maxW = parseFloat(mm[1]);
            }
            const textEl = document.createElementNS(svgNs, 'text');
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('fill', '#f8fafc');
            textEl.setAttribute('font-size', String(FONT_SIZE));
            textEl.setAttribute('font-family', 'Segoe UI, system-ui, sans-serif');
            const lines = (text.length * CHAR_W > maxW) ? wrapText(text, maxW) : [text];
            if (lines.length === 1) {
                textEl.setAttribute('x', String(cx));
                textEl.setAttribute('y', String(cy));
                textEl.setAttribute('dominant-baseline', 'central');
                textEl.textContent = lines[0];
            } else {
                // Pusatkan blok baris secara vertikal di cy. Baseline baris
                // pertama = cy - offset (n-1)/2 baris + setengah ascent.
                const y0 = cy - (lines.length - 1) * LINE_HEIGHT / 2 + FONT_SIZE * 0.35;
                lines.forEach((line, i) => {
                    const ts = document.createElementNS(svgNs, 'tspan');
                    ts.setAttribute('x', String(cx));
                    if (i === 0) ts.setAttribute('y', String(y0));
                    else ts.setAttribute('dy', String(LINE_HEIGHT));
                    ts.textContent = line;
                    textEl.appendChild(ts);
                });
            }
            clone.appendChild(textEl);
            fo.remove();
        });

        // 3. Serialisasi ke string untuk pembersihan ekstensif
        let svgString = new XMLSerializer().serializeToString(clone);

        // 3. Strip @import dalam semua bentuk:
        //    @import url("https://...");  @import "https://...";  @import url(https://...);
        svgString = svgString.replace(/@import\s+(?:url\(\s*)?['"]?(?:https?:)?\/\/[^;'")\n]*['"]?\s*\)?\s*;?/gi, '');

        // 4. Ganti url() external dengan 'none' — termasuk yang dibungkus entitas HTML (&quot; / &#39;)
        svgString = svgString.replace(/url\(\s*(?:['"]|&quot;|&#39;|&apos;)*(?:https?:)?\/\/[^'")\n]*(?:['"]|&quot;|&#39;|&apos;)*\s*\)/gi, 'none');

        // 5. Hapus atribut href/xlink:href external (tag <image>, <use>, <link> residual)
        svgString = svgString.replace(/\s(?:xlink:)?href\s*=\s*["'](?:https?:)?\/\/[^"']*["']/gi, '');

        // 6. Hapus @font-face block yang mereferensikan external
        svgString = svgString.replace(/@font-face\s*\{[^}]*(?:https?:)?\/\/[^}]*\}/gi, '');

        // 7. Pastikan namespace SVG lengkap
        if (!/xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/.test(svgString)) {
            svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        return svgString;
    };

    // Unduh Diagram Mermaid sebagai SVG
    const downloadMermaidSVG = (container) => {
        const svgEl = container.querySelector('svg');
        if (!svgEl) return;
        // Bersihkan referensi external agar file SVG self-contained & aman
        const svgData = sanitizeSvgForCanvas(svgEl);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const diagramId = container.dataset.mermaidId || 'diagram';
        a.download = `${getPrdTitle()}-${diagramId}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('success', 'Diagram SVG berhasil diunduh');
    };

    // Unduh Diagram Mermaid sebagai PNG / JPG
    const downloadMermaidImage = async (container, format) => {
        const svgEl = container.querySelector('svg');
        if (!svgEl) return;

        try {
            const bbox = svgEl.getBoundingClientRect();
            const viewBox = svgEl.viewBox?.baseVal;
            const width = (viewBox && viewBox.width > 0) ? viewBox.width : (bbox.width > 0 ? bbox.width : 1000);
            const height = (viewBox && viewBox.height > 0) ? viewBox.height : (bbox.height > 0 ? bbox.height : 700);

            // Sanitasi SVG: hilangkan SEMUA referensi external (font @import, url(), dll)
            // agar canvas tidak tainted dan toBlob tidak throw SecurityError.
            // sanitizeSvgForCanvas mengembalikan string SVG yang sudah bersih.
            let svgData = sanitizeSvgForCanvas(svgEl);

            // Set ukuran eksplisit pada elemen <svg> terluar
            svgData = svgData.replace(
                /^<svg\b([^>]*)>/,
                (m, attrs) => {
                    let cleaned = attrs
                        .replace(/\swidth=["'][^"']*["']/gi, '')
                        .replace(/\sheight=["'][^"']*["']/gi, '');
                    return `<svg${cleaned} width="${width}" height="${height}">`;
                }
            );

            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();

            img.onload = () => {
                try {
                    const scale = 3; // retina scale — lebih tinggi = teks PNG lebih tajam
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(width * scale);
                    canvas.height = Math.round(height * scale);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { URL.revokeObjectURL(url); return; }

                    ctx.fillStyle = '#0b0f17';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);

                    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                    const ext = format === 'jpg' ? 'jpg' : 'png';
                    canvas.toBlob((blob) => {
                        if (!blob) { console.error(`Mermaid export: canvas.toBlob mengembalikan null (format=${format}) — fallback ke SVG.`); downloadMermaidSVG(container); return; }
                        const downloadUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        const diagramId = container.dataset.mermaidId || 'diagram';
                        a.download = `${getPrdTitle()}-${diagramId}.${ext}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(downloadUrl);
                        showToast('success', `Diagram ${ext.toUpperCase()} berhasil diunduh`);
                    }, mimeType, format === 'jpg' ? 0.95 : undefined);
                } catch (canvasErr) {
                    // Fallback: unduh sebagai SVG bila canvas tetap tainted
                    console.error('Canvas export error:', canvasErr);
                    URL.revokeObjectURL(url);
                    downloadMermaidSVG(container);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                console.error(`Mermaid export: SVG blob gagal dimuat sebagai image (format=${format}). Kemungkinan SVG malformed (label mengandung karakter & < > mentah) — fallback ke SVG.`);
                downloadMermaidSVG(container);
            };
            img.src = url;
        } catch (e) {
            console.error('Mermaid export error:', e);
            downloadMermaidSVG(container);
        }
    };

    // Fullscreen Mermaid Diagram dengan Kontrol Zoom & Pan
    const openMermaidFullscreen = (container) => {
        const svgEl = container.querySelector('svg');
        if (!svgEl) return;

        let zoomScale = 1;

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-50 bg-[#0b0f17]/95 backdrop-blur-md flex flex-col items-center justify-between p-4 overflow-hidden';

        const headerBar = document.createElement('div');
        headerBar.className = 'w-full flex items-center justify-between z-10 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl max-w-4xl shadow-2xl';
        headerBar.innerHTML = `
            <div class="flex items-center gap-2 text-slate-200 font-semibold text-xs tracking-wider">
                <i class="fa-solid fa-diagram-project text-emerald-400"></i>
                <span>Fullscreen Diagram</span>
            </div>
            <div class="flex items-center gap-1.5">
                <button id="fsZoomOut" class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Perkecil (-)"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
                <button id="fsReset" class="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs font-mono font-semibold" title="Reset Ukuran (100%)">100%</button>
                <button id="fsZoomIn" class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Perbesar (+)"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                <div class="w-px h-5 bg-slate-800 mx-1"></div>
                <button id="fsClose" class="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-md" title="Tutup (Esc)"><i class="fa-solid fa-xmark text-sm"></i></button>
            </div>
        `;

        const viewport = document.createElement('div');
        viewport.className = 'w-full flex-1 overflow-auto flex items-center justify-center p-4 my-2';

        const svgClone = svgEl.cloneNode(true);
        svgClone.style.maxWidth = 'none';
        svgClone.style.transition = 'transform 0.12s ease-out';
        svgClone.style.transformOrigin = 'center center';
        svgClone.style.width = '95%';
        svgClone.style.height = 'auto';

        const updateTransform = () => {
            svgClone.style.transform = `scale(${zoomScale})`;
            const resetBtn = headerBar.querySelector('#fsReset');
            if (resetBtn) resetBtn.textContent = `${Math.round(zoomScale * 100)}%`;
        };

        viewport.appendChild(svgClone);
        overlay.appendChild(headerBar);
        overlay.appendChild(viewport);

        const closeFullscreen = () => {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        };
        const escHandler = (e) => { if (e.key === 'Escape') closeFullscreen(); };
        document.addEventListener('keydown', escHandler);

        headerBar.querySelector('#fsClose').addEventListener('click', closeFullscreen);
        headerBar.querySelector('#fsZoomIn').addEventListener('click', () => { zoomScale = Math.min(zoomScale + 0.25, 3.5); updateTransform(); });
        headerBar.querySelector('#fsZoomOut').addEventListener('click', () => { zoomScale = Math.max(zoomScale - 0.25, 0); updateTransform(); });
        headerBar.querySelector('#fsReset').addEventListener('click', () => { zoomScale = 1; updateTransform(); });

        document.body.appendChild(overlay);
    };

    // Save to Local History
    const saveToHistory = (prompt, markdown) => {
        try {
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            const titleMatch = markdown.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1].trim() : prompt.slice(0, 40) + '...';
            history.unshift({
                id: Date.now(),
                title,
                prompt,
                markdown,
                date: new Date().toLocaleString('id-ID')
            });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
        } catch (e) {
            console.error('Failed to save PRD history:', e);
        }
    };

    // Main Generate Handler
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            const prompt = promptInput ? promptInput.value.trim() : '';
            if (!prompt) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Prompt Kosong',
                        text: 'Tuliskan ide aplikasi Anda terlebih dahulu pada panel kiri.',
                        background: '#0b0f17',
                        color: '#f8fafc',
                        confirmButtonColor: '#10b981'
                    });
                } else {
                    alert('Tuliskan ide aplikasi Anda terlebih dahulu.');
                }
                return;
            }

            // Switch view on mobile to result tab
            switchTab('result');

            // UI State: Generating
            btnGenerate.disabled = true;
            if (generateText) generateText.textContent = 'Menyusun PRD...';
            if (generateSpinner) generateSpinner.classList.remove('hidden');
            setActionButtonsState(false);

            if (previewEmpty) previewEmpty.classList.add('hidden');
            if (prdPreview) {
                prdPreview.classList.add('hidden');
                prdPreview.innerHTML = '';
            }
            if (skeletonLoader) skeletonLoader.classList.remove('hidden');
            if (progressSteps) progressSteps.classList.remove('hidden');

            updateProgressStep(1, 'Analisis Ide & Struktur Domain', 25);

            try {
                setTimeout(() => updateProgressStep(2, 'Sintesis Skema & Spesifikasi API', 55), 1200);
                setTimeout(() => updateProgressStep(3, 'Merender Diagram Mermaid & Markdown', 85), 2600);

                const prdContent = await callAIEndpoint(prompt);
                if (!prdContent) throw new Error('AI tidak menghasilkan konten.');

                updateProgressStep(4, 'Selesai!', 100);

                if (skeletonLoader) skeletonLoader.classList.add('hidden');
                if (progressSteps) progressSteps.classList.add('hidden');

                await renderMarkdownPRD(prdContent);
                saveToHistory(prompt, prdContent);

                if (generationProgress) {
                    generationProgress.innerHTML = `<span class="text-xs text-emerald-400 font-semibold"><i class="fa-solid fa-check mr-1"></i> PRD Generated Successfully</span>`;
                }
                setActionButtonsState(true);

            } catch (err) {
                console.error('PRD Generation Error:', err);
                if (skeletonLoader) skeletonLoader.classList.add('hidden');
                if (progressSteps) progressSteps.classList.add('hidden');
                if (previewEmpty) previewEmpty.classList.remove('hidden');

                if (generationProgress) {
                    generationProgress.innerHTML = `<span class="text-xs text-rose-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Gagal: ${err.message}</span>`;
                }

                if (window.Swal) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menghasilkan PRD',
                        text: err.message,
                        background: '#0b0f17',
                        color: '#f8fafc',
                        confirmButtonColor: '#10b981'
                    });
                }
            } finally {
                btnGenerate.disabled = false;
                if (generateText) generateText.textContent = 'Generate Dokumen PRD';
                if (generateSpinner) generateSpinner.classList.add('hidden');
            }
        });
    }

    // Action: Copy PRD Markdown
    if (btnCopyPrd) {
        btnCopyPrd.addEventListener('click', async () => {
            if (!generatedMarkdown) return;
            const ok = await copyToClipboard(generatedMarkdown);
            const originalHtml = btnCopyPrd.innerHTML;
            btnCopyPrd.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i>';
            setTimeout(() => { btnCopyPrd.innerHTML = originalHtml; }, 1800);
            if (ok) showToast('success', 'PRD disalin ke clipboard');
            else showToast('error', 'Gagal menyalin ke clipboard');
        });
    }

    // Action: Download PDF
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {
            if (!prdPreview || !generatedMarkdown) return;
            showToast('info', 'Menyiapkan file PDF...');
            if (window.html2pdf) {
                const opt = {
                    margin: [10, 10, 10, 10],
                    filename: `${getPrdTitle()}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(prdPreview).save().then(() => {
                    showToast('success', 'File PDF berhasil diunduh');
                }).catch((err) => {
                    console.error('PDF generation error:', err);
                    window.print();
                });
            } else {
                window.print();
            }
        });
    }

    // Action: Download DOCX / Word Document (.doc format with full Word styling)
    if (btnDownloadDocx) {
        btnDownloadDocx.addEventListener('click', () => {
            if (!generatedMarkdown) return;
            const docTitle = getPrdTitle();

            const clone = prdPreview.cloneNode(true);
            clone.querySelectorAll('button, .download-svg, [title*="Unduh"]').forEach(el => {
                const parentBox = el.closest('div');
                if (parentBox && parentBox.textContent.includes('Unduh Diagram')) {
                    parentBox.remove();
                } else {
                    el.remove();
                }
            });

            const wordContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${docTitle}</title>
<style>
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; background: #ffffff; padding: 24px; }
h1 { font-size: 22pt; color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-top: 10px; margin-bottom: 16px; font-weight: bold; }
h2 { font-size: 15pt; color: #059669; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 22px; margin-bottom: 10px; font-weight: bold; }
h3 { font-size: 12pt; color: #0f766e; margin-top: 16px; margin-bottom: 6px; font-weight: bold; }
p { margin-bottom: 10px; }
table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 10pt; }
th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
tr:nth-child(even) { background-color: #f8fafc; }
pre, code { font-family: Consolas, 'Courier New', monospace; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 6px; border-radius: 4px; font-size: 9.5pt; }
pre { padding: 12px; margin: 12px 0; overflow-x: auto; white-space: pre-wrap; }
ul, ol { margin-left: 24px; margin-bottom: 12px; }
li { margin-bottom: 4px; }
blockquote { border-left: 4px solid #10b981; padding-left: 12px; margin-left: 0; color: #475569; font-style: italic; }
</style>
</head>
<body>
${clone.innerHTML}
</body>
</html>`;

            const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${docTitle}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('success', 'Dokumen Word berhasil diunduh');
        });
    }

    // Action: Download AGENTS.md
    if (btnDownloadAgents) {
        btnDownloadAgents.addEventListener('click', () => {
            if (!generatedMarkdown) return;
            let agentSection = '';
            const match = generatedMarkdown.match(/##\s*8\.?[^\n]*AGENTS\.md[\s\S]*?(?=\n##\s+\d|\n#\s+|$)/i);
            if (match) {
                agentSection = match[0].trim();
                agentSection = agentSection.replace(/```markdown\s*/gi, '').replace(/```$/g, '').trim();
            } else {
                const title = getPrdTitle();
                agentSection = `# AGENTS.md - Panduan Arsitektur & Coding Agent\n\n> Diekstrak otomatis dari: ${title}\n> Sasaran: Claude Code, Cursor, OpenCode, Windsurf, Copilot\n\n${generatedMarkdown}`;
            }

            const blob = new Blob([agentSection], { type: 'text/markdown;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'AGENTS.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            showToast('success', 'File AGENTS.md berhasil diunduh');
        });
    }

    // Action: Share PRD (Native Share or Copy Link)
    if (btnSharePrd) {
        btnSharePrd.addEventListener('click', async () => {
            if (!generatedMarkdown) return;
            const docTitle = getPrdTitle();
            const shareUrl = new URL(window.location.origin + window.location.pathname);
            if (promptInput && promptInput.value.trim()) {
                shareUrl.searchParams.set('prompt', promptInput.value.trim());
            }
            if (uiTheme && uiTheme.value) {
                shareUrl.searchParams.set('theme', uiTheme.value);
            }

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: docTitle,
                        text: `Dokumen PRD untuk ${docTitle.replace(/-/g, ' ')}`,
                        url: shareUrl.toString()
                    });
                    return;
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        // fallback
                    } else {
                        return;
                    }
                }
            }

            const ok = await copyToClipboard(shareUrl.toString());
            if (ok) {
                showToast('success', 'Tautan PRD disalin ke clipboard');
            } else {
                showToast('warning', 'Gagal menyalin tautan');
            }
        });
    }

    // Navbar: API Key Management
    if (btnApiKey) {
        btnApiKey.addEventListener('click', async () => {
            if (!window.Swal) return;
            const currentKey = localStorage.getItem(API_KEY_STORAGE) || '';
            const { value: key } = await Swal.fire({
                title: 'Konfigurasi Google Gemini API Key',
                input: 'password',
                inputLabel: 'Masukkan Gemini API Key gratis Anda (Google AI Studio)',
                inputValue: currentKey,
                inputPlaceholder: 'AIzaSy...',
                showCancelButton: true,
                background: '#0b0f17',
                color: '#f8fafc',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#334155',
                confirmButtonText: 'Simpan',
                cancelButtonText: 'Batal'
            });

            if (key !== undefined) {
                localStorage.setItem(API_KEY_STORAGE, key.trim());
                Swal.fire({
                    icon: 'success',
                    title: 'API Key Disimpan',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#0b0f17',
                    color: '#f8fafc'
                });
            }
        });
    }

    // Navbar: 9Router Settings
    if (btnSettings) {
        btnSettings.addEventListener('click', async () => {
            if (!window.Swal) return;
            const currentUrl = localStorage.getItem(NINEROUTER_URL_STORAGE) || '';
            const currentKey = localStorage.getItem(NINEROUTER_KEY_STORAGE) || '';

            const { value: formValues } = await Swal.fire({
                title: 'Pengaturan 9Router & Proxy AI',
                html: `
                    <div class="space-y-3 text-left">
                        <div>
                            <label class="text-xs text-slate-400 block mb-1">Base URL (OpenAI-compatible)</label>
                            <input id="swal-9router-url" class="swal2-input !w-full !m-0 !bg-slate-800 !border-slate-700 !text-slate-100 !text-sm" placeholder="http://localhost:20128/v1" value="${currentUrl}">
                        </div>
                        <div>
                            <label class="text-xs text-slate-400 block mb-1">API Key (Opsional jika lokal)</label>
                            <input id="swal-9router-key" type="password" class="swal2-input !w-full !m-0 !bg-slate-800 !border-slate-700 !text-slate-100 !text-sm" placeholder="Bearer Token" value="${currentKey}">
                        </div>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                background: '#0b0f17',
                color: '#f8fafc',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#334155',
                confirmButtonText: 'Simpan',
                cancelButtonText: 'Batal',
                preConfirm: () => {
                    return [
                        document.getElementById('swal-9router-url').value.trim(),
                        document.getElementById('swal-9router-key').value.trim()
                    ];
                }
            });

            if (formValues) {
                const [url, key] = formValues;
                if (url) {
                    localStorage.setItem(NINEROUTER_URL_STORAGE, url);
                } else {
                    localStorage.removeItem(NINEROUTER_URL_STORAGE);
                }
                if (key) {
                    localStorage.setItem(NINEROUTER_KEY_STORAGE, key);
                } else {
                    localStorage.removeItem(NINEROUTER_KEY_STORAGE);
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Pengaturan Disimpan',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#0b0f17',
                    color: '#f8fafc'
                });
            }
        });
    }

    // Navbar: PRD History — hapus satu, beberapa sekaligus (centang), atau semua
    if (btnHistory) {
        btnHistory.addEventListener('click', () => {
            if (!window.Swal) return;
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            if (history.length === 0) {
                Swal.fire({
                    title: 'Riwayat Kosong',
                    text: 'Belum ada PRD yang pernah di-generate pada perangkat ini.',
                    icon: 'info',
                    background: '#0b0f17',
                    color: '#f8fafc',
                    confirmButtonColor: '#10b981'
                });
                return;
            }
            openHistoryModal();
        });

        const openHistoryModal = () => {
            const itemsHtml = () => {
                const currentHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                return currentHistory.map((item, idx) => `
                    <div class="px-2.5 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-left mb-1.5 flex items-center gap-2.5 group" data-idx="${idx}">
                        <input type="checkbox" class="hist-check w-4 h-4 accent-emerald-500 shrink-0 cursor-pointer" data-idx="${idx}" title="Pilih untuk hapus">
                        <div class="flex-1 min-w-0 flex items-baseline gap-2" onclick="handleHistorySelect('${idx}')">
                            <div class="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 truncate cursor-pointer">${item.title}</div>
                            <div class="text-[10px] text-slate-500 shrink-0">${item.date}</div>
                        </div>
                        <button type="button" class="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition" onclick="handleHistoryDelete('${idx}', event)" title="Hapus riwayat">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                `).join('');
            };

            // Konfirmasi INLINE di dalam modal yang sama (SweetAlert2 tidak bisa
            // menumpuk popup: popup konfirmasi akan menutup modal daftar, sehingga
            // user menyangka datanya sudah terhapus). Daftar tetap dirender di
            // belakang panel konfirmasi — data jelas aman sampai user menekan Hapus.
            let pendingAction = null;
            const askDelete = (title, text, action) => {
                const container = Swal.getHtmlContainer();
                if (!container) return;
                pendingAction = action;
                container.querySelector('#histConfirmTitle').textContent = title;
                container.querySelector('#histConfirmText').textContent = text;
                container.querySelector('#histConfirm').classList.remove('hidden');
                container.querySelector('#histDeleteAll').classList.add('hidden');
                container.querySelector('#histDeleteSelected').classList.add('hidden');
                container.querySelector('#histSelectAll').disabled = true;
                container.querySelectorAll('.hist-check').forEach((cb) => { cb.disabled = true; });
            };
            const cancelDelete = () => {
                const container = Swal.getHtmlContainer();
                if (!container) return;
                pendingAction = null;
                container.querySelector('#histConfirm').classList.add('hidden');
                container.querySelector('#histDeleteAll').classList.remove('hidden');
                container.querySelector('#histSelectAll').disabled = false;
                container.querySelectorAll('.hist-check').forEach((cb) => { cb.disabled = false; });
                updateBulkBar(Swal.getHtmlContainer());
            };
            const updateBulkBar = (container) => {
                const boxes = Array.from(container.querySelectorAll('.hist-check'));
                const checked = boxes.filter((c) => c.checked).length;
                const btnSel = container.querySelector('#histDeleteSelected');
                if (btnSel) {
                    btnSel.classList.toggle('hidden', checked === 0);
                    if (checked > 0) btnSel.textContent = `Hapus Terpilih (${checked})`;
                }
                const selAll = container.querySelector('#histSelectAll');
                if (selAll) selAll.checked = boxes.length > 0 && checked === boxes.length;
            };

            // Hapus item dari localStorage, lalu refresh daftar IN-PLACE.
            const removeItems = (selector) => {
                const cur = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                const updated = cur.filter((_, i) => !selector(i));
                if (updated.length === 0) {
                    localStorage.removeItem(HISTORY_KEY);
                    showToast('info', 'Seluruh riwayat PRD telah dihapus.');
                } else {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
                    const container = Swal.getHtmlContainer();
                    if (container) container.querySelector('#histList').innerHTML = itemsHtml();
                }
            };

            Swal.fire({
                title: 'Riwayat PRD Tersimpan',
                html: `
                    <div id="histConfirm" class="hidden mb-2 p-2.5 bg-red-600/10 border border-red-500/30 rounded-lg">
                        <div id="histConfirmTitle" class="text-sm font-semibold text-red-400 mb-0.5">Hapus?</div>
                        <div id="histConfirmText" class="text-[11px] text-slate-400 mb-2"></div>
                        <div class="flex gap-1.5 justify-end">
                            <button type="button" id="histConfirmNo" class="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition">Batal</button>
                            <button type="button" id="histConfirmYes" class="px-2.5 py-1 text-[11px] font-semibold bg-red-600 text-white rounded hover:bg-red-500 transition">Hapus</button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700">
                        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                            <input type="checkbox" id="histSelectAll" class="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"> Pilih Semua
                        </label>
                        <div class="flex gap-1.5">
                            <button type="button" id="histDeleteSelected" class="hidden px-2.5 py-1 text-[11px] font-semibold bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition">Hapus Terpilih</button>
                            <button type="button" id="histDeleteAll" class="px-2.5 py-1 text-[11px] font-semibold bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition">Hapus Semua</button>
                        </div>
                    </div>
                    <div id="histList" class="max-h-80 overflow-y-auto pr-1">${itemsHtml()}</div>`,
                showCloseButton: true,
                showConfirmButton: false,
                background: '#0b0f17',
                color: '#f8fafc',
                didOpen: () => {
                    const container = Swal.getHtmlContainer();

                    container.querySelector('#histList').addEventListener('change', () => updateBulkBar(container));

                    container.querySelector('#histSelectAll').addEventListener('change', (e) => {
                        container.querySelectorAll('.hist-check').forEach((cb) => { cb.checked = e.target.checked; });
                        updateBulkBar(container);
                    });

                    container.querySelector('#histDeleteSelected').addEventListener('click', () => {
                        const idxs = Array.from(container.querySelectorAll('.hist-check'))
                            .filter((c) => c.checked)
                            .map((c) => parseInt(c.dataset.idx));
                        if (!idxs.length) return;
                        askDelete(`Hapus ${idxs.length} riwayat terpilih?`, 'Riwayat PRD yang dipilih akan dihapus secara permanen.', () => removeItems((i) => idxs.includes(i)));
                    });

                    container.querySelector('#histDeleteAll').addEventListener('click', () => {
                        askDelete('Hapus Semua Riwayat?', 'Seluruh riwayat PRD yang tersimpan di perangkat ini akan dihapus permanen.', () => removeItems(() => true));
                    });

                    container.querySelector('#histConfirmYes').addEventListener('click', () => {
                        const action = pendingAction;
                        pendingAction = null;
                        if (!action) return;
                        action();
                        // Setelah hapus: kembalikan toolbar bila masih ada sisa, atau tutup modal bila kosong
                        if (localStorage.getItem(HISTORY_KEY)) {
                            container.querySelector('#histConfirm').classList.add('hidden');
                            container.querySelector('#histDeleteAll').classList.remove('hidden');
                            container.querySelector('#histSelectAll').disabled = false;
                            container.querySelectorAll('.hist-check').forEach((cb) => { cb.disabled = false; cb.checked = false; });
                            container.querySelector('#histSelectAll').checked = false;
                            updateBulkBar(container);
                        } else {
                            Swal.close();
                        }
                    });

                    container.querySelector('#histConfirmNo').addEventListener('click', () => {
                        cancelDelete();
                    });

                    window.handleHistorySelect = (idx) => {
                        const cur = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
                        const selected = cur[parseInt(idx)];
                        if (selected) {
                            renderMarkdownPRD(selected.markdown);
                            if (previewEmpty) previewEmpty.classList.add('hidden');
                            if (generationProgress) {
                                generationProgress.innerHTML = `<span class="text-xs text-emerald-400 font-semibold">[Riwayat] ${selected.title}</span>`;
                            }
                            setActionButtonsState(true);
                            switchTab('result');
                            Swal.close();
                        }
                    };

                    window.handleHistoryDelete = (idx, e) => {
                        e.stopPropagation();
                        askDelete('Hapus Riwayat?', 'Riwayat PRD ini akan dihapus secara permanen.', () => removeItems((i) => i === parseInt(idx)));
                    };
                }
            });
        };
    }

    console.log('LearnDev PRD Generator Initialized Successfully');
});
