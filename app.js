document.addEventListener('DOMContentLoaded', () => {
    console.log("LearnDev Engine Initialized");
    try { if (typeof mermaid !== 'undefined') mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose', suppressErrorRendering: true }); } catch (e) { }
    try { if (typeof lucide !== 'undefined') lucide.createIcons(); } catch (e) { }

    const el = (id) => document.getElementById(id);
    const aiProvider = el('aiProvider');
    const promptInput = el('promptInput');
    const uiThemeSelect = el('uiTheme');
    const uiThemeCustom = el('uiThemeCustom');
    const btnGenerate = el('btnGenerate');
    const btnHistory = el('btnHistory');
    const btnApiKey = el('btnApiKey');
    const btnSettings = el('btnSettings');
    const btnCollapse = el('btnCollapse');
    const installBtn = el('installBtn');
    const tabPreview = el('tabPreview');
    const tabCode = el('tabCode');
    const previewContainer = el('previewContainer');
    const codeContainer = el('codeContainer');
    const prdPreview = el('prdPreview');
    const previewEmpty = el('previewEmpty');
    const skeletonLoader = el('skeletonLoader');
    const codeOutput = el('codeOutput');
    const generateText = el('generateText');
    const generateSpinner = el('generateSpinner');
    const panelConfig = el('panel-config');
    const panelResult = el('panel-result');
    const mobTabConfig = el('mob-tab-config');
    const mobTabResult = el('mob-tab-result');
    const floatingToolbar = el('floatingToolbar');
    const fabCopy = el('fabCopy');
    const fabPdf = el('fabPdf');
    const fabAgents = el('fabAgents');
    const fabDocx = el('fabDocx');
    const fabShare = el('fabShare');

    // Pulse animation cue on generate button when empty
    if (btnGenerate && previewEmpty) {
        btnGenerate.classList.add('animate-pulse-subtle');
    }

    let generatedMarkdown = '';
    let deferredPrompt = null;
    let isPanelCollapsed = localStorage.getItem('learndev_panel_collapsed') === 'true';
    let currentZoomLevel = 1;
    const ZOOM_STEP = 0.25;
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 3;

// ---------- Smart Context Detection ----------
const DOMAIN_KEYWORDS = {
    pos: ['pos', 'kasir', 'cashier', 'retail', 'transaksi', 'struk', 'sku', 'barcode', 'qrisk', 'tunai', 'pembayaran', 'inventory', 'stok', 'gudang', 'penjualan'],
    ecommerce: ['ecommerce', 'e-commerce', 'toko online', 'belanja', 'produk', 'keranjang', 'checkout', 'pembelian', 'marketplace', 'pesanan'],
    saas: ['saas', 'software as a service', 'dashboard', 'langganan', 'subscription', 'multi-tenant', 'billing', 'invoice', 'api', 'enterprise'],
    kanban: ['kanban', 'task', 'tugas', 'board', 'board tugas', 'project management', 'manajemen proyek', 'workflow', 'papan'],
    portfolio: ['portfolio', 'portofolio', 'personal website', 'situs pribadi', 'resume', 'cv', 'showcase', 'galeri karya'],
    crm: ['crm', 'customer relationship', 'pelanggan', 'kontak', 'lead', 'prospek', 'pipeline sales', 'pipelines'],
};
function detectDomainContext(prompt) {
    const p = prompt.toLowerCase();
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        const hits = keywords.filter(k => p.includes(k));
        if (hits.length >= 2) return { domain, hints: hits };
    }
    return { domain: null, hints: [] };
}
function domainContextHint(ctx) {
    if (!ctx.domain) return '';
    const hints = {
        pos: 'Sertakan modul: katalog produk dengan barcode/SKU, keranjang kasir, pembayaran tunai/card/QRIS, cetak struk thermal (ESC/POS), pengembalian uang (kembalian), pencarian SKU, manajemen stok, laporan penjualan harian, dan reconciliasi tutup kasir.',
        ecommerce: 'Sertakan modul: katalog produk dengan kategori, keranjang belanja, multi-payment checkout, manajemen akun user, notifikasi push, admin dashboard produk & penjualan, ulasan produk, dan wishlist.',
        saas: 'Sertakan modul: multi-tenant, manajemen langganan (free/pro/enterprise), billing otomatis, real-time analytics, manajemen peran user, API access, integrasi marketplace, audit log, dan onboarding wizard.',
        kanban: 'Sertakan modul: papan tugas (board), manajemen task, alur kerja (workflow), penugasan anggota, tanggal jatuh tempo, dan pelacakan progres proyek.',
        portfolio: 'Sertakan modul: halaman profil, galeri karya, daftar proyek, testimoni, kontak, dan resume/CV download.',
        crm: 'Sertakan modul: manajemen kontak pelanggan, tracking lead, pipeline penjualan, interaksi pelanggan, dan laporan konversi.'
    };
    return '\\n\\nDOMAIN DETECTED: ' + ctx.domain + ' (kunci: ' + ctx.hints.join(', ') + ')\\n' + (hints[ctx.domain] || '');
}

// ---------- Live Progress Steps ----------
const progressStepsText = [
    '[1/4] Analyzing App Context & Requirements...',
    '[2/4] Injecting Design Tokens & Unsplash Real Assets...',
    '[3/4] Generating Architecture & Database Schema...',
    '[4/4] Validating Mermaid Diagrams & Finalizing AGENTS.md...'
];
let progressInterval = null;
function showProgressStep(stepIndex) {
    const panel = el('progressSteps');
    const stepText = el('progressStepText');
    const bar = el('progressBar');
    const list = el('progressStepsList');
    if (!panel) return;
    panel.classList.remove('hidden');
    if (stepText) stepText.textContent = progressStepsText[stepIndex] || '';
    if (bar) bar.style.width = Math.round(((stepIndex + 1) / 4) * 100) + '%';
    if (list) {
        Array.from(list.children).forEach((child, idx) => {
            const num = child.querySelector('span:first-child');
            const label = child.querySelector('span:last-child');
            if (idx === stepIndex) {
                num.className = 'w-6 h-6 rounded-full bg-indigo-500 text-xs font-bold text-white flex items-center justify-center';
                label.className = 'text-xs text-indigo-300 font-medium';
                child.querySelector('div')?.classList.replace('bg-slate-700', 'bg-indigo-500');
            } else if (idx < stepIndex) {
                num.className = 'w-6 h-6 rounded-full bg-emerald-500 text-xs font-bold text-white flex items-center justify-center';
                label.className = 'text-xs text-emerald-200';
                child.querySelector('div')?.classList.replace('bg-slate-700', 'bg-emerald-500');
            } else {
                num.className = 'w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-slate-400 flex items-center justify-center';
                label.className = 'text-xs text-slate-500';
                child.querySelector('div')?.classList.replace('bg-indigo-500', 'bg-slate-700');
            }
        });
    }
}
function hideProgress() {
    const panel = el('progressSteps');
    if (panel) panel.classList.add('hidden');
    if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
}
function startProgressAnimation() {
    hideProgress();
    let idx = 0;
    showProgressStep(idx);
    progressInterval = setInterval(() => {
        idx = (idx + 1) % 4;
        showProgressStep(idx);
    }, 900);
}



if (uiThemeSelect && uiThemeCustom) {
    uiThemeSelect.addEventListener('change', () => {
        if (uiThemeSelect.value === 'custom') { uiThemeCustom.classList.remove('hidden'); uiThemeCustom.focus(); }
        else { uiThemeCustom.classList.add('hidden'); uiThemeCustom.value = ''; }
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { }); });
}
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    if (installBtn) { installBtn.classList.remove('hidden'); installBtn.classList.add('flex'); }
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

// Collapsible panel â€” desktop only (mobile uses tab nav)
const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;
function applyPanelState() {
    const cIcon = btnCollapse?.querySelector('.fa-arrows-left-right');
    const xIcon = btnCollapse?.querySelector('.fa-xmark');
    if (isPanelCollapsed && isDesktop()) {
        panelConfig.classList.add('md:!hidden');
        panelResult.classList.remove('md:col-span-7', 'xl:col-span-8');
        panelResult.classList.add('md:col-span-12');
        cIcon?.classList.add('hidden'); xIcon?.classList.remove('hidden');
    } else {
        panelConfig.classList.remove('md:!hidden');
        panelResult.classList.add('md:col-span-7', 'xl:col-span-8');
        panelResult.classList.remove('md:col-span-12');
        xIcon?.classList.add('hidden'); cIcon?.classList.remove('hidden');
        if (!isDesktop()) { isPanelCollapsed = false; }
    }
    localStorage.setItem('learndev_panel_collapsed', isPanelCollapsed);
}
if (btnCollapse) btnCollapse.addEventListener('click', () => { isPanelCollapsed = !isPanelCollapsed; applyPanelState(); });
window.addEventListener('resize', () => { if (!isDesktop() && isPanelCollapsed) applyPanelState(); });
applyPanelState();

});
// Autosave draft & restore last session (survives tab close / refresh)
const LS_DRAFT = 'learndev_draft', LS_LAST = 'learndev_last_prd';
let draftTimer = null;
function saveDraft() {
    try {
        localStorage.setItem(LS_DRAFT, JSON.stringify({
            prompt: promptInput?.value || '',
            provider: aiProvider?.value || '',
            theme: uiThemeSelect?.value || 'auto',
            themeCustom: uiThemeCustom?.value || ''
        }));
    } catch (e) { }
}
function loadDraft() {
    try {
        const d = JSON.parse(localStorage.getItem(LS_DRAFT)) || {};
        if (d.prompt && promptInput) promptInput.value = d.prompt;
        if (d.provider && aiProvider) aiProvider.value = d.provider;
        if (d.theme && uiThemeSelect) uiThemeSelect.value = d.theme;
        if (d.themeCustom && uiThemeCustom) {
            uiThemeCustom.value = d.themeCustom;
            if (d.theme === 'custom') uiThemeCustom.classList.remove('hidden');
        }
    } catch (e) { }
}
promptInput?.addEventListener('input', () => { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 400); });
aiProvider?.addEventListener('change', saveDraft);
uiThemeSelect?.addEventListener('change', saveDraft);
uiThemeCustom?.addEventListener('input', () => { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 400); });
loadDraft();

// Restore last generated PRD, or load one shared via #prd=<encoded> link
(async () => {
    if (location.hash.startsWith('#prd=')) {
        const enc = location.hash.slice(5);
        try {
            await renderPrd(await decompressFromB64url(enc));
            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'PRD dibuka dari tautan bagikan.', background: '#0f172a', color: '#f8fafc', timer: 2500, showConfirmButton: false });
            return;
        } catch (e) {
            try { await renderPrd(decodeURIComponent(enc)); return; } catch (e2) { console.warn('Share link decode failed:', e2); }
        }
    }
    try {
        const last = JSON.parse(localStorage.getItem(LS_LAST));
        if (last && last.md) await renderPrd(last.md);
    } catch (e) { }
})();

const getGeminiKey = () => localStorage.getItem('learndev_gemini_key') || '';
const setGeminiKey = (k) => localStorage.setItem('learndev_gemini_key', k.trim());
const getBaseUrl = () => localStorage.getItem('learndev_api_base_url') || '';
const setBaseUrl = (u) => localStorage.setItem('learndev_api_base_url', u.trim());
const getProvider = () => localStorage.getItem('learndev_api_provider') || 'gemini';
const setProvider = (p) => localStorage.setItem('learndev_api_provider', p);

function getApiConfig() {
    const p = getProvider(), b = getBaseUrl();
    if (p === '9router' && b) return { provider: p, baseUrl: b.replace(/\/+$/, ''), key: localStorage.getItem('learndev_9router_key') || '' };
    return { provider: p, baseUrl: '', key: getGeminiKey() };
}

async function openApiKeyModal() {
    const curProv = getProvider(), curBase = getBaseUrl();
    const { value: ok } = await Swal.fire({
        title: 'Pengaturan API Key & Endpoint',
        html: `
                <div class="space-y-3 text-left">
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">AI Provider</label>
                        <select id="swal-prov" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm">
                            <option value="gemini" ${curProv === 'gemini' ? 'selected' : ''}>Google Gemini (Direct)</option>
                            <option value="9router" ${curProv === '9router' ? 'selected' : ''}>9Router Gateway</option>
                        </select>
                    </div>
                    <div id="swal-gem" class="${curProv === '9router' ? 'hidden' : ''}">
                        <label class="block text-xs font-medium text-slate-300 mb-1">Google Gemini API Key</label>
                        <input type="password" id="swal-gem-key" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm" placeholder="AIza..." value="${getGeminiKey()}">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[11px] text-indigo-400 hover:underline mt-1 inline-block">Dapatkan Gemini Key Gratis</a>
                    </div>
                    <div id="swal-9r" class="${curProv === 'gemini' ? 'hidden' : ''}">
                        <label class="block text-xs font-medium text-slate-300 mb-1">9Router API Key</label>
                        <input type="password" id="swal-9r-key" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm" placeholder="sk-..." value="${localStorage.getItem('learndev_9router_key') || ''}">
                        <label class="block text-xs font-medium text-slate-300 mb-1 mt-2">9Router Base URL</label>
                        <input type="text" id="swal-9r-url" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm" placeholder="http://localhost:20128/v1" value="${curBase}">
                        <a href="https://github.com/decolua/9router" target="_blank" class="text-[11px] text-emerald-400 hover:underline mt-1 inline-block">Dapatkan 9Router</a>
                    </div>
                </div>`,
        background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5', confirmButtonText: 'Simpan', showCancelButton: true, cancelButtonText: 'Batal',
        didOpen: () => {
            const s = document.getElementById('swal-prov'), g = document.getElementById('swal-gem'), r = document.getElementById('swal-9r');
            if (s) s.addEventListener('change', (e) => { if (e.target.value === '9router') { g.classList.add('hidden'); r.classList.remove('hidden'); } else { g.classList.remove('hidden'); r.classList.add('hidden'); } });
        },
        preConfirm: () => {
            const p = document.getElementById('swal-prov')?.value || 'gemini';
            setProvider(p);
            if (p === 'gemini') setGeminiKey(document.getElementById('swal-gem-key')?.value || '');
            else { localStorage.setItem('learndev_9router_key', document.getElementById('swal-9r-key')?.value || ''); setBaseUrl(document.getElementById('swal-9r-url')?.value || ''); }
            return true;
        }
    });
    if (ok) Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Konfigurasi disimpan!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
}

if (btnApiKey) btnApiKey.addEventListener('click', openApiKeyModal);
if (btnSettings) btnSettings.addEventListener('click', () => {
    const p = getProvider(), b = getBaseUrl();
    Swal.fire({ title: '9Router & Endpoint Configuration', html: `<div class="space-y-3 text-left"><div class="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3"><div class="text-xs text-slate-400 mb-1">Current Provider</div><div class="text-sm font-semibold ${p === '9router' ? 'text-emerald-400' : 'text-indigo-400'}">${p === '9router' ? '9Router Gateway' : 'Google Gemini (Direct)'}</div></div><div class="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3"><div class="text-xs text-slate-400 mb-1">Base URL</div><div class="text-sm font-mono text-slate-200 break-all">${b || 'Not configured (uses Gemini direct)'}</div></div><div class="text-[11px] text-slate-500">Change via <strong class="text-slate-300">API Key</strong> button.</div></div>`, background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5', confirmButtonText: 'OK' });
});

if (tabPreview && tabCode && previewContainer && codeContainer) {
    tabPreview.addEventListener('click', () => {
        tabPreview.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white shadow-sm transition";
        tabCode.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition";
        previewContainer.classList.remove('hidden'); codeContainer.classList.add('hidden');
    });
    tabCode.addEventListener('click', () => {
        tabCode.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-600 text-white shadow-sm transition";
        tabPreview.className = "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition";
        codeContainer.classList.remove('hidden'); previewContainer.classList.add('hidden');
    });
}

if (mobTabConfig && mobTabResult && panelConfig && panelResult) {
    mobTabConfig.addEventListener('click', () => {
        panelConfig.classList.remove('hidden'); panelResult.classList.add('hidden');
        mobTabConfig.className = "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold bg-indigo-600 text-white border-b-2 border-indigo-500 transition";
        mobTabResult.className = "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";
    });
    mobTabResult.addEventListener('click', () => {
        panelConfig.classList.add('hidden'); panelResult.classList.remove('hidden');
        mobTabConfig.className = "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition";
        mobTabResult.className = "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold bg-indigo-600 text-white border-b-2 border-indigo-500 transition";
    });
}

function getHistory() { try { return JSON.parse(localStorage.getItem('learndev_prd_history')) || []; } catch { return []; } }
function saveHistoryItem(prompt, markdown) {
    const h = getHistory(), m = markdown.match(/^#\s+(.*)/m), t = m ? m[1] : (prompt.substring(0, 40) + '...');
    const n = { id: Date.now(), timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }), title: t.trim(), promptText: prompt, rawMarkdown: markdown };
    h.unshift(n); if (h.length > 15) h.pop(); localStorage.setItem('learndev_prd_history', JSON.stringify(h));
}

function showSkeleton() {
    if (previewEmpty) previewEmpty.classList.add('hidden');
    if (prdPreview) prdPreview.classList.add('hidden');
    if (skeletonLoader) skeletonLoader.classList.remove('hidden');
}
function hideSkeleton() {
    if (skeletonLoader) skeletonLoader.classList.add('hidden');
    if (prdPreview) prdPreview.classList.remove('hidden');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cleanMermaidCode(code) {
    if (!code) return '';
    let cleaned = code
        .replace(/\r/g, '')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/```mermaid/gi, '')
        .replace(/```/g, '')
        .trim();

    // LLMs sometimes omit the mandatory diagram-type line; sniff the body and
    // prepend the right one so mermaid detects the type — and the repair
    // branches below (gated on that header) also run.
    const MERMAID_TYPES = /^(graph|flowchart|erDiagram|sequenceDiagram|classDiagram|stateDiagram|pie|gantt|journey|gitGraph)\b/i;
    if (cleaned && !MERMAID_TYPES.test(cleaned)) {
        const isFlowchart = /-->|---|==>|-\.->|\[[^\]]*["']/.test(cleaned);
        const isEr = !isFlowchart && (/(?:\|\||\}o|o\{|\|\{|\}\|)/.test(cleaned) || /^[A-Za-z_]\w*\s*\{/m.test(cleaned) || /\b(?:PK|FK)\b/.test(cleaned));
        cleaned = (isEr ? 'erDiagram' : 'graph TD') + '\n' + cleaned;
    }

    if (cleaned.startsWith('graph') || cleaned.startsWith('flowchart')) {
        // LLM often packs all relations onto one line; split before every
        // "NodeId[" or "NodeId -->" that follows a node ref / closing bracket / quote
        // (never after "|", ">" or "-", so arrow targets and labels stay intact)
        cleaned = cleaned.replace(
            /([\]\)])\s*(?=[A-Za-z][A-Za-z0-9_]*(?:\[|\s*(?:-->|---|==>|-\.->)))/g,
            '$1\n'
        );
        cleaned = cleaned.replace(
            /(["'\]\)]|[A-Za-z0-9_])\s+(?=[A-Za-z][A-Za-z0-9_]*(?:\[|\s*(?:-->|---|==>|-\.->)))/g,
            '$1\n'
        );

        let lines = cleaned.split('\n');
        let fixedLines = [];
        for (let line of lines) {
            let l = line.trim();
            // Convert pseudo-colon syntax: NodeA --> NodeB : "Label" -> NodeA -->|"Label"| NodeB
            l = l.replace(
                /^(\s*[A-Za-z0-9_]+(?:\s*\[[^\]]+\]|\s*\([^)]+\)|\s*\{[^}]+\})?)\s*(-->|---|==>|-\.->|->)\s*([A-Za-z0-9_]+(?:\s*\[[^\]]+\]|\s*\([^)]+\)|\s*\{[^}]+\})?)\s*:\s*(.+)$/,
                (match, from, arrow, to, rawLabel) => {
                    const cleanLabel = rawLabel.trim().replace(/^["']|["'];?$/g, '').replace(/;$/, '').replace(/"/g, "'").trim();
                    const normArrow = arrow === '->' ? '-->' : arrow;
                    return `${from} ${normArrow}|"${cleanLabel}"| ${to}`;
                }
            );
            l = l.replace(/(\[[^\]]+\])([A-Za-z0-9_]+)$/, '$1');
            if (l === '-->' || l === '---' || l === '-.-' || !l) continue;
            l = l.replace(/([A-Za-z0-9_]+)\[([^\]]*)$/, (match, id, text) => {
                return `${id}["${text.replace(/"/g, '')}"]`;
            });
            fixedLines.push(l);
        }
        cleaned = fixedLines.join('\n');
    }

    if (cleaned.startsWith('erDiagram')) {
        const ER_TYPES = ['string', 'text', 'int', 'integer', 'bigint', 'smallint', 'tinyint', 'serial', 'bigserial', 'float', 'double', 'decimal', 'numeric', 'real', 'number', 'boolean', 'bool', 'date', 'datetime', 'timestamp', 'timestamptz', 'time', 'interval', 'uuid', 'json', 'jsonb', 'blob', 'binary', 'bytea', 'char', 'varchar', 'nchar', 'nvarchar', 'longtext', 'enum'];
        const isErType = w => ER_TYPES.includes(w.toLowerCase().replace(/[^a-z]/g, ''));
        // Quote-aware tokenizer: splits an entity body into raw word/comment
        // tokens whether the LLM separated attributes with commas, spaces, or nothing
        const tokenizeAttrs = s => {
            const pct = s.indexOf('%%');
            if (pct !== -1) s = s.slice(0, pct);
            const tokens = [];
            let i = 0, n = s.length;
            const isSpace = c => c === ',' || c === ' ' || c === '\t';
            while (i < n) {
                const c = s[i];
                if (c === '"') {
                    const end = s.indexOf('"', i + 1);
                    const stop = end === -1 ? n : end + 1;
                    tokens.push({ q: s.slice(i, stop) });
                    i = stop;
                } else if (isSpace(c)) {
                    i++;
                } else if (c === '(') {
                    const end = s.indexOf(')', i);
                    i = end === -1 ? n : end + 1;
                } else {
                    let j = i;
                    while (j < n && !isSpace(s[j]) && s[j] !== '"' && s[j] !== '(') j++;
                    tokens.push({ w: s.slice(i, j) });
                    i = j;
                }
            }
            return tokens;
        };
        // Group raw tokens into attributes: type name [PK|FK] ["comment"],
        // restarting a new attribute only when a known type word appears, so a
        // stray qualifier word stays attached to its attribute instead of eating the next one
        const attrsFromTokens = tokens => {
            const groups = [];
            let cur = null, expect = 'type';
            for (const tk of tokens) {
                if (tk.q) {
                    if (cur) { cur.comment = tk.q; groups.push(cur); cur = null; expect = 'type'; }
                    continue;
                }
                if (expect === 'type') { cur = { words: [tk.w], key: '', comment: '' }; expect = 'name'; }
                else if (expect === 'name') { cur.words.push(tk.w); expect = 'optional'; }
                else if (/^(pk|fk)$/i.test(tk.w)) { if (!cur.key) cur.key = tk.w.toUpperCase(); }
                else if (isErType(tk.w)) { groups.push(cur); cur = { words: [tk.w], key: '', comment: '' }; expect = 'name'; }
                else { cur.words.push(tk.w); }
            }
            if (cur) groups.push(cur);
            const lines = [];
            for (const g of groups) {
                const w = g.words;
                if (w.length > 2 && !w.some(isErType)) {
                    // no type marker anywhere: treat every word as a bare column name
                    w.forEach((x, i) => lines.push([i === w.length - 1 ? g.key : '', i === w.length - 1 ? g.comment : '']
                        .filter(Boolean).length
                        ? `string ${x} ${[g.key, g.comment].filter(Boolean).join(' ')}`
                        : `string ${x}`));
                    continue;
                }
                let type, name;
                if (w.length >= 2) {
                    if (!isErType(w[0]) && isErType(w[1])) { type = w[1]; name = w[0]; }
                    else { type = w[0]; name = w[1]; }
                } else if (w.length === 1) { type = 'string'; name = w[0]; }
                else continue;
                const line = [type, name, g.key, g.comment].filter(Boolean).join(' ');
                if (line) lines.push(line);
            }
            return lines;
        };
        const attrsFromText = s => attrsFromTokens(tokenizeAttrs(s));
        const isRelation = l => /(\|\||\}\||\|\{|\}o|o\{|o\||\|o)/.test(l);
        const lines = cleaned.split('\n');
        const out = [];
        let inBlock = false;
        for (let line of lines) {
            const t = line.trim();
            if (!t || isRelation(t)) { out.push(line); continue; }
            const open = t.indexOf('{'), close = t.lastIndexOf('}');
            if (open !== -1 && close > open) {
                const head = t.slice(0, open).trim();
                const inner = t.slice(open + 1, close);
                const tail = t.slice(close + 1).trim();
                out.push(head + ' {');
                attrsFromText(inner).forEach(a => out.push('  ' + a));
                out.push('}' + (tail ? ' ' + tail : ''));
                inBlock = false;
                continue;
            }
            if (t.endsWith('{')) { out.push(line); inBlock = true; continue; }
            if (t.startsWith('}')) { out.push(line); inBlock = false; continue; }
            if (inBlock) {
                attrsFromText(t).forEach(a => out.push('  ' + a));
                continue;
            }
            out.push(line);
        }
        cleaned = out.join('\n');
    }

    return cleaned;
}

function addMermaidControls(wrapper) {
    const mermaidEl = wrapper.querySelector('.mermaid');
    if (!mermaidEl || wrapper.querySelector('.mermaid-controls')) return;
    const controls = document.createElement('div');
    controls.className = 'mermaid-controls flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 mb-2 shadow-lg shadow-black/30';
    controls.innerHTML = `
            <button class="mermaid-zoom-in w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition text-xs" title="Zoom In"><i class="fa-solid fa-plus"></i></button>
            <button class="mermaid-zoom-out w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition text-xs" title="Zoom Out"><i class="fa-solid fa-minus"></i></button>
            <button class="mermaid-fullscreen w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition text-xs" title="Fullscreen Preview"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>
            <div class="w-px h-4 bg-slate-700 mx-0.5"></div>
            <button class="mermaid-download-svg w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition text-xs" title="Download SVG"><i class="fa-solid fa-download"></i></button>
            <button class="mermaid-download-png w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-xs" title="Download JPG / PNG"><i class="fa-solid fa-image"></i></button>
        `;
    wrapper.style.position = 'relative';
    wrapper.insertBefore(controls, mermaidEl);

    let zoom = 1;
    controls.querySelector('.mermaid-zoom-in').addEventListener('click', () => {
        zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP);
        mermaidEl.style.transform = `scale(${zoom})`;
        mermaidEl.style.transformOrigin = 'top left';
    });
    controls.querySelector('.mermaid-zoom-out').addEventListener('click', () => {
        zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP);
        mermaidEl.style.transform = `scale(${zoom})`;
        mermaidEl.style.transformOrigin = 'top left';
    });
    controls.querySelector('.mermaid-fullscreen').addEventListener('click', () => openMermaidFullscreen(mermaidEl));
    controls.querySelector('.mermaid-download-svg').addEventListener('click', () => {
        const svgEl = mermaidEl.querySelector('svg');
        if (!svgEl) return;
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = 'mermaid-diagram.svg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });
    controls.querySelector('.mermaid-download-png').addEventListener('click', () => chooseMermaidDownload(mermaidEl));
}

// Renders the diagram offscreen with htmlLabels disabled so the SVG contains
// no <foreignObject> Ã¢â‚¬â€ the element that taints the canvas and blocks toBlob().
// On-screen rendering keeps htmlLabels enabled; only the export copy is plain SVG.
async function downloadRaster(wrapper, format) {
    const code = wrapper && wrapper.dataset.mermaidCode;
    if (!code || typeof mermaid === 'undefined') {
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Source diagram tidak tersedia.', background: '#0f172a', color: '#f8fafc', timer: 2500, showConfirmButton: false });
        return;
    }
    const cfg = mermaid.mermaidAPI.getConfig();
    const prev = { htmlLabels: cfg.htmlLabels, flowchart: { htmlLabels: cfg.flowchart && cfg.flowchart.htmlLabels }, sequence: { textPlacement: cfg.sequence && cfg.sequence.textPlacement } };
    await mermaid.initialize({ htmlLabels: false, flowchart: { htmlLabels: false }, sequence: { textPlacement: 'inline' } });
    let svgEl;
    try {
        const out = await mermaid.render('export-svg-' + Date.now(), code);
        const tmp = document.createElement('div');
        tmp.innerHTML = out.svg;
        svgEl = tmp.querySelector('svg');
    } catch (e) {
        console.warn('Export render failed:', e);
    } finally {
        await mermaid.initialize(prev);
    }
    if (!svgEl) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Gagal merender ulang diagram.', background: '#0f172a', color: '#f8fafc', timer: 2500, showConfirmButton: false });
        return;
    }

    const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
    const w = (vb && vb.width) || 800;
    const h = (vb && vb.height) || 600;
    svgEl.setAttribute('width', w);
    svgEl.setAttribute('height', h);
    svgEl.style.maxWidth = '';
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const domURL = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
        try {
            canvas.width = w * 2; canvas.height = h * 2;
            ctx.scale(2, 2); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(domURL);
            const isJpg = format === 'jpg';
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob), a = document.createElement('a');
                a.href = url; a.download = isJpg ? 'mermaid-diagram.jpg' : 'mermaid-diagram.png';
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Diagram diunduh (${isJpg ? 'JPG' : 'PNG'})!`, background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
            }, isJpg ? 'image/jpeg' : 'image/png', isJpg ? 0.95 : undefined);
        } catch (e) {
            console.warn('Export rasterize failed:', e);
            URL.revokeObjectURL(domURL);
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Diagram ini mengandung elemen (mis. rumus KaTeX) yang diblokir browser dari ekspor gambar.', background: '#0f172a', color: '#f8fafc', timer: 3500, showConfirmButton: false });
        }
    };
    img.onerror = () => { URL.revokeObjectURL(domURL); Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Gagal merasterisasi diagram.', background: '#0f172a', color: '#f8fafc', timer: 2500, showConfirmButton: false }); };
    img.src = domURL;
}

async function chooseMermaidDownload(mermaidEl) {
    const wrapper = mermaidEl.closest('.mermaid-wrapper');
    if (!wrapper) return;
    const res = await Swal.fire({
        title: 'Unduh Diagram',
        text: 'Pilih format gambar:',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'PNG',
        denyButtonText: 'JPG',
        cancelButtonText: 'Batal',
        background: '#0f172a', color: '#f8fafc',
        confirmButtonColor: '#4f46e5', denyButtonColor: '#7c3aed', cancelButtonColor: '#64748b'
    });
    if (res.isConfirmed) downloadRaster(wrapper, 'png');
    else if (res.isDenied) downloadRaster(wrapper, 'jpg');
}

function openMermaidFullscreen(mermaidEl) {
    const wrapper = mermaidEl.closest('.mermaid-wrapper');
    if (!wrapper) return;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if ((document.fullscreenElement || document.webkitFullscreenElement) && exit) { exit.call(document); return; }
    const req = wrapper.requestFullscreen || wrapper.webkitRequestFullscreen;
    if (req) req.call(wrapper);
}

async function renderPrd(markdownText) {
    generatedMarkdown = markdownText;
    if (document.fullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    if (btnGenerate) btnGenerate.classList.remove('animate-pulse-subtle');
    showSkeleton();
    hideSkeleton();
    // Fence labels the LLM uses for diagram code that is really mermaid syntax
    const DIAGRAM_LANGS = ['mermaid', 'erdiagram', 'er', 'graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'pie', 'gantt', 'journey', 'gitgraph'];
    if (prdPreview) prdPreview.innerHTML = marked.parse(generatedMarkdown);

    if (typeof mermaid !== 'undefined' && prdPreview) {
        const blocks = Array.from(prdPreview.querySelectorAll('pre code[class*="language-"]')).filter(el => {
            const m = /language-([a-z-]+)/i.exec(el.className || '');
            return m && DIAGRAM_LANGS.includes(m[1].toLowerCase());
        });
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const preEl = block.closest('pre') || block;
            const rawCode = block.textContent || '';
            const cleanCode = cleanMermaidCode(rawCode);
            const containerId = 'mermaid-svg-' + Date.now() + '-' + i;

            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-wrapper my-6 bg-slate-900/90 border border-slate-800 rounded-xl p-4 overflow-x-auto shadow-md';
            wrapper.dataset.mermaidCode = cleanCode;

            try {
                const { svg } = await mermaid.render(containerId, cleanCode);
                wrapper.innerHTML = `<div class="mermaid flex justify-center">${svg}</div>`;
                preEl.replaceWith(wrapper);
                addMermaidControls(wrapper);
            } catch (e) {
                console.warn('Mermaid render warning:', e);
                const errDiv = document.getElementById(containerId);
                if (errDiv) errDiv.remove();
                wrapper.innerHTML = `
                    <div class="flex items-center justify-between text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg mb-2">
                        <span class="font-medium"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i> Diagram Code (Syntax Warning)</span>
                    </div>
                    <pre class="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto"><code>${escapeHtml(cleanCode)}</code></pre>
                `;
                preEl.replaceWith(wrapper);
            }
        }
    }

    if (codeOutput) {
        codeOutput.textContent = generatedMarkdown;
        if (typeof Prism !== 'undefined') {
            // prism-markdown auto-loads a component for every fence language label;
            // mermaid pseudo-languages don't exist on cdnjs and 404 â€” register stand-ins
            DIAGRAM_LANGS.forEach(lang => {
                if (!Prism.languages[lang]) Prism.languages[lang] = Prism.languages.markup || {};
            });
            Prism.highlightElement(codeOutput);
        }
    }
    if (tabPreview) tabPreview.click();
    if (floatingToolbar) floatingToolbar.classList.remove('hidden');
}
async function openHistoryModal() {
    const h = getHistory();
    if (h.length === 0) { Swal.fire({ icon: 'info', title: 'Riwayat Kosong', text: 'Belum ada PRD.', background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5' }); return; }
    let html = `<div class="space-y-3 max-h-[60vh] overflow-y-auto text-left pr-1"><div class="flex justify-between items-center mb-2"><span class="text-xs text-slate-400">Menampilkan ${h.length} riwayat</span><button id="clear-all-history" class="text-xs text-rose-400 hover:underline">Hapus Semua</button></div>`;
    h.forEach(item => { html += `<div class="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 space-y-1.5 hover:border-indigo-500/50 transition"><div class="flex justify-between items-start"><h4 class="text-xs font-semibold text-slate-200 line-clamp-1">${item.title}</h4><span class="text-[10px] text-slate-400">${item.timestamp}</span></div><p class="text-[11px] text-slate-400 line-clamp-2">Prompt: "${item.promptText}"</p><div class="flex justify-end space-x-2 pt-1"><button onclick="window.loadPrdHistory(${item.id})" class="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2.5 py-1 rounded transition">Muat/Buka</button><button onclick="window.deletePrdHistory(${item.id})" class="bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] px-2.5 py-1 rounded transition">Hapus</button></div></div>`; });
    html += `</div>`;
    Swal.fire({
        title: 'Riwayat Generasi PRD', html, background: '#0f172a', color: '#f8fafc', showConfirmButton: false, showCloseButton: true, didOpen: () => {
            const c = document.getElementById('clear-all-history');
            if (c) c.addEventListener('click', () => { localStorage.removeItem('learndev_prd_history'); Swal.close(); Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Semua riwayat dihapus.', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); });
        }
    });
}
window.loadPrdHistory = (id) => { const h = getHistory(), it = h.find(x => x.id === id); if (it) { renderPrd(it.rawMarkdown); if (promptInput) promptInput.value = it.promptText; Swal.close(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'PRD dimuat!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); } };
window.deletePrdHistory = (id) => { let h = getHistory(); h = h.filter(x => x.id !== id); localStorage.setItem('learndev_prd_history', JSON.stringify(h)); Swal.close(); openHistoryModal(); };
if (btnHistory) btnHistory.addEventListener('click', openHistoryModal);

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Disalin!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }));
}

// Share via instant link: PRD compressed with native CompressionStream -> #prd=<base64url>
async function compressToB64url(text) {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function decompressFromB64url(b64) {
    const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
}
async function sharePrdLink() {
    if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk dibagikan!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
    try {
        const enc = (typeof CompressionStream !== 'undefined') ? await compressToB64url(generatedMarkdown) : encodeURIComponent(generatedMarkdown);
        const url = `${location.origin}${location.pathname}#prd=${enc}`;
        await navigator.clipboard.writeText(url);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tautan disalin! Bagikan ke tim.', background: '#0f172a', color: '#f8fafc', timer: 2500, showConfirmButton: false });
    } catch (e) {
        console.warn('Share failed:', e);
        Swal.fire({ icon: 'error', title: 'Gagal membuat tautan', text: 'Browser memblokir clipboard atau tidak mendukung kompresi native. Salin PRD sebagai markdown sebagai gantinya.', background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5' });
    }
}
if (fabShare) fabShare.addEventListener('click', sharePrdLink);

    if (fabCopy) fabCopy.addEventListener('click', () => { if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; } copyToClipboard(generatedMarkdown); });
    if (fabPdf) fabPdf.addEventListener('click', () => {
        if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Proses generate PDF dimulai...', background: '#0f172a', color: '#f8fafc', timer: 2000, showConfirmButton: false });
        const opt = { margin: 10, filename: 'PRD-LearnDev.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(prdPreview).save();
    });

// DOCX export: markdown -> HTML blob (application/msword), opens editable in Word/LibreOffice/Docs
function downloadDocx() {
    if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
    const body = marked.parse(generatedMarkdown);
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#0f172a}h1{font-size:20pt;border-bottom:1px solid #cbd5e1;padding-bottom:4pt}h2{font-size:14pt;color:#1e293b}h3{font-size:12pt}p{margin:0 0 8pt}pre{background:#f1f5f9;padding:8pt;font-family:Consolas,monospace;font-size:9pt}code{font-family:Consolas,monospace}table{border-collapse:collapse;margin:0 0 8pt}td,th{border:1px solid #94a3b8;padding:4pt 8pt}th{background:#e2e8f0}</style></head><body>${body}</body></html>`;
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'PRD-LearnDev.doc'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'DOCX diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
}
if (fabDocx) fabDocx.addEventListener('click', downloadDocx);
function downloadAgents() {
    if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
    const hdr = `# AGENTS.md â€” OpenCode & AI Coding Agent Configuration\n# Project: LearnDev Generated Spec\n# Generated: ${new Date().toLocaleString('en-US')}\n\n## CRITICAL EXECUTION RULES\n- Read this file BEFORE any code generation.\n- NEVER output conversational filler.\n- ALL code, architecture, and comments must be production-grade technical English, zero stubs.\n- NO Indonesian or non-English text anywhere in generated specs.\n- Use REAL Unsplash CDN URLs for ALL images.\n\n## AGENTS INSTRUCTION & PRD CONTEXT\n## OpenCode & AI Coding Agent Protocol\n\n---\n\n# PRD SOURCE DOCUMENT\n`;
    const blob = new Blob([hdr + generatedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'AGENTS.md'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'AGENTS.md diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
}
if (fabAgents) fabAgents.addEventListener('click', downloadAgents);


const BASE_PRD_SYSTEM_PROMPT = `You are an expert Lead Product Manager and System Architect. Generate a professional, highly-structured 8-section Markdown PRD strictly in technical English.

## 5. Architecture
- Use SAFEEE format: strictly graph TD or graph LR.
- NO component-diagram or sequenceDiagram for component maps.
- ONE relation per line. NEVER pack multiple relations onto a single line.
- Node IDs must be simple alphanumeric without spaces (e.g. A, B, C, D).
- Always wrap node labels in double quotes inside brackets: Node["Label text"]. Never leave brackets unclosed or truncated.
- NEVER use colon syntax like A --> B : "label". ALWAYS use pipe syntax: A -->|"label"| B.
- Example of CORRECT diagram structure:
  graph TD
    A["App Launch"] -->|"Select Mode"| B["Game Menu"]
    B -->|"Start Game"| C["Gameplay"]
    C -->|"Finish"| D["Summary"]
    D -->|"Back to Menu"| B

## 6. Database Schema
- Use strict ERDIAGRAM format, one attribute per line inside braces.
- Each attribute line must be EXACTLY: type name [PK|FK] ["optional comment"].
- NEVER insert extra words (Optional, Required, Nullable, Unique) between the name and the comment.
- NEVER use %% comments inside entity braces.
- Example of CORRECT schema:
  erDiagram
  USER ||--o{ ORDER : "places"
  USER {
    string id PK
    string email
  }
  ORDER {
    string id PK
    string userId FK
    string audioFileName "Name of the audio file"
  }

## 8. UI/UX Design System (Component Spec)
- Specify every screen's interface using CONCRETE shadcn/ui component names (React + Tailwind CSS + Radix UI primitives). Only use names from this list: Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label, Textarea, Select, Checkbox, Switch, Badge, Avatar, Alert, AlertDialog, Dialog, Sheet, Drawer, Tabs, Tooltip, DropdownMenu, Popover, HoverCard, Command, Form (react-hook-form + Zod), Sonner (toast), Skeleton, ScrollArea, Separator, Accordion, Calendar, DataTable (TanStack Table), Chart (Recharts).
- For each key screen, give the component stack as ONE bullet, e.g. "- Dashboard: Card > CardHeader(CardTitle, CardDescription) + Chart + DataTable with DropdownMenu row actions".
- When a composite block is needed (login form, app sidebar, dashboard layout, pricing), cite the 21st.dev registry as the inspiration source by block category only. NEVER invent or output URLs.
- Include design tokens: Tailwind color roles (primary, secondary, muted, accent, destructive, border, ring), border radius scale, spacing scale, and dark-mode behavior.
- NEVER output raw JSX/TSX code. Only the component-name spec above.

## OUTPUT
Generate pure structured Markdown PRD ONLY. Absolutely NO intro, NO outro, NO conversational filler, NO Indonesian text.`;

if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
        console.log("Generate button triggered");
        const prompt = promptInput?.value?.trim() || '';
        if (!prompt) {
            Swal.fire({ icon: 'warning', title: 'Prompt Kosong', text: 'Masukkan ide aplikasi terlebih dahulu!', background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5' });
            return;
        }
        try {
            const cfg = getApiConfig();
            if (!cfg.key) { Swal.fire({ icon: 'warning', title: 'API Key Diperlukan', text: 'Isi API Key terlebih dahulu.', background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5' }).then(() => openApiKeyModal()); return; }
            const uiVal = uiThemeSelect?.value || 'auto';
            const uiCustom = uiThemeCustom?.value?.trim() || '';
            let uiValFinal = uiVal === 'custom' ? (uiCustom || 'auto') : uiVal;
            if (uiVal === 'custom' && !uiCustom) { Swal.fire({ icon: 'warning', title: 'Input Tema Diperlukan', text: 'Isi tema kustom.', background: '#0f172a', color: '#f8fafc', confirmButtonColor: '#4f46e5' }).then(() => uiThemeCustom.focus()); return; }
            const compress = el('toggle-compress')?.checked ?? true;
            const concise = el('toggle-concise')?.checked ?? true;
            const minimalist = el('toggle-minimalist')?.checked ?? false;
            let pTxt = prompt; if (compress) pTxt = prompt.replace(/\s+/g, ' ').trim();
            
            const detected = detectDomainContext(prompt);
            const dyn = BASE_PRD_SYSTEM_PROMPT + domainContextHint(detected);

            if (concise) dyn += " Strictly output the pure structured Markdown PRD only. No intro, no outro, no conversational AI fluff.";
            if (minimalist) dyn += " Prioritize MVP lean architecture (YAGNI).";
            let uiIns = "";
            if (uiValFinal && uiValFinal !== 'auto') uiIns = `\n\nSECTION 8 OVERRIDE â€” UI/UX DESIGN SYSTEM:\nVisual Vibe: ${uiValFinal}.\nColor Tokens HEX spesifik untuk Primary/Secondary/Accent/Background/Surface/Text + Tailwind classes.\nTypography: Inter/Plus Jakarta Sans spesifik.\nComponent: rounded-2xl/3xl, shadow subtle, transition halus.\n`;
            const fullPrompt = `${dyn}${uiIns}\n\nIde Aplikasi: ${pTxt}`;
            btnGenerate.disabled = true; if (generateText) generateText.textContent = 'Generating PRD...'; if (generateSpinner) generateSpinner.classList.remove('hidden');
            showSkeleton();
            startProgressAnimation();
            if (window.innerWidth < 768 && mobTabResult) mobTabResult.click();
            const selModel = aiProvider?.value || 'gemini-2.5-flash';
            const models = [selModel]; if (!models.includes('gemini-2.5-flash')) models.push('gemini-2.5-flash'); if (!models.includes('gemini-2.5-pro')) models.push('gemini-2.5-pro'); if (!models.includes('gemini-1.5-flash')) models.push('gemini-1.5-flash');
            let raw = ''; let last = null;
            for (const mdl of models) {
                try {
                    let url = cfg.provider === '9router' && cfg.baseUrl ? `${cfg.baseUrl}/${mdl}:generateContent?key=${cfg.key}` : `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${cfg.key}`;
                    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }) });
                    const d = await r.json(); if (!r.ok) throw new Error(d.error?.message || `Gagal API ${mdl}`); raw = d.candidates[0].content.parts[0].text; break;
                } catch (e) { last = e; const t = e.message.toLowerCase(); if (t.includes('high demand') || t.includes('503') || t.includes('quota') || t.includes('rate')) { console.warn(mdl + ' overloaded'); continue; } throw e; }
            }
            if (!raw) throw last || new Error('Semua model sibuk');
            let md = raw.replace(/^```markdown\n/i, '').replace(/^```md\n/i, '').replace(/```$/, '').trim();
            saveHistoryItem(prompt, md);
            localStorage.setItem(LS_LAST, JSON.stringify({ md, prompt, ts: Date.now() }));
            await renderPrd(md);
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PRD berhasil digenerate.', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error("Generate Error:", err);
            hideSkeleton();
            const low = (err.message || '').toLowerCase();
            const auth = low.includes('unauthorized') || low.includes('api key') || low.includes('key not valid') || low.includes('invalid') || low.includes('401') || low.includes('403');
            Swal.fire({ icon: 'error', title: auth ? 'API Key Tidak Valid' : 'Terjadi Kesalahan', text: auth ? 'API Key salah! Periksa konfigurasi.' : ('Gagal generate PRD: ' + err.message), background: '#0f172a', color: '#f8fafc', showCancelButton: true, confirmButtonText: 'OK', cancelButtonText: 'Ubah API Key', confirmButtonColor: '#4f46e5', cancelButtonColor: '#64748b' }).then(r => { if (r.dismiss === Swal.DismissReason.cancel) openApiKeyModal(); });
            if (previewEmpty) previewEmpty.classList.remove('hidden'); if (prdPreview) prdPreview.innerHTML = '';
            if (floatingToolbar) floatingToolbar.classList.add('hidden');
        } finally {
            btnGenerate.disabled = false;
            hideProgress();
            [fabCopy, fabPdf, fabDocx, fabAgents].forEach(b => { if (b) { b.disabled = false; b.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed'); b.classList.add('transition-all', 'duration-300'); } });
            if (generateText) generateText.textContent = 'Generate Dokumen PRD';
            if (generateSpinner) generateSpinner.classList.add('hidden');
            hideSkeleton();
        }
    });
}

console.log('LearnDev App initialized successfully');
