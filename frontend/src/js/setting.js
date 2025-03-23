function showTab(tab) {
    document.getElementById('settings').style.display = tab === 'settings' ? 'block' : 'none';
    document.getElementById('profile').style.display = tab === 'profile' ? 'block' : 'none';

    let tabs = document.querySelectorAll('.tab');
    tabs.forEach(el => el.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tab}')"]`).classList.add('active');

    let indicator = document.querySelector('.indicator');
    indicator.style.transform = tab === 'settings' ? 'translateX(0%)' : 'translateX(100%)';
}

function toggleMode() {
    const isDarkMode = document.getElementById('mode-toggle').checked;
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const notificationsToggle = document.getElementById("notifications-toggle");

    notificationsToggle.addEventListener("change", function () {
        localStorage.setItem("notifications", notificationsToggle.checked);
        alert(notificationsToggle.checked ? "Notifications Enabled" : "Notifications Disabled");
    });

    if (localStorage.getItem("notifications") === "true") {
        notificationsToggle.checked = true;
    }
});





