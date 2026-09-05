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
    const btnDownloadAgents = el('btnDownloadAgents');
    const btnCopy = el('btnCopy');
    const btnDownloadPdf = el('btnDownloadPdf');
    const btnHistory = el('btnHistory');
    const btnApiKey = el('btnApiKey');
    const btnSettings = el('btnSettings');
    const installBtn = el('installBtn');
    const tabPreview = el('tabPreview');
    const tabCode = el('tabCode');
    const previewContainer = el('previewContainer');
    const codeContainer = el('codeContainer');
    const prdPreview = el('prdPreview');
    const previewEmpty = el('previewEmpty');
    const codeOutput = el('codeOutput');
    const generateText = el('generateText');
    const generateSpinner = el('generateSpinner');
    const panelConfig = el('panel-config');
    const panelResult = el('panel-result');
    const mobTabConfig = el('mob-tab-config');
    const mobTabResult = el('mob-tab-result');

    let generatedMarkdown = '';
    let deferredPrompt = null;

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
    async function renderPrd(markdownText) {
        generatedMarkdown = markdownText;
        if (previewEmpty) previewEmpty.classList.add('hidden');
        if (prdPreview) prdPreview.innerHTML = marked.parse(generatedMarkdown);
        try { if (typeof mermaid !== 'undefined') await mermaid.run({ nodes: prdPreview.querySelectorAll('.language-mermaid, pre code.language-mermaid') }); } catch (e) { console.warn('Mermaid warn', e); }
        if (codeOutput) { codeOutput.textContent = generatedMarkdown; if (typeof Prism !== 'undefined') Prism.highlightElement(codeOutput); }
        if (tabPreview) tabPreview.click();
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
    if (btnCopy) btnCopy.addEventListener('click', () => {
        if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
        navigator.clipboard.writeText(generatedMarkdown).then(() => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Disalin!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }));
    });
    if (btnDownloadAgents) btnDownloadAgents.addEventListener('click', () => {
        if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
        const hdr = `# AGENTS.md — OpenCode & AI Coding Agent Configuration\n# Project: LearnDev Generated Spec\n# Generated: ${new Date().toLocaleString('id-ID')}\n\n## CRITICAL EXECUTION RULES\n- Read this file BEFORE any code generation.\n- NEVER output conversational filler.\n- ALL code must be production-grade, zero stubs.\n- Use REAL Unsplash CDN URLs for ALL images.\n\n## AGENTS INSTRUCTION & PRD CONTEXT\n## OpenCode & AI Coding Agent Protocol\n\n---\n\n# PRD SOURCE DOCUMENT\n`;
        const blob = new Blob([hdr + generatedMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'AGENTS.md'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });
    if (btnDownloadPdf) btnDownloadPdf.addEventListener('click', () => {
        if (!generatedMarkdown) { Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Belum ada PRD untuk diunduh!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false }); return; }
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Proses generate PDF dimulai...', background: '#0f172a', color: '#f8fafc', timer: 2000, showConfirmButton: false });
        const opt = { margin: 10, filename: 'PRD-LearnDev.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(prdPreview).save();
    });

    const BASE_PRD_SYSTEM_PROMPT = `Anda adalah Lead Product Manager dan System Architect ahli. Hasilkan PRD Markdown profesional 8 section.

## 5. Architecture
- Gunakan FORMAT SAFEEE: hanya graph TD atau graph LR.
- DILARANG component-diagram atau sequenceDiagram untuk map komponen.
- Format relasi: NodeA["Label"] -->|"keterangan"| NodeB["Label"]
- Bungkus label spasi dalam petik dua ""

## 6. Database Schema
- Gunakan FORMAT ERDIAGRAM KETAT:
- erDiagram
  USER ||--o{ ORDER : "places"
  USER { string id PK }
  ORDER { string id PK }

## OUTPUT
Hasilkan markdown mentah tanpa pembungkus code fence.`;

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
                if (concise) dyn += " Generate ONLY pure structured Markdown PRD. No intro/outro.";
                if (minimalist) dyn += " Prioritize MVP lean architecture (YAGNI).";
                let uiIns = "";
                if (uiValFinal && uiValFinal !== 'auto') uiIns = `\n\nSECTION 8 OVERRIDE — UI/UX DESIGN SYSTEM:\nVisual Vibe: ${uiValFinal}.\nColor Tokens HEX spesifik untuk Primary/Secondary/Accent/Background/Surface/Text + Tailwind classes.\nTypography: Inter/Plus Jakarta Sans spesifik.\nComponent: rounded-2xl/3xl, shadow subtle, transition halus.\n`;
                const fullPrompt = `${dyn}${uiIns}\n\nIde Aplikasi: ${pTxt}`;
                btnGenerate.disabled = true; if (generateText) generateText.textContent = 'Generating PRD...'; if (generateSpinner) generateSpinner.classList.remove('hidden');
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
                const low = (err.message || '').toLowerCase();
                const auth = low.includes('unauthorized') || low.includes('api key') || low.includes('key not valid') || low.includes('invalid') || low.includes('401') || low.includes('403');
                Swal.fire({ icon: 'error', title: auth ? 'API Key Tidak Valid' : 'Terjadi Kesalahan', text: auth ? 'API Key salah! Periksa konfigurasi.' : ('Gagal generate PRD: ' + err.message), background: '#0f172a', color: '#f8fafc', showCancelButton: true, confirmButtonText: 'OK', cancelButtonText: 'Ubah API Key', confirmButtonColor: '#4f46e5', cancelButtonColor: '#64748b' }).then(r => { if (r.dismiss === Swal.DismissReason.cancel) openApiKeyModal(); });
                if (previewEmpty) previewEmpty.classList.remove('hidden'); if (prdPreview) prdPreview.innerHTML = '';
            } finally {
                btnGenerate.disabled = false; if (generateText) generateText.textContent = 'Generate PRD Document'; if (generateSpinner) generateSpinner.classList.add('hidden');
            }
        });
    }

    console.log('LearnDev App initialized successfully');
});
