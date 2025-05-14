import {handleLogout} from "../../../backend/utils/auth_utils.js";

export function initSidebar() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

window.initSidebar = initSidebar;
