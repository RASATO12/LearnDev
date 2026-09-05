document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });

    const apiKeyBtn = document.getElementById('apikey-btn');
    const settingsBtn = document.getElementById('btn-settings');
    const installBtn = document.getElementById('install-btn');
    const providerSelect = document.getElementById('provider-select');
    const promptInput = document.getElementById('prompt-input');
    const uiThemeSelect = document.getElementById('uiTheme');
    const uiThemeCustom = document.getElementById('uiThemeCustom');

    if (uiThemeSelect) {
        uiThemeSelect.addEventListener('change', () => {
            if (uiThemeSelect.value === 'custom') {
                uiThemeCustom.classList.remove('hidden');
                uiThemeCustom.focus();
            } else {
                uiThemeCustom.classList.add('hidden');
                uiThemeCustom.value = '';
            }
        });
    }

    const generateBtn = document.getElementById('generate-btn');
    const generateText = document.getElementById('generate-text');
    const generateSpinner = document.getElementById('generate-spinner');

    const tabPreview = document.getElementById('tab-preview');
    const tabCode = document.getElementById('tab-code');
    const previewContainer = document.getElementById('preview-container');
    const codeContainer = document.getElementById('code-container');
    const prdContent = document.getElementById('prd-content');
    const previewEmpty = document.getElementById('preview-empty');
    const codeOutput = document.getElementById('code-output');
    const copyBtn = document.getElementById('copy-btn');

    let generatedMarkdown = '';
    let deferredPrompt = null;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    });

    const getGeminiKey = () => localStorage.getItem('learndev_gemini_key') || '';
    const setGeminiKey = (key) => localStorage.setItem('learndev_gemini_key', key.trim());
    const getApiBaseUrl = () => localStorage.getItem('learndev_api_base_url') || '';
    const setApiBaseUrl = (url) => localStorage.setItem('learndev_api_base_url', url.trim());
    const getApiProvider = () => localStorage.getItem('learndev_api_provider') || 'gemini';
    const setApiProvider = (provider) => localStorage.setItem('learndev_api_provider', provider);

    function getApiKey() {
        const provider = getApiProvider();
        if (provider === '9router') return localStorage.getItem('learndev_9router_key') || '';
        return getGeminiKey();
    }

    function getApiConfig() {
        const provider = getApiProvider();
        const baseUrl = getApiBaseUrl();
        if (provider === '9router' && baseUrl) {
            return { provider, baseUrl: baseUrl.replace(/\/+$/, ''), key: localStorage.getItem('learndev_9router_key') || '' };
        }
        return { provider, baseUrl: '', key: getGeminiKey() };
    }

    async function openApiKeyModal() {
        const currentProvider = getApiProvider();
        const currentBaseUrl = getApiBaseUrl();
        const { value: apiKey } = await Swal.fire({
            title: 'Pengaturan API Key & Endpoint',
            html: `
                <div class="space-y-3 text-left">
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">AI Provider</label>
                        <select id="swal-api-provider" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm">
                            <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>Google Gemini (Direct)</option>
                            <option value="9router" ${currentProvider === '9router' ? 'selected' : ''}>9Router Gateway</option>
                        </select>
                    </div>
                    <div id="swal-gemini-group">
                        <label class="block text-xs font-medium text-slate-300 mb-1">Google Gemini API Key</label>
                        <input type="password" id="swal-gemini-key" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm" placeholder="AIza..." value="${getGeminiKey()}">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[11px] text-indigo-400 hover:underline mt-1 inline-block">Dapatkan Gemini Key Gratis</a>
                    </div>
                    <div id="swal-9router-group" class="hidden">
                        <label class="block text-xs font-medium text-slate-300 mb-1">9Router API Key</label>
                        <input type="password" id="swal-9router-key" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm" placeholder="sk-..." value="${localStorage.getItem('learndev_9router_key') || ''}">
                        <label class="block text-xs font-medium text-slate-300 mb-1 mt-2">9Router Base URL</label>
                        <input type="text" id="swal-9router-url" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm" placeholder="http://localhost:20128/v1" value="${currentBaseUrl}">
                        <a href="https://github.com/decolua/9router" target="_blank" class="text-[11px] text-emerald-400 hover:underline mt-1 inline-block">Dapatkan 9Router</a>
                    </div>
                </div>
            `,
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#4f46e5',
            confirmButtonText: 'Simpan',
            showCancelButton: true,
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const providerEl = document.getElementById('swal-api-provider');
                const geminiKeyEl = document.getElementById('swal-gemini-key');
                const routerKeyEl = document.getElementById('swal-9router-key');
                const routerUrlEl = document.getElementById('swal-9router-url');
                const provider = providerEl ? providerEl.value : 'gemini';
                setApiProvider(provider);
                if (provider === 'gemini') {
                    setGeminiKey(geminiKeyEl ? geminiKeyEl.value : '');
                } else {
                    localStorage.setItem('learndev_9router_key', routerKeyEl ? routerKeyEl.value : '');
                    setApiBaseUrl(routerUrlEl ? routerUrlEl.value : '');
                }
                return true;
            }
        });

        Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Konfigurasi API berhasil disimpan!',
            background: '#0f172a',
            color: '#f8fafc',
            timer: 1500,
            showConfirmButton: false
        });
    }

    apiKeyBtn.addEventListener('click', openApiKeyModal);

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const currentProvider = getApiProvider();
            const currentBaseUrl = getApiBaseUrl();
            Swal.fire({
                title: '9Router & Endpoint Configuration',
                html: `
                    <div class="space-y-3 text-left">
                        <div class="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3">
                            <div class="text-xs text-slate-400 mb-1">Current Provider</div>
                            <div class="text-sm font-semibold ${currentProvider === '9router' ? 'text-emerald-400' : 'text-indigo-400'}">${currentProvider === '9router' ? '9Router Gateway' : 'Google Gemini (Direct)'}</div>
                        </div>
                        <div class="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3">
                            <div class="text-xs text-slate-400 mb-1">Base URL</div>
                            <div class="text-sm font-mono text-slate-200 break-all">${currentBaseUrl || 'Not configured (uses Gemini direct)'}</div>
                        </div>
                        <div class="text-[11px] text-slate-500">Change provider & endpoint via <strong class="text-slate-300">API Key</strong> button.</div>
                    </div>
                `,
                background: '#0f172a',
                color: '#f8fafc',
                confirmButtonColor: '#4f46e5',
                confirmButtonText: 'OK'
            });
        });
    }

    tabPreview.addEventListener('click', () => {
        tabPreview.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white shadow-sm transition";
        tabCode.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition";
        previewContainer.classList.remove('hidden');
        codeContainer.classList.add('hidden');
    });

    tabCode.addEventListener('click', () => {
        tabCode.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white shadow-sm transition";
        tabPreview.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition";
        codeContainer.classList.remove('hidden');
        previewContainer.classList.add('hidden');
    });

    copyBtn.addEventListener('click', () => {
        if (!generatedMarkdown) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Belum ada PRD untuk disalin!',
                background: '#0f172a',
                color: '#f8fafc',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }
        navigator.clipboard.writeText(generatedMarkdown).then(() => {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Dokumen PRD berhasil disalin!',
                background: '#0f172a',
                color: '#f8fafc',
                timer: 1500,
                showConfirmButton: false
            });
        });
    });

    const btnDownloadAgents = document.getElementById('btnDownloadAgents');
    if (btnDownloadAgents) {
        btnDownloadAgents.addEventListener('click', () => {
            if (!generatedMarkdown) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: 'Belum ada PRD untuk diunduh!',
                    background: '#0f172a',
                    color: '#f8fafc',
                    timer: 1500,
                    showConfirmButton: false
                });
                return;
            }

            const agentsHeader = `# AGENTS.md — OpenCode & AI Coding Agent Configuration
# Project: LearnDev Generated Spec
# Generated: ${new Date().toLocaleString('id-ID')}

## ⚡ CRITICAL EXECUTION RULES
- Read this file BEFORE any code generation. Follow ALL instructions strictly.
- NEVER output conversational filler, greetings, or explanations in generated code.
- ALL code must be production-grade, fully functional, zero stubs/placeholders.
- Use REAL Unsplash CDN URLs (https://images.unsplash.com/photo-...) for ALL images.
- NO placeholder.com, via.placeholder, empty src, or local broken paths.

## 🎨 DESIGN SYSTEM SPECS
See the PRD document above for complete color tokens, typography, and component rules.

## 🏗️ ARCHITECTURE MAP (Graphify-Ready)
The PRD above includes Component & Dependency Map section for AST analysis.

## 📋 EXECUTION STRATEGY
1. **PLAN MODE**: Analyze all requirements, component hierarchy, and dependency map.
2. **BUILD MODE**: Generate production code following Design System Specs strictly.

## ⚠️ NEGATIVE CONSTRAINTS
- DILARANG: Cyan/purple generic gradients, indigo-600/blue-600 without context.
- DILARANG: Rigid non-responsive components, neumorphism, norak gradients.
- DILARANG: Dummy placeholders, TODO stubs, console.log-only logic.

---

# PRD SOURCE DOCUMENT
`;
            const markdownWithHeader = agentsHeader + generatedMarkdown;

            const blob = new Blob([markdownWithHeader], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'AGENTS.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener('click', () => {
            if (!generatedMarkdown) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
                return;
            }
            Swal.fire({
                toast: true, position: 'top-end', icon: 'info',
                title: 'Proses generate PDF dimulai...',
                background: '#0f172a', color: '#f8fafc', timer: 2000, showConfirmButton: false
            });
            const element = document.getElementById('prd-content');
            const opt = {
                margin: 10, filename: 'PRD-LearnDev.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        });
    }

    const getHistory = () => {
        try { return JSON.parse(localStorage.getItem('learndev_prd_history')) || []; } catch { return []; }
    };

    const saveHistoryItem = (prompt, markdown) => {
        const history = getHistory();
        const titleMatch = markdown.match(/^#\s+(.*)/m);
        const title = titleMatch ? titleMatch[1] : (prompt.substring(0, 40) + '...');
        const newItem = { id: Date.now(), timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }), title: title.trim(), promptText: prompt, rawMarkdown: markdown };
        history.unshift(newItem);
        if (history.length > 15) history.pop();
        localStorage.setItem('learndev_prd_history', JSON.stringify(history));
    };

    async function renderPrd(markdownText) {
        generatedMarkdown = markdownText;
        previewEmpty.classList.add('hidden');
        prdContent.innerHTML = marked.parse(generatedMarkdown);
        try { await mermaid.run({ nodes: prdContent.querySelectorAll('.language-mermaid, pre code.language-mermaid') }); } catch (mErr) {}
        codeOutput.textContent = generatedMarkdown;
        Prism.highlightElement(codeOutput);
        tabPreview.click();
    }

    async function openHistoryModal() {
        const history = getHistory();
        if (history.length === 0) {
            Swal.fire({ icon: 'info', title: 'Riwayat Kosong', text: 'Belum ada dokumen PRD yang pernah dibuat.', background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5' });
            return;
        }
        let historyHtml = `<div class="space-y-3 max-h-[60vh] overflow-y-auto text-left pr-1"><div class="flex justify-between items-center mb-2"><span class="text-xs text-slate-400">Menampilkan ${history.length} riwayat terakhir</span><button id="clear-all-history" class="text-xs text-rose-400 hover:underline">Hapus Semua</button></div>`;
        history.forEach((item) => {
            historyHtml += `<div class="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 space-y-1.5 hover:border-indigo-500/50 transition"><div class="flex justify-between items-start"><h4 class="text-xs font-semibold text-slate-200 line-clamp-1">${item.title}</h4><span class="text-[10px] text-slate-400">${item.timestamp}</span></div><p class="text-[11px] text-slate-400 line-clamp-2">Prompt: "${item.promptText}"</p><div class="flex justify-end space-x-2 pt-1"><button onclick="window.loadPrdHistory(${item.id})" class="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2.5 py-1 rounded transition">Muat/Buka</button><button onclick="window.deletePrdHistory(${item.id})" class="bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] px-2.5 py-1 rounded transition">Hapus</button></div></div>`;
        });
        historyHtml += `</div>`;
        Swal.fire({
            title: 'Riwayat Generasi PRD', html: historyHtml, background: '#0f172a', color: '#f8fafc',
            showConfirmButton: false, showCloseButton: true,
            didOpen: () => {
                const clearBtn = document.getElementById('clear-all-history');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        localStorage.removeItem('learndev_prd_history');
                        Swal.close();
                        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Semua riwayat dihapus.', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
                    });
                }
            }
        });
    }

    window.loadPrdHistory = (id) => {
        const history = getHistory();
        const item = history.find(h => h.id === id);
        if (item) { renderPrd(item.rawMarkdown); promptInput.value = item.promptText; Swal.close(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'PRD berhasil dimuat!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); }
    };
    window.deletePrdHistory = (id) => {
        let history = getHistory();
        history = history.filter(h => h.id !== id);
        localStorage.setItem('learndev_prd_history', JSON.stringify(history));
        Swal.close();
        openHistoryModal();
    };

    document.getElementById('btn-history').addEventListener('click', openHistoryModal);

    const BASE_PRD_SYSTEM_PROMPT = `Anda adalah Lead Product Manager dan System Architect ahli. Tugas Anda menghasilkan dokumen PRD dan file AGENTS.md yang 100% presisi, profesional, anti-AI-look, siap eksekusi.

# STRUKTUR WAJIB — 8 SECTION (TANPA TEKS PEMBUKA/PENUTUP):

## 1. Overview
- Latar Belakang, Tujuan, Target Pengguna, Key Value Proposition (poin pendek, tanpa narasi panjang).

## 2. Requirements
- Aksesibilitas & Device (Web, Mobile, Responsive mobile-first).
- User Roles & Permissions.
- Data Input & Validasi.
- Notification/User Feedback System.

## 3. Core Features
- Daftar MVP Features dengan detail fungsionalitas bullet-point.
- Setiap fitur wajib punya: state management, event listener, DOM update real-time.
- Wajib implementasi: localStorage persist, validasi input, kalkulasi live.
- DILARANG: onclick="" kosong, TODO stubs, console.log-only, alert("coming soon").

## 4. User Flow
- Step-by-step user journey dalam bullet-point ringkas.

## 5. Architecture
- Sequence Diagram menggunakan \`\`\`mermaid sequenceDiagram ... \`\`\`.
- Component & Dependency Map (Graphify-ready): hirarki file/fungsi secara jelas.
  Contoh:
  \`\`\`
  component-diagram
      App -> Auth: initialize
      Auth -> State: persist session
      State -> UI: render components
      UI -> API: fetch data
      API -> State: update cache
  \`\`\`

## 6. Database Schema
- ERD Diagram menggunakan \`\`\`mermaid erDiagram ... \`\`\`.
- Tabel penjelasan relasi & atribut entitas.

## 7. Design & Technical Constraints
- Tech Stack rekomendasi (Tailwind, vanilla JS, dll).
- Aturan tipografi & spacing.

## 8. Design System Specs (ANTI-AI LOOK — WAJIB PATUHI):

### Color Tokens (Presisi Hex + Tailwind):
- Primary: hex code spesifik (contoh: #6366f1 untuk indigo, bukan blue-600 generik).
- Secondary: hex code spesifik.
- Accent: hex code spesifik (SATU warna aksen saja, konsisten di semua button/badge/link).
- Background: hex code spesifik (surface bg).
- Surface: hex code spesifik (card bg).
- Text: hex code spesifik (primary text, secondary text, muted text).
- JANGAN pakai cyan/purple generic gradient.
- JANGAN pakai indigo-600/blue-600 Tailwind standar tanpa konteks UI yang jelas.

### Typography Rules:
- Font: Plus Jakarta Sans atau Inter (via Google Fonts).
- Heading: font-semibold tracking-tight, specific size/line-height.
- Body: font-normal leading-relaxed, specific size/line-height.
- Muted text: specific color hex, font-size ringan.

### Component & Spacing Rules:
- Border Radius: rounded-2xl atau rounded-3xl (BUKAN rounded-md kasar).
- Borders: border border-slate-200/60 (light) atau border-slate-800/80 (dark).
- Shadows: shadow-[0_8px_30px_rgb(0,0,0,0.04)] (BUKAN shadow-xl tebal).
- Micro-interactions: transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.
- Spacing: whitespace lega (p-6 gap-6), Bento Grid Cards layout.
- Mobile-first responsive: sm:, md:, lg: breakpoints yang eksplisit.
- Button states: default/hover/active/disabled — semua didefinisikan dengan hex & Tailwind.

### Negative Constraints (ATURAN DILARANG):
- ❌ DILARANG: Gradasi cyan/purple generik khas AI.
- ❌ DILARANG: indigo-600 / blue-600 Tailwind standar tanpa penyesuaian konteks.
- ❌ DILARANG: Komponen kaku tanpa responsivitas mobile-first.
- ❌ DILARANG: Neumorphism jadul, gradient norak, warna acak.
- ❌ DILARANG: placeholder.com, via.placeholder, empty img src, atau src="#".

### Mock Data Assets (MANDATORY):
- Sediakan array data bawaan (mock items, dummy users, sample transactions) dengan URL gambar Unsplash CDN nyata.
- Setiap mock item wajib punya field image: "https://images.unsplash.com/photo-XXXX?w=500&q=80".
- Layar TIDAK BOLEH kosong pada first load — semua data langsung tampil.

### Interaktivitas & UX Flow:
- Modal Pop-up (Struk Transaksi, Confirm Dialog).
- Toast Notifications.
- FontAwesome Icons di setiap tombol/badge/header.
- Fungsi kalkulasi (total harga, kembalian, filter pencarian) berjalan 100%.

## 9. OpenCode Execution Strategy (AGENTS.md Directive):

### Plan Mode (Wajib Sebelum Build):
1. Baca AGENTS.md ini secara utuh.
2. Analisis semua Component & Dependency Map di Section 5.
3. Identifikasi semua color tokens, typography rules, dan component specs di Section 8.
4. Buat rencana arsitektur file sebelum menulis kode.

### Build Mode (Setelah Plan):
1. Generate production-grade code dengan ZERO stubs.
2. Semua gambar pakai REAL Unsplash URLs.
3. Semua tombol punya addEventListener + state/DOM update.
4. Gunakan EXACT color hex dari Section 8 — JANGAN tebak atau ganti warna.
5. Ikuti mobile-first breakpoints yang sudah ditentukan.

### Token Optimization (9Router/RTK Ready):
- Format instruksi padat: bullet-point, tanpa teks naratif bertele-tele.
- Setiap section ringkas, ber-struktur, siap parse oleh AI agent.
- Maksimalkan fitur Token Saver/RTK pada 9Router: instruksi minimal, output maksimal.

# PRD — Project Requirements Document: [Nama Aplikasi]`;

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            console.log('Proses generate PRD dimulai...');
            try {
                const apiConfig = getApiConfig();
                if (!apiConfig.key) {
                    Swal.fire({
                        icon: 'warning', title: 'API Key Diperlukan',
                        text: 'Silakan isi API Key terlebih dahulu (Gemini atau 9Router).',
                        background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5'
                    }).then(() => { openApiKeyModal(); });
                    return;
                }

                const promptTextRaw = promptInput ? promptInput.value.trim() : '';
                if (!promptTextRaw) {
                    Swal.fire({ icon: 'warning', title: 'Prompt Kosong', text: 'Silakan masukkan ide aplikasi.', background: '#0f172a', color: '#f8fafc' });
                    return;
                }

                const uiThemeSelect = document.getElementById('uiTheme');
                const uiThemeCustom = document.getElementById('uiThemeCustom');
                let uiThemeValue = uiThemeSelect ? (uiThemeSelect.value || 'Auto Detect from Prompt (Rekomendasi AI)') : 'Auto Detect from Prompt (Rekomendasi AI)';
                if (uiThemeValue === 'custom' && uiThemeCustom) {
                    uiThemeValue = uiThemeCustom.value.trim() || 'Auto Detect from Prompt (Rekomendasi AI)';
                }
                if (uiThemeSelect && uiThemeSelect.value === 'custom' && uiThemeCustom && !uiThemeCustom.value.trim()) {
                    Swal.fire({ icon: 'warning', title: 'Input Tema Diperlukan', text: 'Silakan deskripsikan tema UI kustom.', background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5' }).then(() => { uiThemeCustom.focus(); });
                    return;
                }

                const toggleCompressEl = document.getElementById('toggle-compress');
                const toggleConciseEl = document.getElementById('toggle-concise');
                const toggleMinimalistEl = document.getElementById('toggle-minimalist');
                const toggleCompress = toggleCompressEl ? toggleCompressEl.checked : true;
                const toggleConcise = toggleConciseEl ? toggleConciseEl.checked : true;
                const toggleMinimalist = toggleMinimalistEl ? toggleMinimalistEl.checked : false;

                let promptText = promptTextRaw;
                if (toggleCompress) { promptText = promptTextRaw.replace(/\s+/g, ' ').trim(); }

                let dynamicSystemPrompt = BASE_PRD_SYSTEM_PROMPT;
                if (toggleConcise) { dynamicSystemPrompt += " Generate ONLY pure structured Markdown PRD. No conversational intro, no conversational conclusion."; }
                if (toggleMinimalist) { dynamicSystemPrompt += " Prioritize essential MVP features and lightweight lean architecture (YAGNI principle)."; }

                let uiThemeInstruction = "";
                if (uiThemeValue && uiThemeValue !== 'auto') {
                    uiThemeInstruction += `\n\nSECTION 8 OVERRIDE — UI/UX DESIGN SYSTEM & TAILWIND STYLING GUIDELINES:\n\na. Visual Vibe & Style Target: ${uiThemeValue}.\nb. Color Palette — Primary, Secondary, Background, Surface, Accent, Text: each dengan HEX code dan Tailwind CSS classes.\nc. Typography Rules — heading font family/size/line-height dan body font family/size/line-height.\nd. Component Styling — border radius, shadow effects, semua interactive button states (default/hover/active/disabled).\ne. Deliver usable Tailwind CSS Config (JSON) snippet dan CSS custom properties ready for copy-paste.\n\nSYSTEM NOTE FOR AI CODING AGENT: Strictly adhere to Color Palette dan Tailwind CSS design tokens defined di Section 8 saat generate semua UI components.`;
                }

                let fullPrompt = `${dynamicSystemPrompt}${uiThemeInstruction}\n\nIde Aplikasi: ${promptText}`;

                generateBtn.disabled = true;
                generateText.textContent = 'Generating PRD...';
                generateSpinner.classList.remove('hidden');

                const selectedModel = providerSelect ? providerSelect.value : 'gemini-2.5-flash';
                const modelsToTry = [selectedModel];
                if (!modelsToTry.includes('gemini-1.5-flash')) modelsToTry.push('gemini-1.5-flash');
                if (!modelsToTry.includes('gemini-1.5-pro')) modelsToTry.push('gemini-1.5-pro');

                let rawContent = '';
                let lastError = null;

                for (const model of modelsToTry) {
                    try {
                        let url;
                        if (apiConfig.provider === '9router' && apiConfig.baseUrl) {
                            url = `${apiConfig.baseUrl}/${model}:generateContent?key=${apiConfig.key}`;
                        } else {
                            url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiConfig.key}`;
                        }
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
                        });
                        const data = await response.json();
                        if (!response.ok) { throw new Error(data.error?.message || `Gagal menghubungi API (${model})`); }
                        rawContent = data.candidates[0].content.parts[0].text;
                        break;
                    } catch (err) {
                        lastError = err;
                        const errText = err.message.toLowerCase();
                        if (errText.includes('high demand') || errText.includes('503') || errText.includes('quota') || errText.includes('rate')) {
                            console.warn(`Model ${model} overloaded, mencoba fallback...`);
                            continue;
                        }
                        throw err;
                    }
                }

                if (!rawContent) { throw lastError || new Error('Semua model sedang sibuk. Silakan coba lagi nanti.'); }

                generatedMarkdown = rawContent.replace(/^```markdown\n/i, '').replace(/^```md\n/i, '').replace(/```$/, '').trim();
                saveHistoryItem(promptText, generatedMarkdown);
                renderPrd(generatedMarkdown);

                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Dokumen PRD berhasil digenerate.', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
            } catch (error) {
                console.error("Generate PRD Error:", error);
                const errLower = (error.message || '').toLowerCase();
                const isAuthError = errLower.includes('unauthorized') || errLower.includes('api key') || errLower.includes('key not valid') || errLower.includes('invalid') || errLower.includes('401') || errLower.includes('403');
                Swal.fire({
                    icon: 'error',
                    title: isAuthError ? 'API Key Tidak Valid' : 'Terjadi Kesalahan',
                    text: isAuthError ? 'API Key Tidak Valid atau Salah! Periksa konfigurasi endpoint (Gemini/9Router).' : ('Gagal generate PRD: ' + error.message),
                    background: '#0f172a', color: '#f8fafc', showCancelButton: true,
                    confirmButtonText: 'OK', cancelButtonText: 'Ubah API Key',
                    confirmButtonColor: '#4f46e5', cancelButtonColor: '#64748b'
                }).then((result) => { if (result.dismiss === Swal.DismissReason.cancel) { openApiKeyModal(); } });
                if (previewEmpty) previewEmpty.classList.remove('hidden');
                if (prdContent) prdContent.innerHTML = '';
            } finally {
                generateBtn.disabled = false;
                generateText.textContent = 'Generate PRD Document';
                generateSpinner.classList.add('hidden');
            }
        });
    }
});
