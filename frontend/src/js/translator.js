import i18next          from 'https://cdn.jsdelivr.net/npm/i18next@21.9.2/+esm';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@6.1.5/+esm';
import HttpBackend      from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@1.4.4/+esm';

function updateFlags(lang) {
    document.querySelectorAll('.flag').forEach(f => f.classList.remove('active'));
    const btn = document.getElementById(`lang-${lang}`);
    if (btn) btn.classList.add('active');
}

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
    let raw = i18next.language;
    if (Array.isArray(raw)) raw = raw[0];
    if (typeof raw !== 'string') raw = i18next.options.fallbackLng || 'en';
    const lang = raw.split('-')[0];
    updateFlags(lang);
}

i18next
    .use(HttpBackend)
    .use(LanguageDetector)
    .init({
        fallbackLng: 'en',
        detection: {
            order: ['localStorage','navigator'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage']
        },
        backend: { loadPath: 'locales/{{lng}}/translation.json' }
    })
    .then(updateContent)
    .catch(err => console.error('i18next init failed:', err));

i18next.on('languageChanged', (lng) => {
    const raw = Array.isArray(lng) ? lng[0] : lng;
    updateContent();
    updateFlags(raw.split('-')[0]);
});

window.addEventListener('hashchange', updateContent);
window.addEventListener('DOMContentLoaded', updateContent);

document.addEventListener('click', e => {
    const f = e.target.closest('.flag');
    if (!f) return;
    const [, lng] = f.id.split('-');
    if (lng === 'es' || lng === 'en') {
        i18next.changeLanguage(lng);
    }
});

['app','main-header'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        new MutationObserver(updateContent)
            .observe(el, { childList: true, subtree: true });
    }
});
