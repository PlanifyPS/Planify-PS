import {auth, db} from '../../../backend/utils/firebase_config.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import {doc, getDoc} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

export function initHeader() {
    const imgEl = document.getElementById('avatar-img');
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
        } catch (err) {
            console.error('[header] error loading avatar:', err);
            imgEl.style.display = 'none';
        }
    });
}

window.initHeader = initHeader;