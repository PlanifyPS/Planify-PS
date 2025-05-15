import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    increment,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { app } from "../../../backend/utils/firebase_config.js";

const db = getFirestore(app);
let challengesData = [];

export function initChallenges() {
    if (document.readyState === 'complete') {
        loadChallenges();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            loadChallenges();
        });
    }
}

async function fetchChallengesFromFirebase() {
    const snaps = await getDocs(collection(db, "Challenges"));
    return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadChallenges() {
    const ctr = document.getElementById('cards-container');
    if (ctr) ctr.innerHTML = '<p>Loading Challenges...</p>';
    challengesData = await fetchChallengesFromFirebase();
    await markCompletedChallenges();
    challengesData.forEach(c => {
        c.pinned    ??= false;
        c.accepted  ??= false;
        c.completed ??= false;
    });
    renderChallenges(challengesData);
    setupFilterEvents();
    setupCardClickListeners();
}

function setupFilterEvents() {
    document.getElementById('search-challenges').addEventListener('input', filterChallenges);
    document.getElementById('filter-challenges').addEventListener('change', filterChallenges);
    document.getElementById('filter-level').addEventListener('change', filterChallenges);
}

function filterChallenges() {
    const s = document.getElementById('search-challenges').value.toLowerCase();
    const status = document.getElementById('filter-challenges').value;
    const lvl    = document.getElementById('filter-level').value;
    const filtered = challengesData.filter(c => {
        if (!c.name.toLowerCase().includes(s)) return false;
        if (status === 'completed'   && !c.completed) return false;
        if (status === 'pending'     && (c.completed||c.accepted)) return false;
        if (status === 'in-progress' && !(c.accepted&&!c.completed)) return false;
        if (lvl !== 'all' && c.level.toLowerCase() !== lvl) return false;
        return true;
    });
    renderChallenges(filtered);
    setupCardClickListeners();
}

function renderChallenges(list) {
    const ctr = document.getElementById('cards-container');
    if (!ctr) return;
    if (!list.length) {
        ctr.innerHTML = '<p>No challenges available</p>';
        return;
    }
    const sorted = [...list].sort((a,b) => b.pinned - a.pinned);
    ctr.innerHTML = sorted.map(c => `
    <article class="card${c.pinned?' pinned':''}" data-id="${c.id}">
      <div class="card-header">
        <h2>${c.name}</h2>
        <span class="tag ${c.level.toLowerCase()}">${c.level}</span>
        <button class="pin-challenge" data-id="${c.id}">
          <i class="fas fa-thumbtack${c.pinned?' active':''}"></i>
        </button>
        <button class="delete-challenge" data-id="${c.id}">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <p>${c.shortDescription}</p>
      <div class="card-footer">
        <span class="points">${c.points} pts</span>
        <span class="duration"><i class="far fa-clock"></i> ${c.duration} days</span>
      </div>
    </article>
  `).join('');
    setupPinButtons();
    setupDeleteButtons();
}

function setupCardClickListeners() {
    document.querySelectorAll('.card').forEach(card => {
        card.onclick = e => {
            if (e.target.closest('.pin-challenge') || e.target.closest('.delete-challenge')) return;
            showChallengeDetails(card.dataset.id);
        };
    });
}

function setupPinButtons() {
    document.querySelectorAll('.pin-challenge').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            const c = challengesData.find(x => x.id === btn.dataset.id);
            c.pinned = !c.pinned;
            filterChallenges();
        };
    });
}

function setupDeleteButtons() {
    document.querySelectorAll('.delete-challenge').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            document.querySelector(`.card[data-id="${btn.dataset.id}"]`)?.remove();
        };
    });
}

function showChallengeDetails(id) {
    const c = challengesData.find(x => x.id === id);
    const d = document.getElementById('challenge-detail');
    if (!c || !d) return;
    d.innerHTML = `
    <div class="detail-content" data-id="${c.id}">
      <div class="detail-header">
        <h2>${c.name}</h2>
        <div class="challenge-meta">
          <span class="tag ${c.level.toLowerCase()}">${c.level}</span>
          <span class="points">${c.points} pts</span>
          <span class="duration"><i class="far fa-clock"></i> ${c.duration} days</span>
          ${c.category?`<span class="category"><i class="fas fa-tag"></i> ${c.category}</span>`:''}
        </div>
      </div>
      <div class="detail-body">
        <div class="description-section">
          <h3>Description</h3>
          <p>${c.description}</p>
        </div>
        ${c.details?`
        <div class="details-section">
          <h3>Details</h3>
          <div class="challenge-details">${c.details}</div>
        </div>`:``}
        ${c.tips?.length?`
        <div class="tips-section">
          <h3><i class="fas fa-lightbulb"></i> Tips</h3>
          <ul class="tips-list">
            ${c.tips.map(t=>`<li>${t}</li>`).join('')}
          </ul>
        </div>`:``}
        <div class="actions-section">
          ${!c.accepted&&!c.completed?`<button class="btn accept-challenge"><i class="fas fa-check-circle"></i> Accept</button>`:``}
          ${c.accepted&&!c.completed?`<button class="btn complete-challenge"><i class="fas fa-flag-checkered"></i> Complete</button>`:``}
          ${c.completed?`<span class="completed-badge">Completed</span>`:``}
        </div>
      </div>
      <!-- el botón de compartir ha sido eliminado -->
    </div>`;
    d.querySelector('.accept-challenge')?.addEventListener('click',()=>{
        c.accepted = true; showChallengeDetails(id); filterChallenges();
    });
    d.querySelector('.complete-challenge')?.addEventListener('click',()=>completeChallenge(c));
}

async function completeChallenge(c) {
    const u = getAuth().currentUser; if (!u) return;
    await setDoc(doc(db,"Users",u.uid,"CompletedChallenges",c.id),{ completed:true, completedAt:new Date() });
    c.completed = true;
    addPoints(c.points);
    showChallengeDetails(c.id);
    filterChallenges();
    // al completar, abrimos automáticamente el diálogo de compartir
    openShareDialog();
}

async function addPoints(n) {
    const u = getAuth().currentUser; if (!u) return;
    const uRef = doc(db,"Users",u.uid);
    await updateDoc(uRef,{ points: increment(n) });
    const snap = await getDoc(uRef);
    document.dispatchEvent(new CustomEvent("pointsUpdated",{ detail:{points:snap.data().points} }));
}

async function markCompletedChallenges() {
    const u = getAuth().currentUser; if (!u) return;
    const snap = await getDocs(collection(db,"Users",u.uid,"CompletedChallenges"));
    const done = snap.docs.map(d=>d.id);
    challengesData.forEach(c=>{ if(done.includes(c.id)) c.completed=true; });
}

async function openShareDialog() {
    const dlg = document.getElementById('share-dialog');
    const img = dlg.querySelector('#share-image');
    img.src = 'https://cdn.jsdelivr.net/gh/PlanifyPS/Planify-PS@sprint2/frontend/public/assets/medal.png';
    dlg.showModal();

    const btns = dlg.querySelectorAll('.do-share');
    if (!btns.length) return console.error('Share button not found');

    btns.forEach(btn => {
        btn.addEventListener('click', async e => {
            const platform = btn.dataset.platform;
            // URL fija de tu app en localhost
            const url = 'http://localhost:63342/Planify-PS/frontend/public/index.html';
            const text = encodeURIComponent("I´m in Planify!! I just earned this medal!. Do you want to join too? 🏅\n");

            if (navigator.canShare && navigator.canShare({ files: [] })) {
                try {
                    const resp = await fetch(img.src);
                    const blob = await resp.blob();
                    const file = new File([blob], 'medal.png', { type: blob.type });
                    await navigator.share({ title: 'My Medal', text, url, files: [file] });
                } catch {
                    console.error('Could not recognize share info');
                }
            } else {
                let shareUrl = '';
                switch (platform) {
                    case 'whatsapp':
                        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(url)}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
                        break;
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                        break;
                    case 'copy':
                        navigator.clipboard.writeText(url)
                            .then(() => alert('Link copied to clipboard!'))
                            .catch(() => alert('Copy failed'));
                        return;
                }
                window.open(shareUrl, '_blank');
            }
        });
    });
}

window.addEventListener('hashchange',()=>{
    if (location.hash.includes('challenges')) initChallenges();
});
window.addEventListener('DOMContentLoaded',()=>{
    if (document.getElementById('challenges')) initChallenges();
});

initChallenges();