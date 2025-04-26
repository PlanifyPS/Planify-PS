import { auth, db } from '../../../backend/utils/firebase_config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

let user = {};
export function initHeader() {
    if (document.readyState === 'complete') {
        onAuthStateChanged(auth, async user => {
            const imgEl = document.getElementById('avatar-img');
            if (!imgEl) return;

            if (user) {
                try {
                    const userRef = doc(db, 'Users', user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        const avatarFile = data.image || 'default-avatar.png';
                        imgEl.src = `/frontend/public/assets/${avatarFile}.webp`;
                        imgEl.style.display = 'block';
                    } else {
                        throw new Error('User doc not found');
                    }
                } catch (err) {
                    console.error('Error loading avatar:', err);
                }
            } else {
                imgEl.style.display = 'none';
            }
        });
    } else {
        document.addEventListener('DOMContentLoaded', initHeader);
    }
}

initHeader();
