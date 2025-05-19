import i18next          from 'https://cdn.jsdelivr.net/npm/i18next@21.9.2/+esm';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@6.1.5/+esm';
import HttpBackend      from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@1.4.4/+esm';

function updateFlags(lang) {
    document.querySelectorAll('.flag').forEach(f => f.classList.remove('active'));
    document.getElementById(`lang-${lang}`)?.classList.add('active');
}

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
    const raw = Array.isArray(i18next.language) ? i18next.language[0] : i18next.language;
    const lang = (raw||'en').split('-')[0];
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
        backend: {
            loadPath: 'locales/{{lng}}/translation.json'
        }
    })
    .then(() => {
        updateContent();
    })
    .catch(err => console.error(err));

i18next.on('languageChanged', () => {
    updateContent();
});

window.addEventListener('hashchange', updateContent);
window.addEventListener('DOMContentLoaded', updateContent);

document.addEventListener('click', e => {
    const f = e.target.closest('.flag');
    if (!f) return;
    const [, lng] = f.id.split('-');
    if (lng === 'es' || lng === 'en') {
        i18next.changeLanguage(lng, () => {
            localStorage.setItem('i18nextLng', lng);
            updateContent();
        });
    }
});

window.updateContent = updateContent;
