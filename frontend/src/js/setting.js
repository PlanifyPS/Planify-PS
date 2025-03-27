export function initSettings() {
    if (document.readyState === 'complete') {
        loadSettings();
    } else {
        document.addEventListener('DOMContentLoaded', loadSettings);
    }
}

function loadSettings() {
    setupTabs();
    setupDarkMode();
    setupNotifications();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return;

    showTab('settings');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

function showTab(tab) {
    const settingsContent = document.getElementById('settings');
    const profileContent = document.getElementById('profile');
    const indicator = document.querySelector('.indicator');

    if (!settingsContent || !profileContent || !indicator) return;

    settingsContent.style.display = tab === 'settings' ? 'block' : 'none';
    profileContent.style.display = tab === 'profile' ? 'block' : 'none';

    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');

    indicator.style.transform = tab === 'settings' ? 'translateX(0%)' : 'translateX(100%)';
}

function setupDarkMode() {
    const modeToggle = document.getElementById('mode-toggle');
    if (!modeToggle) return;

    // Cargar preferencia guardada o usar preferencia del sistema
    const savedMode = localStorage.getItem('darkMode') === 'true';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = savedMode ?? systemPrefersDark;

    modeToggle.checked = initialMode;
    document.body.classList.toggle('dark-mode', initialMode);

    modeToggle.addEventListener('change', () => {
        const isDarkMode = modeToggle.checked;
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode);
    });
}

function setupNotifications() {
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (!notificationsToggle) return;

    const notificationsEnabled = localStorage.getItem('notifications') === 'true';
    notificationsToggle.checked = notificationsEnabled;

    notificationsToggle.addEventListener('change', function() {
        localStorage.setItem('notifications', this.checked);
        alert(this.checked ? "Notifications Enabled" : "Notifications Disabled");
    });
}

initSettings();