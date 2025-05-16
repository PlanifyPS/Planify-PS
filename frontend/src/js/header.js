import { auth, db } from '../../../backend/utils/firebase_config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import {doc, getDoc, updateDoc, arrayUnion} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

export function initHeader() {
    const imgEl = document.getElementById('avatar-img');
    const notifBtn = document.getElementById('notification-toggle');
    const notifPanel = document.getElementById('notification-panel');
    const notifList = document.getElementById('notification-list');

    if (!imgEl) {
        console.warn('[header] #avatar-img not found – is the header HTML already injected?');
        return;
    }

    let userData = null;
    let userId = null;

    initStoreModal();


    onAuthStateChanged(auth, async user => {
        if (!user) {
            imgEl.style.display = 'none';
            return;
        }

        try {
            userId = user.uid;
            const userRef = doc(db, 'Users', user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                imgEl.style.display = 'none';
                return;
            }


            userData = userSnap.data();
            const avatarFile = userData.image || 'default-avatar';
            imgEl.src = `/frontend/public/assets/${avatarFile}.webp`;
            imgEl.style.display = 'block';

            const pointsElement = document.getElementById('points');
            if (pointsElement && userData.points !== undefined) {
                pointsElement.textContent = `${userData.points}pts`;
            }

            if (!userData.purchasedItems) {
                userData.purchasedItems = [];

                if (userData.image && userData.image !== 'default-avatar') {
                    await updateDoc(userRef, {
                        purchasedItems: arrayUnion(userData.image)
                    });

                    userData.purchasedItems.push(userData.image);
                }
            }


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

    const storeButton = document.querySelector('.header-button:nth-child(3)');
    if (storeButton) {
        storeButton.addEventListener('click', () => {
            openStoreModal(userData, userId);
        });
    }

}

function initStoreModal() {
    if (!document.getElementById('store-modal')) {
        const modalHTML = `
        <div id="store-modal" class="modal">
            <div class="modal-content-header">
                <div class="modal-main-header">
                    <h2>Store</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="store-balance">
                        <p>Your points: <span id="modal-points">0</span></p>
                    </div>
                    <div class="store-items">
                        <!-- FISH Avatars -->
                        <div class="store-item" data-item="avatar1-fish" data-price="500">
                            <img src="/frontend/public/assets/avatar1-fish.webp" alt="Avatar 1 Fish">
                            <p>Fisherman 1</p>
                            <p class="item-price">500<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
                        <div class="store-item" data-item="avatar2-fish" data-price="750">
                            <img src="/frontend/public/assets/avatar2-fish.webp" alt="Avatar 2 Fish">
                            <p>Fisherman 2</p>
                            <p class="item-price">750<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
                        <div class="store-item" data-item="avatar3-fish" data-price="800">
                            <img src="/frontend/public/assets/avatar3-fish.webp" alt="Avatar 3 Fish">
                            <p>Fisherman 3</p>
                            <p class="item-price">800<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
                        <div class="store-item" data-item="avatar4-fish" data-price="1500">
                            <img src="/frontend/public/assets/avatar4-fish.webp" alt="Avatar 4 Fish">
                            <p>Fisherman 4</p>
                            <p class="item-price">1500<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
    
                        <!-- CINEMA Avatars -->
                        <div class="store-item" data-item="avatar1-cinema" data-price="5000">
                            <img src="/frontend/public/assets/avatar1-cinema.webp" alt="Avatar 1 Cinema">
                            <p>Cinema 1</p>
                            <p class="item-price">5000<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
                        <div class="store-item" data-item="avatar2-cinema" data-price="1500">
                            <img src="/frontend/public/assets/avatar2-cinema.webp" alt="Avatar 2 Cinema">
                            <p>Cinema 2</p>
                            <p class="item-price">1500<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
                        <div class="store-item" data-item="avatar3-cinema" data-price="2000">
                            <img src="/frontend/public/assets/avatar3-cinema.webp" alt="Avatar 3 Cinema">
                            <p>Cinema 3</p>
                            <p class="item-price">2000<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
                        <div class="store-item" data-item="avatar4-cinema" data-price="2500">
                            <img src="/frontend/public/assets/avatar4-cinema.webp" alt="Avatar 4 Cinema">
                            <p>Cinema 4</p>
                            <p class="item-price">2500<i class="fa-regular fa-gem"></i></p>
                            <button class="buy-button">Buy</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;


        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        const closeButton = document.querySelector('.close-modal');
        closeButton.addEventListener('click', closeStoreModal);

        window.addEventListener('click', (event) => {
            const modal = document.getElementById('store-modal');
            if (event.target === modal) {
                closeStoreModal();
            }
        });
    }
}

function openStoreModal(userData, userId) {
    if (!userData) {
        console.warn('[store] No user data available');
        return;
    }

    const modal = document.getElementById('store-modal');
    if (!modal) return;

    const modalPoints = document.getElementById('modal-points');
    if (modalPoints) {
        modalPoints.textContent = userData.points || 0;
    }

    updateStoreButtons(userData, userId);

    modal.style.display = 'block';
}

function closeStoreModal() {
    const modal = document.getElementById('store-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function purchaseItem(itemName, itemPrice, userData, userId) {
    if (!userData || !userId) {
        console.warn('[store] No user data available for purchase');
        return;
    }

    const userPoints = userData.points || 0;

    if (userPoints < itemPrice) {
        alert('Not enough points to purchase this item!');
        return;
    }

    try {
        if (!userData.purchasedItems) {
            userData.purchasedItems = [];
        }

        const userRef = doc(db, 'Users', userId);
        await updateDoc(userRef, {
            points: userPoints - itemPrice,
            image: itemName,
            purchasedItems: arrayUnion(itemName)
        });

        userData.points = userPoints - itemPrice;
        userData.image = itemName;
        if (!userData.purchasedItems.includes(itemName)) {
            userData.purchasedItems.push(itemName);
        }

        const pointsElement = document.getElementById('points');
        if (pointsElement) {
            pointsElement.textContent = `${userData.points}pts`;
        }

        const modalPoints = document.getElementById('modal-points');
        if (modalPoints) {
            modalPoints.textContent = userData.points;
        }

        const imgEl = document.getElementById('avatar-img');
        if (imgEl) {
            imgEl.src = `/frontend/public/assets/${itemName}.webp`;
        }

        updateStoreButtons(userData, userId);
        alert('Purchase successful!');
    } catch (err) {
        console.error('[store] Error purchasing item:', err);
        alert('Failed to complete purchase. Please try again.');
    }
}

async function equipItem(itemName, userData, userId) {
    if (!userData || !userId) {
        console.warn('[store] No user data available for equipping');
        return;
    }

    try {
        const userRef = doc(db, 'Users', userId);
        await updateDoc(userRef, {
            image: itemName
        });

        userData.image = itemName;

        const imgEl = document.getElementById('avatar-img');
        if (imgEl) {
            imgEl.src = `/frontend/public/assets/${itemName}.webp`;
        }

        updateStoreButtons(userData, userId);

        alert('Avatar equipped!');
    } catch (err) {
        console.error('[store] Error equipping item:', err);
        alert('Failed to equip avatar. Please try again.');
    }
}

function updateStoreButtons(userData, userId) {
    if (!userData) return;

    const storeItems = document.querySelectorAll('.store-item');
    storeItems.forEach(item => {
        const itemName = item.dataset.item;
        const itemPrice = parseInt(item.dataset.price);
        const button = item.querySelector('button');

        const newButton = document.createElement('button');
        if (button) {
            button.parentNode.replaceChild(newButton, button);
        }

        newButton.classList.remove('buy-button', 'equip-button', 'equipped-button');

        const isOwned = userData.purchasedItems && userData.purchasedItems.includes(itemName);

        if (isOwned) {
            if (userData.image === itemName) {
                newButton.textContent = 'Equipped';
                newButton.disabled = true;
                newButton.classList.add('equipped-button');
            } else {
                newButton.textContent = 'Equip';
                newButton.disabled = false;
                newButton.classList.add('equip-button');
                newButton.addEventListener('click', () => {
                    equipItem(itemName, userData, userId);
                });
            }
        } else {
            newButton.textContent = 'Buy';
            newButton.classList.add('buy-button');
            newButton.addEventListener('click', () => {
                purchaseItem(itemName, itemPrice, userData, userId);
            });
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasksExpiring = pendingTasks.filter(pendingTask => {
            const taskDueDate = new Date(pendingTask.dueDate);
            taskDueDate.setHours(0, 0, 0, 0);
            const diffDays = (taskDueDate - today) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 2;
        });


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