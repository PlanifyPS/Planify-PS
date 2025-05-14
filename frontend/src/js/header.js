import { auth, db } from '../../../backend/utils/firebase_config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import { doc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

export function initHeader() {
    const imgEl = document.getElementById('avatar-img');
    const notifBtn = document.getElementById('notification-toggle');
    const notifPanel = document.getElementById('notification-panel');
    const notifList = document.getElementById('notification-list');

    if (!imgEl) {
        console.warn('[header] #avatar-img not found – is the header HTML already injected?');
        return;
    }

    onAuthStateChanged(auth, async user => {
        if (!user) {
            imgEl.style.display = 'none';
            return;
        }

        try {
            const userRef  = doc(db, 'Users', user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                imgEl.style.display = 'none';
                return;
            }

            const data        = userSnap.data();
            const avatarFile  = data.image || 'default-avatar';
            imgEl.src         = `/frontend/public/assets/${avatarFile}.webp`;
            imgEl.style.display = 'block';

            if (notifBtn && notifPanel && notifList) {
                notifBtn.addEventListener('click', async () => {
                    notifPanel.classList.toggle('show');
                    await loadNotifications(user.uid);
                });
            }

        } catch (err) {
            console.error('[header] error loading avatar:', err);
            imgEl.style.display = 'none';
        }
    });
}

async function loadNotifications(uid) {
    const notifList = document.getElementById('notification-list');
    if (!notifList) return;
    notifList.innerHTML = "";

    try {
        const userDocRef = doc(db, 'Users', uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        //Habits
        const habits = userData.habits || {};
        const pendingHabits = Object.values(habits).filter(habit => habit.completed === false);

        if (pendingHabits.length === 0) {
            notifList.innerHTML += `<li>There are no pending habits.</li>`;
        } else if (pendingHabits.length === 1) {
            notifList.innerHTML += `<li>There is 1 pending habit.</li>`;
        } else {
            notifList.innerHTML += `<li>There are ${pendingHabits.length} pending habits.</li>`;
        }

        //Tasks
        const tasks = userData.tasks || {};
        const pendingTasks = Object.values(tasks).filter(task => task.completed === false);

        const tasksExpiring = pendingTasks; // esto es temporal, esto debería ser lo que está comentado abajo
        /*
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const tasksExpiring = pendingTasks.filter(pendingTask => {
            const taskDueDate = pendingTask.dueDate;
            const diffDays = (taskDueDate - today) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 1;
        });
        */

        if (tasksExpiring.length === 0) {
            notifList.innerHTML += `<li>There are no pending tasks.</li>`;
        } else if (tasksExpiring.length === 1) {
            notifList.innerHTML += `<li>There is 1 pending task.</li>`;
        } else {
            notifList.innerHTML += `<li>There are ${tasksExpiring.length} pending tasks.</li>`;
        }

    } catch (err) {
        console.error("Loading notifications error:", err);
        notifList.innerHTML = `<li>Error when loading notifications.</li>`;
    }
}

window.initHeader = initHeader;