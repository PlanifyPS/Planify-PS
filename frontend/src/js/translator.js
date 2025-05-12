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
        backend: { loadPath: 'locales/{{lng}}/translation.json' }
    })
    .then(() => {
        let lang = i18next.language.split('-')[0];
        if (lang !== 'es' && lang !== 'en') lang = 'en';
        return new Promise(res => i18next.changeLanguage(lang, () => res(lang)));
    })
    .then(lang => {
        updateContent();
        updateFlags(lang);
    })
    .catch(err => console.error('i18next init failed:', err));

i18next.on('languageChanged', lng => {
    updateContent();
    updateFlags(lng);
});

window.addEventListener('hashchange', updateContent);

document.addEventListener('click', e => {
    const f = e.target.closest('.flag');
    if (!f) return;
    const [, lng] = f.id.split('-');
    if (lng === 'es' || lng === 'en') {
        i18next.changeLanguage(lng);
    }
});