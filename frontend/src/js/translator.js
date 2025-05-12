import i18next         from 'https://cdn.jsdelivr.net/npm/i18next@21.9.2/+esm';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@6.1.5/+esm';
import HttpBackend      from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@1.4.4/+esm';

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
}

function updateFlags(lang) {
    document.querySelectorAll('.flag').forEach(f => f.classList.remove('active'));
    const btn = document.getElementById(`lang-${lang}`);
    if (btn) btn.classList.add('active');
}

i18next
    .use(HttpBackend)
    .use(LanguageDetector)
    .init({
        fallbackLng: 'en',
        debug: true,
        detection: {
            order: ['localStorage','navigator'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage']
        },
        backend: {
            loadPath: 'locales/{{lng}}/translation.json'
        }
    })
    .then(() => {
        const lang = i18next.language.split('-')[0];
        updateContent();
        updateFlags(lang);
    })
    .catch(err => console.error('i18next init failed:', err));

i18next.on('languageChanged', lng => {
    const lang = lng.split('-')[0];
    updateContent();
    updateFlags(lang);
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

const appEl = document.getElementById('app');
if (appEl) {
    new MutationObserver(() => updateContent())
        .observe(appEl, { childList: true, subtree: true });
}
