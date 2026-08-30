document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });

    const apiKeyBtn = document.getElementById('apikey-btn');
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

    async function openApiKeyModal() {
        const { value: apiKey } = await Swal.fire({
            title: 'Pengaturan API Key',
            html: `
                <div class="space-y-3 text-left">
                    <div>
                        <label class="block text-xs font-medium text-slate-300 mb-1">Google Gemini API Key</label>
                        <input type="password" id="swal-gemini-key" class="swal2-input !w-full !m-0 !bg-slate-800 !text-slate-100 !border-slate-700 !text-sm" placeholder="AIza..." value="${getGeminiKey()}">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[11px] text-indigo-400 hover:underline mt-1 inline-block">👉 Dapatkan Gemini Key Gratis</a>
                    </div>
                </div>
            `,
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#4f46e5',
            confirmButtonText: 'Simpan Key',
            showCancelButton: true,
            cancelButtonText: 'Batal',
            preConfirm: () => document.getElementById('swal-gemini-key').value
        });

        if (apiKey !== undefined) {
            setGeminiKey(apiKey);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'API Key berhasil disimpan!',
                background: '#0f172a',
                color: '#f8fafc',
                timer: 1500,
                showConfirmButton: false
            });
        }
    }

    apiKeyBtn.addEventListener('click', openApiKeyModal);

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

    const btnDownloadAgent = document.getElementById('btnDownloadAgent');
    if (btnDownloadAgent) {
        btnDownloadAgent.addEventListener('click', () => {
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

            const agentHeader = '# CRITICAL REQUIREMENT FOR AI CODING: You must output a fully-working, production-grade web app with REAL Unsplash image URLs, complete interactive JavaScript logic for ALL features, and modern 2026 Micro-SaaS UI design guidelines. NO dummy placeholders or non-functional buttons allowed.\n# Project: LearnDev Generated Spec\n# Note for AI Coding: Follow all requirements, user flows, architecture, and UI Design Tokens strictly.\n\n';
            const markdownWithHeader = agentHeader + generatedMarkdown;

            const blob = new Blob([markdownWithHeader], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'agent.md';
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
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Proses generate PDF dimulai...',
                background: '#0f172a',
                color: '#f8fafc',
                timer: 2000,
                showConfirmButton: false
            });

            const element = document.getElementById('prd-content');
            const opt = {
                margin: 10,
                filename: 'PRD-LearnDev.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save();
        });
    }

    const getHistory = () => {
        try {
            return JSON.parse(localStorage.getItem('learndev_prd_history')) || [];
        } catch {
            return [];
        }
    };

    const saveHistoryItem = (prompt, markdown) => {
        const history = getHistory();
        const titleMatch = markdown.match(/^#\s+(.*)/m);
        const title = titleMatch ? titleMatch[1] : (prompt.substring(0, 40) + '...');
        
        const newItem = {
            id: Date.now(),
            timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
            title: title.trim(),
            promptText: prompt,
            rawMarkdown: markdown
        };

        history.unshift(newItem);
        if (history.length > 15) history.pop();
        localStorage.setItem('learndev_prd_history', JSON.stringify(history));
    };

    async function renderPrd(markdownText) {
        generatedMarkdown = markdownText;
        previewEmpty.classList.add('hidden');
        prdContent.innerHTML = marked.parse(generatedMarkdown);

        try {
            await mermaid.run({
                nodes: prdContent.querySelectorAll('.language-mermaid, pre code.language-mermaid')
            });
        } catch (mErr) {}

        codeOutput.textContent = generatedMarkdown;
        Prism.highlightElement(codeOutput);
        tabPreview.click();
    }

    async function openHistoryModal() {
        const history = getHistory();
        if (history.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Riwayat Kosong',
                text: 'Belum ada dokumen PRD yang pernah dibuat.',
                background: '#0f172a',
                color: '#f8fafc',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }

        let historyHtml = `
            <div class="space-y-3 max-h-[60vh] overflow-y-auto text-left pr-1">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-slate-400">Menampilkan ${history.length} riwayat terakhir</span>
                    <button id="clear-all-history" class="text-xs text-rose-400 hover:underline">Hapus Semua</button>
                </div>
        `;

        history.forEach((item) => {
            historyHtml += `
                <div class="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 space-y-1.5 hover:border-indigo-500/50 transition">
                    <div class="flex justify-between items-start">
                        <h4 class="text-xs font-semibold text-slate-200 line-clamp-1">${item.title}</h4>
                        <span class="text-[10px] text-slate-400">${item.timestamp}</span>
                    </div>
                    <p class="text-[11px] text-slate-400 line-clamp-2">Prompt: "${item.promptText}"</p>
                    <div class="flex justify-end space-x-2 pt-1">
                        <button onclick="window.loadPrdHistory(${item.id})" class="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2.5 py-1 rounded transition">Muat/Buka</button>
                        <button onclick="window.deletePrdHistory(${item.id})" class="bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] px-2.5 py-1 rounded transition">Hapus</button>
                    </div>
                </div>
            `;
        });

        historyHtml += `</div>`;

        Swal.fire({
            title: 'Riwayat Generasi PRD',
            html: historyHtml,
            background: '#0f172a',
            color: '#f8fafc',
            showConfirmButton: false,
            showCloseButton: true,
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
        if (item) {
            renderPrd(item.rawMarkdown);
            promptInput.value = item.promptText;
            Swal.close();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'PRD berhasil dimuat!', background: '#0f172a', color: '#f8fafc', timer: 1500, showConfirmButton: false });
        }
    };

    window.deletePrdHistory = (id) => {
        let history = getHistory();
        history = history.filter(h => h.id !== id);
        localStorage.setItem('learndev_prd_history', JSON.stringify(history));
        Swal.close();
        openHistoryModal();
    };

    document.getElementById('btn-history').addEventListener('click', openHistoryModal);

    const BASE_PRD_SYSTEM_PROMPT = `Anda adalah seorang Lead Product Manager dan System Architect ahli. Tugas Anda adalah menghasilkan dokumen PRD (Project Requirements Document) yang sangat profesional, komprehensif, dan siap dieksekusi oleh tim engineering dalam format Markdown (.md).

Wajib menyusun struktur PRD ke dalam 7 section utama berikut tanpa teks pembuka atau penutup, serta mewajibkan implementasi aplikasi "Production-Ready / Siap Pakai" tanpa revisi melalui instruksi wajib berikut:

CRITICAL INSTRUCTIONS FOR AI CODING & ARCHITECTURE — WAJIB DIPATUHI 100% (NO STUB, NO PLACEHOLDER):

1. ATURAN GAMBAR PRODUK / ASSET (MANDATORY REAL IMAGES):
   - SELALU gunakan URL gambar nyata dari Unsplash CDN (https://images.unsplash.com/photo-...) untuk setiap mock data produk, avatar, dan hero section.
   - DILARANG KERAS: <img> kosong, placeholder.com, via.placeholder, local path rusak (src="image.jpg"), atau src="#".
   - Setiap item mock data WAJIB punya field image: "https://images.unsplash.com/photo-..." dengan ID foto valid. Contoh: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80".

2. ATURAN FUNGSIONALITAS 100% (NO STUB / FULL JS LOGIC):
   - SELURUH fitur pada PRD WAJIB punya logika JavaScript interaktif yang bekerja penuh saat dijalankan di browser — bukan tombol hiasan/mati.
   - Semua tombol (Filter, Search, Add to Cart, Modal Pop-up, Delete, Calculate, Checkout, Pagination) WAJIB dipasang addEventListener dan mengupdate state/DOM secara real-time.
   - Wajib implementasi: state management (array/object), render ulang dinamis, validasi input, kalkulasi live, localStorage persist jika relevan. DILARANG stub: onclick="" kosong, TODO, console.log saja, atau alert("coming soon").

3. ATURAN DESIGN SYSTEM TRENDI (ANTI-JADUL / MODERN 2026 MICRO-SAAS UI):
   - Gaya visual WAJIB: Modern Clean Micro-SaaS & Bento Grid Layout — minimalis, spacious, presisi. HARAM: neumorphism jadul, gradient norak, warna-warni acak.
   - Typography: Font 'Inter' atau 'Plus Jakarta Sans' (via Google Fonts). Heading font-semibold tracking-tight, body font-normal leading-relaxed.
   - Tailwind WAJIB pakai token ini:
     * Border Radius halus: rounded-2xl atau rounded-3xl (jangan rounded-md kasar).
     * Subtle Borders: border border-slate-200/60 (light) atau border-slate-800/80 (dark).
     * Ambient Soft Shadows: shadow-[0_8px_30px_rgb(0,0,0,0.04)] (jangan shadow-xl tebal).
     * Micro-Interactions: transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.
     * Accent Highlights: SATU warna aksen elegan saja (Indigo-600 / Emerald-500 / Violet-600) — konsisten di button, badge, link. Jangan pelangi.
   - Layout: Bento Grid Cards, whitespace lega (p-6 gap-6), Sidebar/Top Navbar clean, Card dengan backdrop-blur jika relevan.

4. Mock Data Awal (Wajib): Sediakan Array Data Bawaan (mock items, dummy users, sample transactions) dengan gambar Unsplash real yang langsung tampil saat web dibuka. Layar TIDAK BOLEH kosong (empty state) pada first load.
5. Interaktivitas & UX Flow: Sertakan Modal Pop-up (Struk Transaksi, Confirm Dialog), Toast Notifications, FontAwesome Icons di setiap tombol/badge/header, serta fungsi kalkulasi (total harga, kembalian, filter pencarian) yang berjalan 100%.

# PRD — Project Requirements Document: [Nama Aplikasi]

## 1. Overview
- Latar Belakang & Masalah
- Tujuan & Target Pengguna
- Key Value Proposition

## 2. Requirements
- Aksesibilitas & Perangkat (Web, Mobile, Responsive)
- Peran Pengguna (User Roles & Permissions)
- Data Input & Validasi Utama
- Sistem Notifikasi / Feedback

## 3. Core Features
- Daftar Fitur Utama (MVP Features) dengan detail fungsionalitas

## 4. User Flow
- Alur kerja langkah-demi-langkah (step-by-step user journey) dari awal hingga selesai

## 5. Architecture
- Diagram Sequence alur interaksi sistem menggunakan syntax \`\`\`mermaid sequenceDiagram ... \`\`\`

## 6. Database Schema
- Rancangan ERD Diagram menggunakan syntax \`\`\`mermaid erDiagram ... \`\`\`
- Tabel Penjelasan Relasi & Atribut Entitas

## 7. Design & Technical Constraints
- High-Level Tech Stack yang disarankan
- Panduan Desain & Aturan Tipografi`;

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            console.log('Proses generate PRD dimulai...');

            try {
                const apiKey = getGeminiKey();
                if (!apiKey) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'API Key Diperlukan',
                        text: 'Silakan isi Google Gemini API Key terlebih dahulu.',
                        background: '#0f172a',
                        color: '#f8fafc',
                        confirmButtonColor: '#4f46e5'
                    }).then(() => {
                        openApiKeyModal();
                    });
                    return;
                }

                const promptTextRaw = promptInput ? promptInput.value.trim() : '';
                if (!promptTextRaw) {
                    Swal.fire({ icon: 'warning', title: 'Prompt Kosong', text: 'Silakan masukkan ide atau deskripsi aplikasi yang ingin dibuat PRD-nya.', background: '#0f172a', color: '#f8fafc' });
                    return;
                }

                const uiThemeSelect = document.getElementById('uiTheme');
                const uiThemeCustom = document.getElementById('uiThemeCustom');

                let uiThemeValue = uiThemeSelect ? (uiThemeSelect.value || 'Auto Detect from Prompt (Rekomendasi AI)') : 'Auto Detect from Prompt (Rekomendasi AI)';
                if (uiThemeValue === 'custom' && uiThemeCustom) {
                    uiThemeValue = uiThemeCustom.value.trim() || 'Auto Detect from Prompt (Rekomendasi AI)';
                }

                if (uiThemeSelect && uiThemeSelect.value === 'custom' && uiThemeCustom && !uiThemeCustom.value.trim()) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Input Tema Diperlukan',
                        text: 'Silakan deskripsikan tema UI kustom yang Anda inginkan.',
                        background: '#0f172a',
                        color: '#f8fafc',
                        confirmButtonColor: '#4f46e5'
                    }).then(() => {
                        uiThemeCustom.focus();
                    });
                    return;
                }

                const toggleCompressEl = document.getElementById('toggle-compress');
                const toggleConciseEl = document.getElementById('toggle-concise');
                const toggleMinimalistEl = document.getElementById('toggle-minimalist');

                const toggleCompress = toggleCompressEl ? toggleCompressEl.checked : true;
                const toggleConcise = toggleConciseEl ? toggleConciseEl.checked : true;
                const toggleMinimalist = toggleMinimalistEl ? toggleMinimalistEl.checked : false;

                let promptText = promptTextRaw;
                if (toggleCompress) {
                    promptText = promptTextRaw.replace(/\s+/g, ' ').trim();
                }

                let dynamicSystemPrompt = BASE_PRD_SYSTEM_PROMPT;
                if (toggleConcise) {
                    dynamicSystemPrompt += " Generate ONLY pure structured Markdown PRD. No conversational intro, no conversational conclusion.";
                }
                if (toggleMinimalist) {
                    dynamicSystemPrompt += " Prioritize essential MVP features and lightweight lean architecture (YAGNI principle).";
                }

                let uiThemeInstruction = "";
                if (uiThemeValue && uiThemeValue !== 'auto') {
                    uiThemeInstruction += `\n\nSECTION 8: UI/UX DESIGN SYSTEM & TAILWIND STYLING GUIDELINES — The product MUST have a complete, implementable UI/UX design system following these rules:\n\na. Visual Vibe & Style Target: ${uiThemeValue}.\nb. Color Palette — provide Primary, Secondary, Background, Surface, and Accent colors, each with both HEX code and Tailwind CSS classes.\nc. Typography Rules — specify heading font family/size/line-height and body font family/size/line-height.\nd. Component Styling — define border radius (Tailwind radius scale), shadow effects (Tailwind shadow classes), and all interactive button states (default / hover / active / disabled).\ne. Deliver usable Tailwind CSS Config (JSON) snippet and CSS custom properties ready for copy-paste.\n\nSYSTEM NOTE FOR AI CODING AGENT: Strictly adhere to the Color Palette and Tailwind CSS design tokens defined in Section 8 when generating all UI components.`;
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
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [
                                    {
                                        parts: [
                                            { text: fullPrompt }
                                        ]
                                    }
                                ]
                            })
                        });

                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.error?.message || `Gagal menghubungi Gemini API (${model})`);
                        }
                        
                        rawContent = data.candidates[0].content.parts[0].text;
                        break;
                    } catch (err) {
                        lastError = err;
                        const errText = err.message.toLowerCase();
                        if (errText.includes('high demand') || errText.includes('503') || errText.includes('quota') || errText.includes('rate')) {
                            console.warn(`Model ${model} overloaded, mencoba fallback model berikutnya...`);
                            continue;
                        }
                        throw err;
                    }
                }

                if (!rawContent) {
                    throw lastError || new Error('Semua model Gemini sedang sibuk / overloaded. Silakan coba lagi nanti.');
                }

                generatedMarkdown = rawContent.replace(/^```markdown\n/i, '').replace(/^```md\n/i, '').replace(/```$/, '').trim();

                saveHistoryItem(promptText, generatedMarkdown);
                renderPrd(generatedMarkdown);

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Dokumen PRD berhasil digenerate.',
                    background: '#0f172a',
                    color: '#f8fafc',
                    timer: 1500,
                    showConfirmButton: false
                });

            } catch (error) {
                console.error("Generate PRD Error:", error);
                const errLower = (error.message || '').toLowerCase();
                const isAuthError = errLower.includes('unauthorized') || 
                                    errLower.includes('api key') || 
                                    errLower.includes('key not valid') ||
                                    errLower.includes('invalid') ||
                                    errLower.includes('401') ||
                                    errLower.includes('403');

                Swal.fire({
                    icon: 'error',
                    title: isAuthError ? 'API Key Tidak Valid' : 'Terjadi Kesalahan',
                    text: isAuthError ? 'API Key Tidak Valid atau Salah! Silakan periksa kembali API Key Anda.' : ('Gagal melakukan generate PRD: ' + error.message),
                    background: '#0f172a',
                    color: '#f8fafc',
                    showCancelButton: true,
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Ubah API Key',
                    confirmButtonColor: '#4f46e5',
                    cancelButtonColor: '#64748b'
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        openApiKeyModal();
                    }
                });

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
