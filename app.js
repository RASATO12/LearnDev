document.addEventListener('DOMContentLoaded', () => {
    console.log("LearnDev Engine Initialized");
    try { if (typeof mermaid !== 'undefined') mermaid.initialize({ startOnLoad: false, theme: 'dark' }); } catch (e) { }
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
    const templateButtons = document.querySelectorAll('.template-btn');

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

const TEMPLATES = {
        ecommerce: "Create a complete PRD for a Mobile E-Commerce application with features:\n- Product catalog with categories and search filters\n- Shopping cart with quantity adjustments and persistent state\n- Multi-payment checkout (COD, bank transfer, e-wallet)\n- User account management with profile and order history\n- Real-time push notifications\n- Admin dashboard for product, order, and sales analytics management\n- Flash sale and voucher discount management system\n- User product reviews and ratings\n- Wishlist and favorite items\n- Chat customer service integration\n\nPrioritize mobile-first UX, fast performance on low bandwidth, and transaction security.",
        saas: "Create a complete PRD for a SaaS Dashboard platform with features:\n- Multi-tenant architecture with data isolation\n- Subscription management (free, pro, enterprise tiers)\n- Billing and invoice automation\n- Real-time analytics dashboard with charts and KPIs\n- User role management (admin, member, viewer)\n- API access management and rate limiting\n- Team collaboration workspace\n- Integrations marketplace (Slack, Zapier, CRM)\n- Audit log and compliance reporting\n- Onboarding wizard and guided setup\n\nFocus on scalability, security-first design, and enterprise-grade reliability.",
        api: "Create a complete PRD for a REST API Service with features:\n- RESTful endpoint design with versioning (v1, v2)\n- Authentication via OAuth 2.0 + JWT token management\n- Rate limiting and throttling policies\n- Pagination, filtering, sorting, and search\n- Webhook support for event-driven architecture\n- Automated API documentation (OpenAPI/Swagger)\n- Error handling standardization (RFC 7807 Problem Details)\n- Caching strategy (Redis) and CDN integration\n- Monitoring and health check endpoints\n- API gateway configuration and load balancing\n\nStandardize on OpenAPI 3.0 specification, semantic versioning, and backward compatibility."
    };

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

// Collapsible panel — desktop only (mobile uses tab nav)
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

// Template buttons — fill textarea, clear highlight on manual edit
function highlightTemplate(active) {
    templateButtons.forEach(b => {
        const on = b.dataset.template === active;
        b.classList.toggle('!bg-indigo-600', on);
        b.classList.toggle('!border-indigo-500', on);
        b.classList.toggle('!text-white', on);
    });
}
templateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const t = btn.dataset.template;
        if (t === 'custom') { highlightTemplate('custom'); promptInput.value = ''; promptInput.focus(); return; }
        if (promptInput) promptInput.value = TEMPLATES[t] || '';
        highlightTemplate(t);
        promptInput.focus();
    });
});
promptInput?.addEventListener('input', () => { highlightTemplate('custom'); });

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

function addMermaidControls(container) {
    const mermaidElements = container.querySelectorAll('.mermaid');
    mermaidElements.forEach((mermaidEl) => {
        const wrapper = mermaidEl.parentElement;
        if (!wrapper || wrapper.querySelector('.mermaid-controls')) return;
        const controls = document.createElement('div');
        controls.className = 'mermaid-controls flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 mb-2 shadow-lg shadow-black/30';
        controls.innerHTML = `
                <button class="mermaid-zoom-in w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition text-xs"><i class="fa-solid fa-plus"></i></button>
                <button class="mermaid-zoom-out w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition text-xs"><i class="fa-solid fa-minus"></i></button>
                <button class="mermaid-zoom-reset w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition text-xs"><i class="fa-solid fa-expand"></i></button>
                <div class="w-px h-4 bg-slate-700 mx-0.5"></div>
                <button class="mermaid-download-svg w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition text-xs" title="Download SVG"><i class="fa-solid fa-download"></i></button>
                <button class="mermaid-download-png w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-xs" title="Download PNG"><i class="fa-solid fa-image"></i></button>
            `;
        wrapper.style.position = 'relative';
        wrapper.insertBefore(controls, mermaidEl);

        let zoom = 1;
        controls.querySelector('.mermaid-zoom-in').addEventListener('click', () => {
            zoom = Math.min(ZOOM_MAX, zoom + ZOOM_STEP);
            mermaidEl.style.transform = `scale(${zoom})`;
            mermaidEl.style.transformOrigin = 'top left';
            controls.querySelector('.mermaid-zoom-reset').querySelector('i').className = 'fa-solid fa-expand';
        });
        controls.querySelector('.mermaid-zoom-out').addEventListener('click', () => {
            zoom = Math.max(ZOOM_MIN, zoom - ZOOM_STEP);
            mermaidEl.style.transform = `scale(${zoom})`;
            mermaidEl.style.transformOrigin = 'top left';
        });
        controls.querySelector('.mermaid-zoom-reset').addEventListener('click', () => {
            zoom = 1;
            mermaidEl.style.transform = 'scale(1)';
            mermaidEl.style.transformOrigin = 'top left';
        });
        controls.querySelector('.mermaid-download-svg').addEventListener('click', () => {
            const svgEl = mermaidEl.querySelector('svg');
            if (!svgEl) return;
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob), a = document.createElement('a');
            a.href = url; a.download = 'mermaid-diagram.svg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        });
        controls.querySelector('.mermaid-download-png').addEventListener('click', () => {
            const svgEl = mermaidEl.querySelector('svg');
            if (!svgEl) return;
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const domURL = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
            img.onload = () => {
                canvas.width = img.width * 2; canvas.height = img.height * 2;
                ctx.scale(2, 2); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob), a = document.createElement('a');
                    a.href = url; a.download = 'mermaid-diagram.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                    URL.revokeObjectURL(domURL);
                }, 'image/png');
            };
            img.src = domURL;
        });
    });
}

async function renderPrd(markdownText) {
    generatedMarkdown = markdownText;
    if (btnGenerate) btnGenerate.classList.remove('animate-pulse-subtle');
    showSkeleton();
    hideSkeleton();
    if (prdPreview) prdPreview.innerHTML = marked.parse(generatedMarkdown);
    try { if (typeof mermaid !== 'undefined') { await mermaid.run({ nodes: prdPreview.querySelectorAll('.language-mermaid, pre code.language-mermaid') }); addMermaidControls(prdPreview); } } catch (e) { console.warn('Mermaid warn', e); }
    if (codeOutput) { codeOutput.textContent = generatedMarkdown; if (typeof Prism !== 'undefined') Prism.highlightElement(codeOutput); }
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

    if (fabCopy) fabCopy.addEventListener('click', () => { if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; } copyToClipboard(generatedMarkdown); });
    if (fabPdf) fabPdf.addEventListener('click', () => {
        if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Proses generate PDF dimulai...', background: '#0f172a', color: '#f8fafc', timer: 2000, showConfirmButton: false });
        const opt = { margin: 10, filename: 'PRD-LearnDev.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(prdPreview).save();
    });
function downloadAgents() {
    if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
    const hdr = `# AGENTS.md — OpenCode & AI Coding Agent Configuration\n# Project: LearnDev Generated Spec\n# Generated: ${new Date().toLocaleString('en-US')}\n\n## CRITICAL EXECUTION RULES\n- Read this file BEFORE any code generation.\n- NEVER output conversational filler.\n- ALL code, architecture, and comments must be production-grade technical English, zero stubs.\n- NO Indonesian or non-English text anywhere in generated specs.\n- Use REAL Unsplash CDN URLs for ALL images.\n\n## AGENTS INSTRUCTION & PRD CONTEXT\n## OpenCode & AI Coding Agent Protocol\n\n---\n\n# PRD SOURCE DOCUMENT\n`;
    const blob = new Blob([hdr + generatedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'AGENTS.md'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'AGENTS.md diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
}
if (fabAgents) fabAgents.addEventListener('click', downloadAgents);


const BASE_PRD_SYSTEM_PROMPT = `You are an expert Lead Product Manager and System Architect. Generate a professional, highly-structured 8-section Markdown PRD strictly in technical English.

## 5. Architecture
- Use SAFEEE format: strictly graph TD or graph LR.
- NO component-diagram or sequenceDiagram for component maps.
- Relation format: NodeA["Label"] -->|"description"| NodeB["Label"]
- Wrap spaced labels in double quotes ""

## 6. Database Schema
- Use strict ERDIAGRAM format:
- erDiagram
  USER ||--o{ ORDER : "places"
  USER { string id PK }
  ORDER { string id PK }

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
            let dyn = BASE_PRD_SYSTEM_PROMPT;
            if (concise) dyn += " Strictly output the pure structured Markdown PRD only. No intro, no outro, no conversational AI fluff.";
            if (minimalist) dyn += " Prioritize MVP lean architecture (YAGNI).";
            let uiIns = "";
            if (uiValFinal && uiValFinal !== 'auto') uiIns = `\n\nSECTION 8 OVERRIDE — UI/UX DESIGN SYSTEM:\nVisual Vibe: ${uiValFinal}.\nColor Tokens HEX spesifik untuk Primary/Secondary/Accent/Background/Surface/Text + Tailwind classes.\nTypography: Inter/Plus Jakarta Sans spesifik.\nComponent: rounded-2xl/3xl, shadow subtle, transition halus.\n`;
            const fullPrompt = `${dyn}${uiIns}\n\nIde Aplikasi: ${pTxt}`;
            btnGenerate.disabled = true; if (generateText) generateText.textContent = 'Generating PRD...'; if (generateSpinner) generateSpinner.classList.remove('hidden');
            showSkeleton();
            if (window.innerWidth < 768 && mobTabResult) mobTabResult.click();
            const selModel = aiProvider?.value || 'gemini-2.5-flash';
            const models = [selModel]; if (!models.includes('gemini-1.5-flash')) models.push('gemini-1.5-flash'); if (!models.includes('gemini-1.5-pro')) models.push('gemini-1.5-pro');
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
            saveHistoryItem(prompt, md); await renderPrd(md);
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'PRD berhasil digenerate.', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error("Generate Error:", err);
            hideSkeleton();
            const low = (err.message || '').toLowerCase();
            const auth = low.includes('unauthorized') || low.includes('api key') || low.includes('key not valid') || low.includes('invalid') || low.includes('401') || low.includes('403');
            Swal.fire({ icon: 'error', title: auth ? 'API Key Tidak Valid' : 'Terjadi Kesalahan', text: auth ? 'API Key salah! Periksa konfigurasi.' : ('Gagal generate PRD: ' + err.message), background: '#0f172a', color: '#f8fafc', showCancelButton: true, confirmButtonText: 'OK', cancelButtonText: 'Ubah API Key', confirmButtonColor: '#4f46e5', cancelButtonColor: '#64748b' }).then(r => { if (r.dismiss === Swal.DismissReason.cancel) openApiKeyModal(); });
            if (previewEmpty) previewEmpty.classList.remove('hidden'); if (prdPreview) prdPreview.innerHTML = '';
            if (floatingToolbar) floatingToolbar.classList.add('hidden');
        }         finally {
            btnGenerate.disabled = false; if (generateText) generateText.textContent = 'Generate Dokumen PRD'; if (generateSpinner) generateSpinner.classList.add('hidden');
            hideSkeleton();
        }
    });
}

console.log('LearnDev App initialized successfully');
});
