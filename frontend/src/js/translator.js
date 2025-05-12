import i18next        from 'https://cdn.jsdelivr.net/npm/i18next@21.9.2/+esm';
import LanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@6.1.5/+esm';
import HttpBackend      from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@1.4.4/+esm';

i18next
    .use(HttpBackend)
    .use(LanguageDetector)
    .init({
        fallbackLng: 'en',
        debug: true,
        backend: {
            loadPath: 'locales/{{lng}}/translation.json'
        }
    });

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = i18next.t(key);
    });
}

i18next.on('initialized', () => {
    console.log('i18next listo, idioma:', i18next.language);
    updateContent();
});
i18next.on('languageChanged', lng => {
    console.log('i18next cambió a:', lng);
    updateContent();
});

window.addEventListener('hashchange', () => {
    updateContent();
});

document.getElementById('lang-es').onclick = () => i18next.changeLanguage('es');
document.getElementById('lang-en').onclick = () => i18next.changeLanguage('en');
