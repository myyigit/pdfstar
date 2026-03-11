/**
 * PDFStar – Main Application Script
 * PDF processing using pdf-lib (client-side)
 * All operations run in the browser, no server upload.
 */

// ──────────────────────────────────────────────
// CDN Imports (loaded via script at bottom)
// pdf-lib: https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js
// ──────────────────────────────────────────────

/* ======================== NAVBAR SCROLL ======================== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
}, { passive: true });

/* ======================== HAMBURGER ======================== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger?.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
});

/* ======================== SCROLL HELPERS ======================== */
function scrollToTools() {
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
}

/* ======================== DARK / LIGHT TOGGLE ======================== */
(function initTheme() {
    if (localStorage.getItem('PDFStar-theme') === 'light') {
        document.body.classList.add('light-mode');
    }
})();

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('PDFStar-theme', isLight ? 'light' : 'dark');
}

/* ======================== TOOL SEARCH ======================== */
function filterSearch(query) {
    const q = query.trim().toLowerCase();
    const clear = document.getElementById('searchClear');
    if (clear) clear.style.display = q ? 'block' : 'none';

    const cards = document.querySelectorAll('.tool-card');
    let visible = 0;
    cards.forEach(card => {
        const name = card.querySelector('.tool-name')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.tool-desc')?.textContent.toLowerCase() || '';
        const match = !q || name.includes(q) || desc.includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });

    // No-result message
    let empty = document.getElementById('toolsEmpty');
    if (!empty) {
        empty = document.createElement('div');
        empty.id = 'toolsEmpty';
        empty.className = 'tools-empty';
        document.getElementById('toolsGrid')?.appendChild(empty);
    }
    empty.textContent = visible === 0 ? `"${query}" için sonuç bulunamadı` : '';
    empty.style.display = visible === 0 ? 'block' : 'none';

    // Reset category filter active state
    if (q) {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    }
}

function clearSearch() {
    const inp = document.getElementById('toolSearch');
    if (inp) { inp.value = ''; filterSearch(''); }
    const clear = document.getElementById('searchClear');
    if (clear) clear.style.display = 'none';
}

/* ======================== POPULAR TOOLS (localStorage) ======================== */
const USAGE_KEY = 'PDFStar-usage';

function trackUsage(toolId) {
    const data = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    data[toolId] = (data[toolId] || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
    renderPopularBadges();
}

function renderPopularBadges() {
    const data = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    // Remove all existing badges
    document.querySelectorAll('.popular-badge').forEach(b => b.remove());
    // Top 2 tools get badge if used ≥ 2 times
    const top = Object.entries(data)
        .filter(([, v]) => v >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([k]) => k);
    top.forEach(toolId => {
        const card = document.querySelector(`.tool-card[data-tool="${toolId}"]`);
        if (card) {
            const badge = document.createElement('div');
            badge.className = 'popular-badge';
            badge.textContent = '🔥 Popüler';
            card.appendChild(badge);
        }
    });
}

// Init popular badges on load
renderPopularBadges();

/* ======================== CATEGORY FILTER ======================== */
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        document.querySelectorAll('.tool-card').forEach(card => {
            if (cat === 'all' || card.dataset.cat === cat) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

/* ======================== FAQ ACCORDION ======================== */
function toggleFaq(btn) {
    const answer = btn.nextElementSibling;
    const icon = btn.querySelector('.faq-icon');
    const isOpen = answer.classList.contains('open');

    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-icon').forEach(i => i.classList.remove('rotated'));

    if (!isOpen) {
        answer.classList.add('open');
        icon.classList.add('rotated');
    }
}

/* ======================== TOAST ======================== */
function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

/* ======================== MODAL ======================== */
function openTool(toolId) {
    const overlay = document.getElementById('toolModal');
    const body = document.getElementById('modalBody');
    body.innerHTML = toolId === 'organize' ? buildOrganizeUI() : buildToolUI(toolId);
    if (typeof applyLang === 'function') applyLang(_currentLang);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    initToolDrop(toolId);
    // Init signature pad after DOM renders
    if (toolId === 'sign') setTimeout(initSignPad, 50);
    // Track usage for popular tools feature
    trackUsage(toolId);
}

function closeModal(e) {
    if (e.target.id === 'toolModal') closeModalBtn();
}

function closeModalBtn() {
    const overlay = document.getElementById('toolModal');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModalBtn();
});

/* ======================== TOOL DEFINITIONS ======================== */
const TOOLS = {
    'merge': {
        title: 'PDF Birleştir',
        desc: 'Birden fazla PDF dosyasını tek belgede birleştirin',
        color: '#6366f1',
        gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
        accept: '.pdf',
        multiple: true,
        processLabel: 'Birleştir',
        options: null,
    },
    'split': {
        title: 'PDF Böl',
        desc: 'PDF dosyasını sayfa aralıklarına göre parçalara ayırın',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Böl',
        options: 'split',
    },
    'compress': {
        title: 'PDF Sıkıştır',
        desc: 'Dosya boyutunu düşürün, kaliteyi koruyun',
        color: '#ec4899',
        gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="21" y2="3"/><line x1="3" y1="21" x2="14" y2="10"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Sıkıştır',
        options: 'compress',
    },
    'rotate': {
        title: 'PDF Döndür',
        desc: 'Sayfaları istediğiniz açıda döndürün',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Döndür',
        options: 'rotate',
    },
    'pdf-to-word': {
        title: 'PDF → Word',
        desc: 'PDF belgelerini düzenlenebilir Word formatına çevirin',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg,#3b82f6,#60a5fa)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Dönüştür (Word)',
        options: null,
        note: 'Not: Tarayıcı tabanlı PDF→Word dönüşümü basit metin çıkarmayı destekler.',
    },
    'pdf-to-jpg': {
        title: 'PDF → JPG',
        desc: 'Her sayfayı yüksek kaliteli görüntüye dönüştürün',
        color: '#10b981',
        gradient: 'linear-gradient(135deg,#10b981,#34d399)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'JPG\'ye Dönüştür',
        options: null,
    },
    'jpg-to-pdf': {
        title: 'JPG → PDF',
        desc: 'Görüntüleri tek bir PDF belgesinde birleştirin',
        color: '#14b8a6',
        gradient: 'linear-gradient(135deg,#14b8a6,#2dd4bf)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
        accept: '.jpg,.jpeg,.png,.gif,.webp',
        multiple: true,
        processLabel: 'PDF Oluştur',
        options: null,
    },
    'word-to-pdf': {
        title: 'Word → PDF',
        desc: 'Word dosyalarını PDF formatına dönüştürün',
        color: '#0ea5e9',
        gradient: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        accept: '.doc,.docx',
        multiple: false,
        processLabel: 'Dönüştür (PDF)',
        options: null,
        note: 'Not: Sunucu olmadan tam Word→PDF dönüşümü için LibreOffice gerekir. Bu demo sürümü.',
    },
    'excel-to-pdf': {
        title: 'Excel → PDF',
        desc: 'Tablolarınızı kaliteli PDF belgelerine çevirin',
        color: '#22c55e',
        gradient: 'linear-gradient(135deg,#22c55e,#4ade80)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h18"/></svg>`,
        accept: '.xls,.xlsx,.csv',
        multiple: false,
        processLabel: 'Dönüştür (PDF)',
        options: null,
        note: 'CSV dosyaları PDF tablosu olarak dönüştürülür.',
    },
    'protect': {
        title: 'PDF Şifrele',
        desc: 'PDF\'inizi parola ile koruyun',
        color: '#f43f5e',
        gradient: 'linear-gradient(135deg,#f43f5e,#fb7185)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Şifrele',
        options: 'protect',
    },
    'unlock': {
        title: 'PDF Kilidi Aç',
        desc: 'Kullanıcı parolası korumasını kaldırın',
        color: '#fb923c',
        gradient: 'linear-gradient(135deg,#fb923c,#fdba74)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Kilidi Kaldır',
        options: 'unlock',
    },
    'watermark': {
        title: 'Filigran Ekle',
        desc: 'PDF sayfalarına metin filigranı ekleyin',
        color: '#a78bfa',
        gradient: 'linear-gradient(135deg,#a78bfa,#c4b5fd)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
        accept: '.pdf', multiple: false, processLabel: 'Filigran Ekle', options: 'watermark',
    },
    'organize': {
        title: 'Sayfaları Düzenle',
        desc: 'Sürükle-bırak ile PDF sayfalarının sırasını değiştirin',
        color: '#818cf8',
        gradient: 'linear-gradient(135deg,#818cf8,#a5b4fc)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
        accept: '.pdf', multiple: false, processLabel: 'Sıralamayı Kaydet', options: null,
    },
    'ocr': {
        title: 'OCR PDF',
        desc: 'Taranmış PDF veya görüntüdeki metni tanıyın (Tesseract.js)',
        color: '#f472b6',
        gradient: 'linear-gradient(135deg,#f472b6,#fb7185)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>`,
        accept: '.pdf,.jpg,.jpeg,.png',
        multiple: false,
        processLabel: 'Metni Tanı',
        options: 'ocr',
        note: 'OCR işlemi sayfa başına ~10-30 saniye sürebilir. Türkçe ve İngilizce desteklenir.',
    },
    'sign': {

        title: 'PDF İmzala',
        desc: 'Kanvas üzerinde el yazısı imzanızı çizin ve PDF\'e ekleyin',
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg,#06b6d4,#22d3ee)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'İmzayı Ekle',
        options: 'sign',
    },
    'pagenumbers': {
        title: 'Sayfa Numarası Ekle',
        desc: 'Her sayfaya otomatik numara ekleyin',
        color: '#d946ef',
        gradient: 'linear-gradient(135deg,#d946ef,#e879f9)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="11" y1="14" x2="11" y2="18"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Numara Ekle',
        options: 'pagenumbers',
    },
    'meta': {
        title: 'Meta Düzenle',
        desc: 'PDF başlık, yazar ve konu bilgilerini düzenleyin',
        color: '#64748b',
        gradient: 'linear-gradient(135deg,#64748b,#94a3b8)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Kaydet',
        options: 'meta',
    },
    'grayscale': {
        title: 'Gri Tona Çevir',
        desc: 'Renkli PDF\'i siyah-beyaz yapın, boyutu küçültün',
        color: '#78716c',
        gradient: 'linear-gradient(135deg,#78716c,#a8a29e)',
        icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>`,
        accept: '.pdf',
        multiple: false,
        processLabel: 'Gri Tona Çevir',
        options: null,
    },
};


/* ======================== UI BUILDER ======================== */
function buildToolOptions(toolId) {
    const tool = TOOLS[toolId];
    if (!tool.options) return '';
    const opts = {
        split: `
      <div class="tool-options">
        <label class="option-label">Sayfa Aralığı (örnek: 1-3, 5, 7-9)</label>
        <input class="option-input" id="splitRange" type="text" placeholder="1-3, 5, 7-9" />
      </div>`,
        compress: `
      <div class="tool-options">
        <label class="option-label">Sıkıştırma Seviyesi</label>
        <div class="option-radio" id="compressLevel">
          <button class="radio-btn selected" data-val="low">Düşük (%60)</button>
          <button class="radio-btn" data-val="medium">Orta (%40)</button>
          <button class="radio-btn" data-val="high">Yüksek (%20)</button>
        </div>
      </div>`,
        rotate: `
      <div class="tool-options">
        <label class="option-label">Döndürme Açısı</label>
        <div class="option-radio" id="rotateAngle">
          <button class="radio-btn selected" data-val="90">90°</button>
          <button class="radio-btn" data-val="180">180°</button>
          <button class="radio-btn" data-val="270">270°</button>
        </div>
      </div>`,
        protect: `
      <div class="tool-options">
        <label class="option-label">Kullanıcı Parolası</label>
        <input class="option-input" id="protectPass" type="password" placeholder="Parola girin…" />
        <label class="option-label" style="margin-top:12px">Sahip Parolası (isteğe bağlı)</label>
        <input class="option-input" id="ownerPass" type="password" placeholder="Sahip parolası…" />
      </div>`,
        unlock: `
      <div class="tool-options">
        <label class="option-label">Mevcut Parola</label>
        <input class="option-input" id="unlockPass" type="password" placeholder="Mevcut parolayı girin…" />
      </div>`,
        watermark: `
      <div class="tool-options">
        <label class="option-label">Filigran Metni</label>
        <input class="option-input" id="wmText" type="text" placeholder="Örn: GİZLİ" value="PDFStar" />
        <label class="option-label" style="margin-top:12px">Opaklık</label>
        <div class="option-radio" id="wmOpacity">
          <button class="radio-btn" data-val="0.1">10%</button>
          <button class="radio-btn selected" data-val="0.2">20%</button>
          <button class="radio-btn" data-val="0.4">40%</button>
        </div>
      </div>`,
        sign: `
      <div class="tool-options">
        <label class="option-label">İmzanızı aşağıya çizin</label>
        <div class="sign-pad-wrap">
          <canvas id="signCanvas" width="480" height="160" style="background:rgba(255,255,255,0.05);border:1px solid var(--clr-border-2);border-radius:var(--r-md);cursor:crosshair;touch-action:none;display:block;width:100%"></canvas>
          <button class="radio-btn" style="margin-top:8px" onclick="clearSignCanvas()">Temizle</button>
        </div>
        <label class="option-label" style="margin-top:12px">İmza Konumu</label>
        <div class="option-radio" id="signPos">
          <button class="radio-btn" data-val="bottom-left">Sol Alt</button>
          <button class="radio-btn selected" data-val="bottom-right">Sağ Alt</button>
          <button class="radio-btn" data-val="bottom-center">Orta Alt</button>
        </div>
      </div>`,
        pagenumbers: `
      <div class="tool-options">
        <label class="option-label">Numara Konumu</label>
        <div class="option-radio" id="pageNumPos">
          <button class="radio-btn" data-val="bottom-left">Sol Alt</button>
          <button class="radio-btn selected" data-val="bottom-center">Orta Alt</button>
          <button class="radio-btn" data-val="bottom-right">Sağ Alt</button>
        </div>
        <label class="option-label" style="margin-top:12px">Başlangıç Numarası</label>
        <input class="option-input" id="pageNumStart" type="number" value="1" min="1" style="width:120px" />
      </div>`,
        meta: `
      <div class="tool-options">
        <label class="option-label">Başlık</label>
        <input class="option-input" id="metaTitle" type="text" placeholder="Belge başlığı" />
        <label class="option-label" style="margin-top:12px">Yazar</label>
        <input class="option-input" id="metaAuthor" type="text" placeholder="Yazar adı" />
        <label class="option-label" style="margin-top:12px">Konu</label>
        <input class="option-input" id="metaSubject" type="text" placeholder="Konu" />
        <label class="option-label" style="margin-top:12px">Anahtar Kelimeler</label>
        <input class="option-input" id="metaKeywords" type="text" placeholder="kelime1, kelime2" />
      </div>`,
        ocr: `
      <div class="tool-options">
        <label class="option-label">Metin Tanıma Dili</label>
        <div class="option-radio" id="ocrLang">
          <button class="radio-btn selected" data-val="tur">Türkçe</button>
          <button class="radio-btn" data-val="eng">English</button>
          <button class="radio-btn" data-val="tur+eng">TR + EN</button>
        </div>
      </div>`,
    };
    return opts[tool.options] || '';
}

function buildToolUI(toolId) {
    const tool = TOOLS[toolId];
    if (!tool) return '<p style="color:var(--clr-text-2)">Araç bulunamadı.</p>';
    const note = tool.note ? `<p style="font-size:0.75rem;color:var(--clr-text-3);margin-top:8px;line-height:1.5">${tool.note}</p>` : '';
    const multiHint = tool.multiple ? 'Birden fazla dosya seçebilirsiniz' : 'Tek dosya seçin';
    // Sign tool gets a custom layout (no standard dropzone first)
    if (toolId === 'sign') {
        return `
        <div class="modal-tool-header">
          <div class="modal-tool-icon" style="background:${tool.gradient}">${tool.icon}</div>
          <div><div class="modal-tool-title" data-i18n="tool-sign">${t('tool-sign')}</div><div class="modal-tool-desc" data-i18n="tool-sign-desc">${t('tool-sign-desc')}</div></div>
        </div>
        ${buildToolOptions('sign')}
        <div style="margin-top:16px">
          <label class="option-label">PDF Dosyası Seç</label>
          <div class="dropzone" id="dropzone-sign" style="padding:20px" ondragover="handleDragOver(event,'sign')" ondragleave="handleDragLeave('sign')" ondrop="handleDrop(event,'sign')">
            <input type="file" id="fileInput-sign" accept=".pdf" onchange="handleFiles(this.files,'sign')" />
            <div class="dz-title" style="font-size:0.85rem" data-i18n="drop-hint">${t('drop-hint')}</div>
            <span class="dz-btn" style="margin-top:8px;padding:6px 14px;font-size:0.78rem" data-i18n="select-file">${t('select-file')}</span>
          </div>
          <div class="file-list" id="fileList-sign"></div>
        </div>
        <button class="process-btn" id="processBtn-sign" disabled onclick="processTool('sign')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          ${tool.processLabel}
        </button>
        <div class="progress-wrap" id="progress-sign"><div class="progress-label"><span id="progressMsg-sign" data-i18n="processing">${t('processing')}</span><span id="progressPct-sign">0%</span></div><div class="progress-bar-bg"><div class="progress-bar-fill" id="progressFill-sign"></div></div></div>
        <div class="result-box" id="result-sign"><div class="result-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="result-text"><div class="result-title" data-i18n="done">${t('done')}</div><div class="result-sub" id="resultSub-sign" data-i18n="result-ready">${t('result-ready')}</div></div><a id="downloadLink-sign" class="download-btn" data-i18n="download">${t('download')}</a></div>
        `;
    }
    return `
    <div class="modal-tool-header">
      <div class="modal-tool-icon" style="background:${tool.gradient}">${tool.icon}</div>
      <div>
        <div class="modal-tool-title" data-i18n="tool-${toolId}">${t('tool-' + toolId)}</div>
        <div class="modal-tool-desc" data-i18n="tool-${toolId}-desc">${t('tool-' + toolId + '-desc')}</div>
      </div>
    </div>
    <div class="dropzone" id="dropzone-${toolId}" ondragover="handleDragOver(event,'${toolId}')" ondragleave="handleDragLeave('${toolId}')" ondrop="handleDrop(event,'${toolId}')">
      <input type="file" id="fileInput-${toolId}" accept="${tool.accept}" ${tool.multiple ? 'multiple' : ''} onchange="handleFiles(this.files,'${toolId}')" />
      <div class="dz-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </div>
      <div class="dz-title" data-i18n="drop-hint">${t('drop-hint')}</div>
      <div class="dz-sub">${multiHint} · ${tool.accept.replace(/\./g, '').toUpperCase().split(',').join(', ')}</div>
      <span class="dz-btn" data-i18n="select-file">${t('select-file')}</span>
    </div>
    <div class="file-list" id="fileList-${toolId}"></div>
    ${buildToolOptions(toolId)}
    ${note}
    <button class="process-btn" id="processBtn-${toolId}" disabled onclick="processTool('${toolId}')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      ${tool.processLabel}
    </button>
    <div class="progress-wrap" id="progress-${toolId}">
      <div class="progress-label"><span id="progressMsg-${toolId}" data-i18n="processing">${t('processing')}</span><span id="progressPct-${toolId}">0%</span></div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" id="progressFill-${toolId}"></div></div>
    </div>
    <div class="result-box" id="result-${toolId}">
      <div class="result-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div class="result-text">
        <div class="result-title" data-i18n="done">${t('done')}</div>
        <div class="result-sub" id="resultSub-${toolId}" data-i18n="result-ready">${t('result-ready')}</div>
      </div>
      <a id="downloadLink-${toolId}" class="download-btn" data-i18n="download">${t('download')}</a>
    </div>
  `;
}

/* ======================== FILE HANDLING ======================== */
const fileStore = {};
const pageCountStore = {}; // key: toolId-fileIndex → page count

function initToolDrop(toolId) {
    fileStore[toolId] = [];
    // Radio buttons
    document.querySelectorAll(`#compressLevel .radio-btn, #rotateAngle .radio-btn, #wmOpacity .radio-btn`).forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.option-radio').querySelectorAll('.radio-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}

function handleDragOver(e, toolId) {
    e.preventDefault();
    document.getElementById(`dropzone-${toolId}`)?.classList.add('dragover');
}

function handleDragLeave(toolId) {
    document.getElementById(`dropzone-${toolId}`)?.classList.remove('dragover');
}

// handleDrop is defined later in the file (supports 'organize' tool too)

async function handleFiles(filesInput, toolId) {
    const files = filesInput instanceof FileList ? Array.from(filesInput) : filesInput;
    const tool = TOOLS[toolId];
    if (!tool.multiple) fileStore[toolId] = [];
    files.forEach(f => {
        if (!fileStore[toolId].find(x => x.name === f.name && x.size === f.size)) {
            fileStore[toolId].push(f);
        }
    });
    renderFileList(toolId);
    updateProcessBtn(toolId);

    // Async: get page counts + thumbnails for PDF files via PDF.js
    if (window.pdfjsLib) {
        const allFiles = fileStore[toolId];
        for (let i = 0; i < allFiles.length; i++) {
            const storeKey = `${toolId}-${i}`;
            const f = allFiles[i];
            const isPdf = f.name.toLowerCase().endsWith('.pdf');

            if (isPdf && pageCountStore[storeKey] === undefined) {
                try {
                    const buf = await readFileAsArrayBuffer(f);
                    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
                    pageCountStore[storeKey] = pdf.numPages;
                    renderFileList(toolId);

                    // Render thumbnail for first file only
                    if (i === 0) {
                        const page = await pdf.getPage(1);
                        const vp = page.getViewport({ scale: 0.35 });
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.round(vp.width);
                        canvas.height = Math.round(vp.height);
                        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
                        appendThumb(toolId, canvas, `Sayfa 1/${pdf.numPages}`);
                    }
                } catch { /* ignore */ }
            }

            // Image thumbnail
            const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            if (imgExts.some(ext => f.name.toLowerCase().endsWith(ext)) && i < 4) {
                const url = URL.createObjectURL(f);
                const img = document.createElement('img');
                img.src = url;
                img.onload = () => appendThumb(toolId, img, f.name.split('.')[0]);
            }
        }
    }
}

function appendThumb(toolId, element, label) {
    // Find or create the thumb strip
    const list = document.getElementById(`fileList-${toolId}`);
    if (!list) return;
    let strip = list.nextElementSibling;
    if (!strip || !strip.classList.contains('thumb-strip')) {
        strip = document.createElement('div');
        strip.className = 'thumb-strip';
        list.after(strip);
    }
    // Avoid duplicate
    if (strip.querySelector(`[data-label="${label}"]`)) return;

    const item = document.createElement('div');
    item.className = 'thumb-item';
    item.dataset.label = label;
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.objectFit = 'cover';
    item.appendChild(element);
    const lbl = document.createElement('div');
    lbl.className = 'thumb-label';
    lbl.textContent = label;
    item.appendChild(lbl);
    strip.appendChild(item);
}


function renderFileList(toolId) {
    const list = document.getElementById(`fileList-${toolId}`);
    if (!list) return;
    list.innerHTML = fileStore[toolId].map((f, i) => {
        const pages = pageCountStore[`${toolId}-${i}`];
        const pageBadge = pages !== undefined
            ? `<span class="file-item-pages">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                ${pages} sayfa
               </span>`
            : (f.name.toLowerCase().endsWith('.pdf')
                ? `<span class="file-item-pages file-item-pages--loading">…</span>`
                : '');
        return `
        <div class="file-item" id="fi-${toolId}-${i}">
          <span class="file-item-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <span class="file-item-name">${f.name}</span>
          ${pageBadge}
          <span class="file-item-size">${formatSize(f.size)}</span>
          <span class="file-item-rm" onclick="removeFile('${toolId}',${i})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
        </div>`;
    }).join('');
}

function removeFile(toolId, idx) {
    // Remove page count cache entries and shift remaining keys
    const remaining = fileStore[toolId].length;
    delete pageCountStore[`${toolId}-${idx}`];
    for (let i = idx + 1; i < remaining; i++) {
        const prev = pageCountStore[`${toolId}-${i}`];
        if (prev !== undefined) {
            pageCountStore[`${toolId}-${i - 1}`] = prev;
            delete pageCountStore[`${toolId}-${i}`];
        }
    }
    fileStore[toolId].splice(idx, 1);
    renderFileList(toolId);
    updateProcessBtn(toolId);
}

function updateProcessBtn(toolId) {
    const btn = document.getElementById(`processBtn-${toolId}`);
    if (btn) btn.disabled = fileStore[toolId].length === 0;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

/* ======================== PROGRESS ======================== */
function showProgress(toolId) {
    document.getElementById(`progress-${toolId}`)?.classList.add('visible');
}

async function animateProgress(toolId, from, to, duration = 800) {
    const fill = document.getElementById(`progressFill-${toolId}`);
    const pct = document.getElementById(`progressPct-${toolId}`);
    const start = performance.now();
    return new Promise(resolve => {
        function step(now) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const val = Math.round(from + (to - from) * eased);
            if (fill) fill.style.width = val + '%';
            if (pct) pct.textContent = val + '%';
            if (t < 1) requestAnimationFrame(step);
            else resolve();
        }
        requestAnimationFrame(step);
    });
}

function setProgressMsg(toolId, msg) {
    const el = document.getElementById(`progressMsg-${toolId}`);
    if (el) el.textContent = msg;
}

function showResult(toolId, blob, filename, sub) {
    document.getElementById(`progress-${toolId}`)?.classList.remove('visible');
    const url = URL.createObjectURL(blob);
    const link = document.getElementById(`downloadLink-${toolId}`);
    if (link) { link.href = url; link.download = filename; }
    const subEl = document.getElementById(`resultSub-${toolId}`);
    if (subEl) subEl.textContent = sub || `${filename} hazır (${formatSize(blob.size)})`;
    document.getElementById(`result-${toolId}`)?.classList.add('visible');
}

/* ======================== PDF PROCESSING ======================== */
async function processTool(toolId) {
    const files = fileStore[toolId];
    if (!files || files.length === 0) { showToast(typeof t === 'function' ? t('no-file') : 'Lütfen önce bir dosya seçin.'); return; }

    // Guard: ensure pdf-lib loaded
    if (!window.PDFLib) {
        showToast('⚠️ PDF kütüphanesi yüklenmedi. İnternet bağlantınızı kontrol edin ve sayfayı yenileyin.', 5000);
        return;
    }

    const processBtn = document.getElementById(`processBtn-${toolId}`);
    if (processBtn) processBtn.disabled = true;
    document.getElementById(`result-${toolId}`)?.classList.remove('visible');
    showProgress(toolId);

    try {
        await animateProgress(toolId, 0, 10, 200);
        switch (toolId) {
            case 'merge': await doMerge(toolId, files); break;
            case 'split': await doSplit(toolId, files[0]); break;
            case 'compress': await doCompress(toolId, files[0]); break;
            case 'rotate': await doRotate(toolId, files[0]); break;
            case 'protect': await doProtect(toolId, files[0]); break;
            case 'watermark': await doWatermark(toolId, files[0]); break;
            case 'unlock': await doUnlock(toolId, files[0]); break;
            case 'pdf-to-jpg': await doPdfToJpg(toolId, files[0]); break;
            case 'jpg-to-pdf': await doJpgToPdf(toolId, files); break;
            case 'pdf-to-word': await doPdfToWord(toolId, files[0]); break;
            case 'word-to-pdf': await doWordToPdf(toolId, files[0]); break;
            case 'excel-to-pdf': await doExcelToPdf(toolId, files[0]); break;
            case 'sign': await doSign(toolId, files[0]); break;
            case 'pagenumbers': await doPageNumbers(toolId, files[0]); break;
            case 'meta': await doMeta(toolId, files[0]); break;
            case 'grayscale': await doGrayscale(toolId, files[0]); break;
            case 'organize': await doOrganize(toolId); break;
            case 'ocr': await doOCR(toolId, files[0]); break;
            default: showToast('Bu araç henüz geliştirilme aşamasında.'); break;
        }
    } catch (err) {
        console.error('[PDFStar]', err);
        const msg = err?.message || 'Bilinmeyen hata';
        showToast('❌ Hata: ' + msg, 5000);
        document.getElementById(`progress-${toolId}`)?.classList.remove('visible');
        if (processBtn) processBtn.disabled = false;
    }
}

/* ── MERGE ── */
async function doMerge(toolId, files) {
    const { PDFDocument } = window.PDFLib;
    setProgressMsg(toolId, 'Dosyalar okunuyor…');
    await animateProgress(toolId, 10, 40, 500);

    const merged = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
        setProgressMsg(toolId, `Sayfa ${i + 1}/${files.length} ekleniyor…`);
        const bytes = await readFileAsArrayBuffer(files[i]);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
        await animateProgress(toolId, 40 + (i / files.length) * 40, 40 + ((i + 1) / files.length) * 40, 300);
    }
    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 80, 100, 400);
    const bytes = await merged.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    showResult(toolId, blob, 'birlestirilmis.pdf', `${files.length} dosya birleştirildi · ${formatSize(blob.size)}`);
}

/* ── SPLIT ── */
async function doSplit(toolId, file) {
    const { PDFDocument } = window.PDFLib;
    setProgressMsg(toolId, 'PDF okunuyor…');
    await animateProgress(toolId, 10, 40, 500);

    const bytes = await readFileAsArrayBuffer(file);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = src.getPageCount();
    const rangeStr = document.getElementById('splitRange')?.value?.trim() || '1';
    const indices = parsePageRange(rangeStr, total);

    setProgressMsg(toolId, 'Sayfalar ayıklanıyor…');
    await animateProgress(toolId, 40, 80, 500);

    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(src, indices);
    pages.forEach(p => newDoc.addPage(p));

    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 80, 100, 400);
    const outBytes = await newDoc.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    showResult(toolId, blob, 'bolunmus.pdf', `${indices.length} sayfa çıkartıldı (toplam ${total} sayfa)`);
}

function parsePageRange(str, max) {
    const result = new Set();
    str.split(',').forEach(part => {
        const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
        if (!m) return;
        const from = parseInt(m[1]) - 1;
        const to = m[2] ? parseInt(m[2]) - 1 : from;
        for (let i = Math.max(0, from); i <= Math.min(max - 1, to); i++) result.add(i);
    });
    return Array.from(result).sort((a, b) => a - b);
}

/* ── COMPRESS ── */
async function doCompress(toolId, file) {
    const { PDFDocument } = window.PDFLib;

    // Verify pdf.js is available for rendering
    if (!window.pdfjsLib) {
        showToast('⚠️ PDF.js yüklenmedi. Sayfayı yenileyin.', 4000);
        return;
    }

    // Compression settings per level
    const lvl = document.querySelector('#compressLevel .selected')?.dataset.val || 'low';
    const settings = {
        low: { scale: 1.5, quality: 0.80 },  // better quality, less compression
        medium: { scale: 1.2, quality: 0.65 },  // balanced
        high: { scale: 1.0, quality: 0.45 },  // max compression
    };
    const { scale, quality } = settings[lvl];

    setProgressMsg(toolId, 'PDF okunuyor…');
    await animateProgress(toolId, 10, 20, 300);

    const bytes = await readFileAsArrayBuffer(file);

    // Load with pdf.js for rendering
    const pdfDoc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    const totalPages = pdfDoc.numPages;

    // Create new pdf-lib document
    const outDoc = await PDFDocument.create();

    for (let p = 1; p <= totalPages; p++) {
        setProgressMsg(toolId, `Sayfa ${p}/${totalPages} sıkıştırılıyor…`);

        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale });

        // Render to canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Encode canvas to JPEG bytes
        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = jpegDataUrl.split(',')[1];
        const jpegBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        // Embed JPEG into new pdf-lib page (same physical dimensions as original)
        const origViewport = page.getViewport({ scale: 1.0 });
        const jpgImage = await outDoc.embedJpg(jpegBytes);
        const pdfPage = outDoc.addPage([origViewport.width, origViewport.height]);
        pdfPage.drawImage(jpgImage, {
            x: 0, y: 0,
            width: origViewport.width,
            height: origViewport.height,
        });

        const pct = 20 + Math.round((p / totalPages) * 70);
        await animateProgress(toolId, pct - (70 / totalPages), pct, 100);
    }

    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 90, 100, 400);

    const outBytes = await outDoc.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });

    const originalSize = file.size;
    const newSize = blob.size;
    const ratio = ((1 - newSize / originalSize) * 100).toFixed(1);
    const sign = newSize < originalSize ? '↓' : '↑';

    showResult(
        toolId, blob, 'sikistirilmis.pdf',
        `Orijinal: ${formatSize(originalSize)} ${sign} Yeni: ${formatSize(newSize)} (%${Math.abs(ratio)} ${newSize < originalSize ? 'küçültme' : 'büyüme – düşük kalite seç'})`
    );
}

/* ── ROTATE ── */
async function doRotate(toolId, file) {
    const { PDFDocument, degrees } = window.PDFLib;
    setProgressMsg(toolId, 'PDF okunuyor…');
    await animateProgress(toolId, 10, 50, 500);

    const bytes = await readFileAsArrayBuffer(file);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const angle = parseInt(document.querySelector('#rotateAngle .selected')?.dataset.val || '90');
    doc.getPages().forEach(page => {
        const current = page.getRotation().angle;
        page.setRotation(degrees(current + angle));
    });
    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 50, 100, 500);
    const outBytes = await doc.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    showResult(toolId, blob, 'dondurulmus.pdf', `Tüm sayfalar ${angle}° döndürüldü`);
}

/* ── PROTECT ── */
async function doProtect(toolId, file) {
    setProgressMsg(toolId, 'PDF şifreleniyor…');
    await animateProgress(toolId, 10, 40, 400);
    // pdf-lib doesn't support encryption natively. We'll create a copy and note.
    const bytes = await readFileAsArrayBuffer(file);
    await animateProgress(toolId, 40, 100, 700);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    showToast('⚠️ Gerçek şifreleme için sunucu gereklidir. Demo: orijinal dosya indirildi.', 5000);
    showResult(toolId, blob, 'korunmis.pdf', 'Demo modu – Tam şifreleme için sunucu gerekir');
}

/* ── UNLOCK ── */
async function doUnlock(toolId, file) {
    const { PDFDocument } = window.PDFLib;
    setProgressMsg(toolId, 'PDF kilidi açılıyor…');
    await animateProgress(toolId, 10, 50, 500);
    const pass = document.getElementById('unlockPass')?.value || '';
    const bytes = await readFileAsArrayBuffer(file);
    try {
        const doc = await PDFDocument.load(bytes, { password: pass, ignoreEncryption: true });
        await animateProgress(toolId, 50, 100, 500);
        const out = await doc.save();
        const blob = new Blob([out], { type: 'application/pdf' });
        showResult(toolId, blob, 'kilitacilmis.pdf');
    } catch {
        throw new Error('Parola yanlış veya dosya şifreli değil.');
    }
}

/* ── WATERMARK ── */
async function doWatermark(toolId, file) {
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    setProgressMsg(toolId, 'Filigran ekleniyor…');
    await animateProgress(toolId, 10, 50, 500);

    const bytes = await readFileAsArrayBuffer(file);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const text = document.getElementById('wmText')?.value || 'PDFStar';
    const opacity = parseFloat(document.querySelector('#wmOpacity .selected')?.dataset.val || '0.2');

    doc.getPages().forEach(page => {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) * 0.12;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(0.5, 0.5, 0.5),
            opacity,
            rotate: { type: 'degrees', angle: 45 },
        });
    });

    await animateProgress(toolId, 50, 100, 500);
    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'filigranli.pdf', `"${text}" filigranı eklendi`);
}

/* ── PDF TO JPG ── */
async function doPdfToJpg(toolId, file) {
    setProgressMsg(toolId, 'PDF.js yükleniyor…');
    await animateProgress(toolId, 10, 30, 400);
    if (!window.pdfjsLib) {
        showToast('PDF.js başlatılmadı. Sayfayı yenileyin.', 4000);
        return;
    }
    const bytes = await readFileAsArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    const page = await pdf.getPage(1);
    const scale = 2.0;
    const vp = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;

    setProgressMsg(toolId, 'Görüntü dönüştürülüyor…');
    await animateProgress(toolId, 50, 100, 500);

    canvas.toBlob(blob => {
        showResult(toolId, blob, 'sayfa1.jpg', `Sayfa 1 / ${pdf.numPages} – ${vp.width}×${vp.height}px`);
    }, 'image/jpeg', 0.92);
}

/* ── JPG TO PDF ── */
async function doJpgToPdf(toolId, files) {
    const { PDFDocument } = window.PDFLib;
    setProgressMsg(toolId, 'Görüntüler işleniyor…');
    await animateProgress(toolId, 10, 30, 300);

    const doc = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
        const bytes = await readFileAsArrayBuffer(files[i]);
        const ext = files[i].name.split('.').pop().toLowerCase();
        let img;
        if (ext === 'png') img = await doc.embedPng(bytes);
        else img = await doc.embedJpg(bytes);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        await animateProgress(toolId, 30 + (i / files.length) * 60, 30 + ((i + 1) / files.length) * 60, 200);
    }
    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 90, 100, 300);
    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'gorseller.pdf', `${files.length} görüntü birleştirildi`);
}

/* ── PDF TO WORD (text extraction demo) ── */
async function doPdfToWord(toolId, file) {
    setProgressMsg(toolId, 'Metin çıkartılıyor…');
    await animateProgress(toolId, 10, 50, 700);
    if (!window.pdfjsLib) { showToast('PDF.js gerekli.'); return; }
    const bytes = await readFileAsArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const content = await pg.getTextContent();
        fullText += content.items.map(s => s.str).join(' ') + '\n\n';
    }
    await animateProgress(toolId, 50, 100, 500);
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    showResult(toolId, blob, 'metin.txt', `${pdf.numPages} sayfa metin çıkarıldı`);
}

/* ── WORD / EXCEL TO PDF (demo) ── */
async function doWordToPdf(toolId, file) {
    setProgressMsg(toolId, 'Dosya okunuyor…');
    await animateProgress(toolId, 10, 80, 800);
    const bytes = await readFileAsArrayBuffer(file);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    await animateProgress(toolId, 80, 100, 400);
    showResult(toolId, blob, 'belge.pdf', 'Demo modu – Gerçek dönüşüm sunucu gerektirir');
    showToast('Demo: Tam Word→PDF için LibreOffice tabanlı bir backend gerekir.', 5000);
}

async function doExcelToPdf(toolId, file) {
    setProgressMsg(toolId, 'CSV okunuyor…');
    await animateProgress(toolId, 10, 50, 600);
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const text = await file.text();
    const rows = text.split('\n').map(r => r.split(','));
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    let y = 800;
    rows.slice(0, 40).forEach((row, ri) => {
        const line = row.join('  |  ');
        page.drawText(line.slice(0, 90), { x: 30, y, size: ri === 0 ? 11 : 9, font, color: rgb(0.9, 0.9, 0.9) });
        y -= 16;
    });
    await animateProgress(toolId, 50, 100, 500);
    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'tablo.pdf', `${rows.length} satır dönüştürüldü`);
}

/* ======================== FILE READER ======================== */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/* ======================== SIGNATURE CANVAS ======================== */
let _signDrawing = false;

function initSignPad() {
    const canvas = document.getElementById('signCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#a78bfa';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    canvas.addEventListener('mousedown', e => { _signDrawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove', e => { if (!_signDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    canvas.addEventListener('mouseup', () => _signDrawing = false);
    canvas.addEventListener('mouseleave', () => _signDrawing = false);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); _signDrawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); }, { passive: false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if (!_signDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, { passive: false });
    canvas.addEventListener('touchend', () => _signDrawing = false);
}

function clearSignCanvas() {
    const c = document.getElementById('signCanvas');
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

/* ── SIGN ── */
async function doSign(toolId, file) {
    const { PDFDocument } = window.PDFLib;
    const canvas = document.getElementById('signCanvas');
    if (!canvas) throw new Error('İmza kanvası bulunamadı.');

    // Check if canvas has any drawing
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imgData.data.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasDrawing) throw new Error('Lütfen önce imzanızı çizin.');

    setProgressMsg(toolId, 'İmza hazırlanıyor…');
    await animateProgress(toolId, 10, 40, 400);

    // Convert canvas to PNG bytes
    const pngDataUrl = canvas.toDataURL('image/png');
    const base64 = pngDataUrl.split(',')[1];
    const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const bytes = await readFileAsArrayBuffer(file);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pngImage = await doc.embedPng(pngBytes);
    const imgW = 160, imgH = 60;

    const pos = document.querySelector('#signPos .selected')?.dataset.val || 'bottom-right';
    const pages = doc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    let x;
    if (pos === 'bottom-left') x = 30;
    else if (pos === 'bottom-center') x = (width - imgW) / 2;
    else x = width - imgW - 30;

    lastPage.drawImage(pngImage, { x, y: 30, width: imgW, height: imgH, opacity: 0.9 });

    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 40, 100, 500);
    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'imzali.pdf', `İmza ${pages.length}. sayfanın ${pos === 'bottom-left' ? 'sol altına' : pos === 'bottom-center' ? 'ortasına' : 'sağ altına'} eklendi`);
}

/* ── PAGE NUMBERS ── */
async function doPageNumbers(toolId, file) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    setProgressMsg(toolId, 'Sayfa numaraları ekleniyor…');
    await animateProgress(toolId, 10, 40, 400);

    const bytes = await readFileAsArrayBuffer(file);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const pos = document.querySelector('#pageNumPos .selected')?.dataset.val || 'bottom-center';
    const startNum = parseInt(document.getElementById('pageNumStart')?.value || '1');

    pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = String(startNum + i);
        const textW = font.widthOfTextAtSize(text, 10);
        let x;
        if (pos === 'bottom-left') x = 30;
        else if (pos === 'bottom-center') x = (width - textW) / 2;
        else x = width - textW - 30;
        page.drawText(text, { x, y: 20, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    });

    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 40, 100, 500);
    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'numaralanmis.pdf', `${pages.length} sayfaya numara eklendi (${startNum}–${startNum + pages.length - 1})`);
}

/* ── META EDIT ── */
async function doMeta(toolId, file) {
    const { PDFDocument } = window.PDFLib;
    setProgressMsg(toolId, 'Meta bilgileri güncelleniyor…');
    await animateProgress(toolId, 10, 60, 500);

    const bytes = await readFileAsArrayBuffer(file);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const title = document.getElementById('metaTitle')?.value;
    const author = document.getElementById('metaAuthor')?.value;
    const subject = document.getElementById('metaSubject')?.value;
    const keywords = document.getElementById('metaKeywords')?.value;

    if (title) doc.setTitle(title);
    if (author) doc.setAuthor(author);
    if (subject) doc.setSubject(subject);
    if (keywords) doc.setKeywords(keywords.split(',').map(k => k.trim()));
    doc.setProducer('PDFStar');
    doc.setCreator('PDFStar');

    await animateProgress(toolId, 60, 100, 400);
    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'meta-guncellenmis.pdf', `Meta bilgileri güncellendi`);
}

/* ── GRAYSCALE ── */
async function doGrayscale(toolId, file) {
    const { PDFDocument } = window.PDFLib;
    if (!window.pdfjsLib) { showToast('PDF.js gerekli.'); return; }

    setProgressMsg(toolId, 'PDF okunuyor…');
    await animateProgress(toolId, 10, 20, 300);

    const bytes = await readFileAsArrayBuffer(file);
    const pdfDoc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    const totalPages = pdfDoc.numPages;
    const outDoc = await PDFDocument.create();

    for (let p = 1; p <= totalPages; p++) {
        setProgressMsg(toolId, `Sayfa ${p}/${totalPages} gri tona çevriliyor…`);
        const page = await pdfDoc.getPage(p);
        const vp = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        // Apply grayscale filter via pixel manipulation
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            d[i] = d[i + 1] = d[i + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);

        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = jpegDataUrl.split(',')[1];
        const jpegBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const origVp = page.getViewport({ scale: 1.0 });
        const jpgImg = await outDoc.embedJpg(jpegBytes);
        const pdfPage = outDoc.addPage([origVp.width, origVp.height]);
        pdfPage.drawImage(jpgImg, { x: 0, y: 0, width: origVp.width, height: origVp.height });

        const pct = 20 + Math.round((p / totalPages) * 70);
        await animateProgress(toolId, pct - (70 / totalPages), pct, 100);
    }

    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 90, 100, 400);
    const out = await outDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'gri-ton.pdf', `${totalPages} sayfa gri tona çevrildi`);
}


/* ======================== ORGANIZE PAGES ======================== */

// Holds rendered page order for organize tool
let _organizePageOrder = []; // indices into the original PDF (0-based)
let _organizePdfBytes = null;
let _organizePdfDoc = null; // pdfjsLib doc

function buildOrganizeUI() {
    const tool = TOOLS['organize'];
    return `
    <div class="modal-tool-header">
      <div class="modal-tool-icon" style="background:${tool.gradient}">${tool.icon}</div>
      <div>
        <div class="modal-tool-title" data-i18n="tool-organize">${t('tool-organize')}</div>
        <div class="modal-tool-desc" data-i18n="tool-organize-desc">${t('tool-organize-desc')}</div>
      </div>
    </div>
    <div class="dropzone" id="dropzone-organize" ondragover="handleDragOver(event,'organize')" ondragleave="handleDragLeave('organize')" ondrop="handleDrop(event,'organize')">
      <input type="file" id="fileInput-organize" accept=".pdf" onchange="handleOrganizeFile(this.files)" />
      <div class="dz-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </div>
      <div class="dz-title" data-i18n="drop-hint">${t('drop-hint')}</div>
      <div class="dz-sub">Dosya seçildikten sonra sayfalar önizlemeli olarak görünür</div>
      <span class="dz-btn" data-i18n="select-file">${t('select-file')}</span>
    </div>
    <div id="organize-loading" style="display:none;text-align:center;padding:16px;color:var(--clr-text-2);font-size:0.875rem">📄 Sayfalar yükleniyor…</div>
    <div id="organize-grid" class="organize-grid" style="display:none"></div>
    <p id="organize-hint" style="display:none;font-size:0.75rem;color:var(--clr-text-3);text-align:center;margin-top:6px">↔ Sayfaları sürükleyerek sıralayın · Silmek için × düğmesine tıklayın</p>
    <button class="process-btn" id="processBtn-organize" disabled onclick="processTool('organize')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      ${tool.processLabel}
    </button>
    <div class="progress-wrap" id="progress-organize">
      <div class="progress-label"><span id="progressMsg-organize" data-i18n="processing">${t('processing')}</span><span id="progressPct-organize">0%</span></div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" id="progressFill-organize"></div></div>
    </div>
    <div class="result-box" id="result-organize">
      <div class="result-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div class="result-text">
        <div class="result-title" data-i18n="done">${t('done')}</div>
        <div class="result-sub" id="resultSub-organize" data-i18n="result-ready">${t('result-ready')}</div>
      </div>
      <a id="downloadLink-organize" class="download-btn" data-i18n="download">${t('download')}</a>
    </div>
  `;
}

async function handleOrganizeFile(filesInput) {
    const files = filesInput instanceof FileList ? Array.from(filesInput) : filesInput;
    if (!files || files.length === 0) return;
    const file = files[0];
    fileStore['organize'] = [file];

    // Show loading
    document.getElementById('organize-loading').style.display = 'block';
    document.getElementById('organize-grid').style.display = 'none';
    document.getElementById('organize-hint').style.display = 'none';
    document.getElementById('processBtn-organize').disabled = true;

    if (!window.pdfjsLib) { showToast('PDF.js gerekli. Sayfayı yenileyin.', 4000); return; }

    try {
        const bytes = await readFileAsArrayBuffer(file);
        _organizePdfBytes = bytes;
        _organizePdfDoc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
        const total = _organizePdfDoc.numPages;
        _organizePageOrder = Array.from({ length: total }, (_, i) => i + 1); // 1-based page numbers

        const grid = document.getElementById('organize-grid');
        grid.innerHTML = '';

        for (let p = 1; p <= total; p++) {
            const page = await _organizePdfDoc.getPage(p);
            const vp = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(vp.width);
            canvas.height = Math.round(vp.height);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

            const item = document.createElement('div');
            item.className = 'organize-item';
            item.dataset.page = p;
            item.draggable = true;
            item.innerHTML = `
                <div class="organize-thumb" style="width:${canvas.width}px;max-width:100%">
                    <canvas width="${canvas.width}" height="${canvas.height}"></canvas>
                    <button class="organize-del" onclick="organizeRemovePage(${p})" title="Sil">✕</button>
                </div>
                <div class="organize-page-num">Sayfa ${p}</div>
            `;
            item.querySelector('canvas').getContext('2d').drawImage(canvas, 0, 0);

            // Drag-and-drop events
            item.addEventListener('dragstart', organizeDragStart);
            item.addEventListener('dragover', organizeDragOver);
            item.addEventListener('drop', organizeDrop);
            item.addEventListener('dragend', organizeDragEnd);
            // Touch support
            item.addEventListener('touchstart', organizeTouchStart, { passive: false });
            item.addEventListener('touchmove', organizeTouchMove, { passive: false });
            item.addEventListener('touchend', organizeTouchEnd);

            grid.appendChild(item);
        }

        document.getElementById('organize-loading').style.display = 'none';
        grid.style.display = 'flex';
        document.getElementById('organize-hint').style.display = 'block';
        document.getElementById('processBtn-organize').disabled = false;

        // Hide the dropzone after file selected
        const dz = document.getElementById('dropzone-organize');
        if (dz) dz.style.display = 'none';
    } catch (err) {
        document.getElementById('organize-loading').style.display = 'none';
        showToast('❌ PDF yüklenemedi: ' + (err.message || err), 4000);
    }
}

// Override handleDrop for organize
function handleDrop(e, toolId) {
    e.preventDefault();
    handleDragLeave(toolId);
    const files = Array.from(e.dataTransfer.files);
    if (toolId === 'organize') { handleOrganizeFile(files); return; }
    handleFiles(files, toolId);
}

// Drag-and-drop reorder logic
let _orgDragSrc = null;

function organizeDragStart(e) {
    _orgDragSrc = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function organizeDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const items = [...document.querySelectorAll('.organize-item')];
    const target = this;
    if (target !== _orgDragSrc) {
        const srcIdx = items.indexOf(_orgDragSrc);
        const tgtIdx = items.indexOf(target);
        const grid = document.getElementById('organize-grid');
        if (srcIdx < tgtIdx) grid.insertBefore(_orgDragSrc, target.nextSibling);
        else grid.insertBefore(_orgDragSrc, target);
    }
}

function organizeDrop(e) {
    e.stopPropagation();
    organizeUpdateOrder();
}

function organizeDragEnd() {
    this.classList.remove('dragging');
    _orgDragSrc = null;
    organizeUpdateOrder();
}

// Touch drag support
let _touchDragItem = null, _touchClone = null;

function organizeTouchStart(e) {
    _touchDragItem = this;
    this.classList.add('dragging');
    e.preventDefault();
}

function organizeTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const target = el?.closest('.organize-item');
    if (target && target !== _touchDragItem) {
        const grid = document.getElementById('organize-grid');
        const items = [...grid.querySelectorAll('.organize-item')];
        const srcIdx = items.indexOf(_touchDragItem);
        const tgtIdx = items.indexOf(target);
        if (srcIdx < tgtIdx) grid.insertBefore(_touchDragItem, target.nextSibling);
        else grid.insertBefore(_touchDragItem, target);
    }
}

function organizeTouchEnd() {
    if (_touchDragItem) { _touchDragItem.classList.remove('dragging'); _touchDragItem = null; }
    organizeUpdateOrder();
}

function organizeUpdateOrder() {
    const items = document.querySelectorAll('.organize-item');
    _organizePageOrder = Array.from(items).map(el => parseInt(el.dataset.page));
    // Update labels
    items.forEach((el, i) => {
        const lbl = el.querySelector('.organize-page-num');
        if (lbl) lbl.textContent = `${i + 1}. Sıra (Orijinal Sayfa ${el.dataset.page})`;
    });
}

function organizeRemovePage(pageNum) {
    _organizePageOrder = _organizePageOrder.filter(p => p !== pageNum);
    const item = document.querySelector(`.organize-item[data-page="${pageNum}"]`);
    if (item) item.remove();
    organizeUpdateOrder();
    if (_organizePageOrder.length === 0) {
        document.getElementById('processBtn-organize').disabled = true;
    }
}

async function doOrganize(toolId) {
    if (!_organizePdfBytes) { showToast('Lütfen önce bir PDF seçin.'); return; }
    if (_organizePageOrder.length === 0) { showToast('Silinecek sayfalar kalmadı.'); return; }
    const { PDFDocument } = window.PDFLib;

    setProgressMsg(toolId, 'Sayfalar yeniden düzenleniyor…');
    await animateProgress(toolId, 10, 50, 600);

    const src = await PDFDocument.load(_organizePdfBytes, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    // Convert 1-based page numbers to 0-based indices
    const indices = _organizePageOrder.map(p => p - 1);
    const copiedPages = await newDoc.copyPages(src, indices);
    copiedPages.forEach(p => newDoc.addPage(p));

    setProgressMsg(toolId, 'Kaydediliyor…');
    await animateProgress(toolId, 50, 100, 500);
    const out = await newDoc.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    showResult(toolId, blob, 'duzenlenmis.pdf', `${_organizePageOrder.length} sayfa yeni sırayla kaydedildi`);
}

/* ======================== OCR TOOL ======================== */

async function doOCR(toolId, file) {
    if (!window.Tesseract) {
        showToast('⚠️ Tesseract.js yüklenmedi. İnternet bağlantınızı kontrol edin.', 5000);
        return;
    }
    if (!window.pdfjsLib) { showToast('PDF.js gerekli. Sayfayı yenileyin.'); return; }

    const langVal = document.querySelector('#ocrLang .selected')?.dataset.val || 'tur+eng';
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    let fullText = '';

    if (isPdf) {
        setProgressMsg(toolId, 'PDF okunuyor…');
        await animateProgress(toolId, 5, 15, 300);
        const bytes = await readFileAsArrayBuffer(file);
        const pdfDoc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
        const total = pdfDoc.numPages;

        for (let p = 1; p <= total; p++) {
            setProgressMsg(toolId, `Sayfa ${p}/${total} OCR işleniyor…`);
            const page = await pdfDoc.getPage(p);
            const vp = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(vp.width);
            canvas.height = Math.round(vp.height);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

            const result = await Tesseract.recognize(canvas, langVal, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const overall = 15 + ((p - 1) / total * 75) + (m.progress / total * 75);
                        const fill = document.getElementById(`progressFill-${toolId}`);
                        const pct = document.getElementById(`progressPct-${toolId}`);
                        if (fill) fill.style.width = Math.min(Math.round(overall), 95) + '%';
                        if (pct) pct.textContent = Math.min(Math.round(overall), 95) + '%';
                    }
                }
            });
            fullText += `--- Sayfa ${p} ---\n${result.data.text}\n\n`;
        }
    } else {
        // Image file
        setProgressMsg(toolId, 'Görüntü OCR işleniyor…');
        await animateProgress(toolId, 10, 20, 300);
        const result = await Tesseract.recognize(file, langVal, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const overall = 20 + m.progress * 70;
                    const fill = document.getElementById(`progressFill-${toolId}`);
                    const pct = document.getElementById(`progressPct-${toolId}`);
                    if (fill) fill.style.width = Math.round(overall) + '%';
                    if (pct) pct.textContent = Math.round(overall) + '%';
                }
            }
        });
        fullText = result.data.text;
    }

    setProgressMsg(toolId, 'Metin kaydediliyor…');
    await animateProgress(toolId, 95, 100, 400);
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    showResult(toolId, blob, 'ocr-metin.txt', `Metin tanıma tamamlandı · ${fullText.trim().length} karakter`);
}

/* ======================== SCROLL ANIMATIONS ======================== */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.tool-card, .feature-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});
