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
        document.addEventListener('DOMContentLoaded', loadChallenges);
    }
}

async function fetchChallengesFromFirebase() {
    const challengesRef = collection(db, "Challenges");
    const snapshot = await getDocs(challengesRef);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

async function loadChallenges() {
    try {
        const container = document.getElementById('cards-container');
        if (container) container.innerHTML = '<p>Loading Challenges...</p>';

        challengesData = await fetchChallengesFromFirebase();
        await markCompletedChallenges();

        challengesData.forEach(challenge => {
            if (challenge.pinned === undefined) challenge.pinned = false;
            if (challenge.accepted === undefined) challenge.accepted = false;
            if (challenge.completed === undefined) challenge.completed = false;
        });

        renderChallenges(challengesData);
        setupCardClickListeners();
        setupFilterEvents();
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading challenges');
    }
}

function setupFilterEvents() {
    const searchInput = document.getElementById('search-challenges');
    const statusFilter = document.getElementById('filter-challenges');
    const levelFilter = document.getElementById('filter-level');

    if (searchInput) {
        searchInput.addEventListener('input', filterChallenges);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterChallenges);
    }
    if (levelFilter) {
        levelFilter.addEventListener('change', filterChallenges);
    }
}

function filterChallenges() {
    const searchTerm = document.getElementById('search-challenges').value.toLowerCase();
    const statusFilter = document.getElementById('filter-challenges').value;
    const levelFilter = document.getElementById('filter-level').value;

    const filtered = challengesData.filter(challenge => {
        const matchesSearch = challenge.name.toLowerCase().includes(searchTerm);

        let matchesStatus = true;
        if (statusFilter === 'completed') {
            matchesStatus = challenge.completed === true;
        } else if (statusFilter === 'pending') {
            matchesStatus = !challenge.completed && !challenge.accepted;
        } else if (statusFilter === 'in-progress') {
            matchesStatus = challenge.accepted && !challenge.completed;
        }

        let matchesLevel = true;
        if (levelFilter !== 'all') {
            matchesLevel = challenge.level.toLowerCase() === levelFilter;
        }

        return matchesSearch && matchesStatus && matchesLevel;
    });

    renderChallenges(filtered);
}

function renderChallenges(challenges) {
    const container = document.getElementById('cards-container');
    if (!container) return;

    if (!challenges || challenges.length === 0) {
        container.innerHTML = '<p>No challenges available</p>';
        return;
    }

    const sortedChallenges = [...challenges].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });

    container.innerHTML = sortedChallenges.map(challenge => `
        <article class="card ${challenge.pinned ? 'pinned' : ''}" data-id="${challenge.id}">
            <div class="card-header">
                <h2>${challenge.name}</h2>
                <span class="tag ${challenge.level.toLowerCase()}">${challenge.level}</span>
                <button class="pin-challenge" data-id="${challenge.id}">
                    <i class="fas fa-thumbtack ${challenge.pinned ? 'active' : ''}"></i>
                </button>
                <button class="delete-challenge" data-id="${challenge.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p>${challenge.shortDescription}</p>
            <div class="card-footer">
                <span class="points">${challenge.points} pts</span>
                <span class="duration"><i class="far fa-clock"></i> ${challenge.duration} days</span>
            </div>
        </article>
    `).join('');

    setupCardClickListeners();
    setupDeleteButtons();
    setupPinButtons();
}

function togglePinChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    challenge.pinned = !challenge.pinned;

    filterChallenges();
}

function setupPinButtons() {
    const pinButtons = document.querySelectorAll('.pin-challenge');
    pinButtons.forEach(button => {
        button.removeEventListener('click', button.clickHandler);

        button.clickHandler = (e) => {
            e.stopPropagation();
            const challengeId = button.getAttribute('data-id');
            togglePinChallenge(challengeId);
        };

        button.addEventListener('click', button.clickHandler);
    });
}

function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-challenge');
    deleteButtons.forEach(button => {
        button.removeEventListener('click', button.clickHandler);

        button.clickHandler = (e) => {
            e.stopPropagation();
            const challengeId = button.getAttribute('data-id');
            removeChallengeFromView(challengeId);
        };

        button.addEventListener('click', button.clickHandler);
    });
}

function removeChallengeFromView(challengeId) {
    const card = document.querySelector(`.card[data-id="${challengeId}"]`);
    if (card) {
        card.remove();
    }

    const detailContainer = document.getElementById('challenge-detail');
    if (detailContainer) {
        const currentDetailId = detailContainer.querySelector('.detail-content')?.dataset?.id;
        if (currentDetailId === challengeId) {
            detailContainer.innerHTML = `
                <div class="empty-detail">
                    <i class="fas fa-flag"></i>
                    <h2>Select a challenge</h2>
                    <p>Click on any challenge to view its details</p>
                </div>
            `;
        }
    }
}

function setupCardClickListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.removeEventListener('click', card.clickHandler);

        card.clickHandler = (e) => {
            if (!e.target.closest('.delete-challenge') && !e.target.closest('.pin-challenge')) {
                const challengeId = card.getAttribute('data-id');
                showChallengeDetails(challengeId);
            }
        };

        card.addEventListener('click', card.clickHandler);
    });
}

function showChallengeDetails(challengeId) {
    const challenge = challengesData.find(c => c.id == challengeId);
    const detailContainer = document.getElementById('challenge-detail');

    if (!challenge || !detailContainer) return;

    detailContainer.innerHTML = `
        <div class="detail-content">
            <div class="detail-header">
                <h2>${challenge.name}</h2>
                <div class="challenge-meta">
                    <span class="tag ${challenge.level.toLowerCase()}">${challenge.level}</span>
                    <span class="points">${challenge.points} pts</span>
                    <span class="duration"><i class="far fa-clock"></i> ${challenge.duration} days</span>
                    ${challenge.category ? `<span class="category"><i class="fas fa-tag"></i> ${challenge.category}</span>` : ''}
                </div>
            </div>
            <div class="detail-body">
                <div class="description-section">
                    <h3>Description</h3>
                    <p>${challenge.description}</p>
                </div>

                ${challenge.details ? `
                <div class="details-section">
                    <h3>Details</h3>
                    <div class="challenge-details">${challenge.details}</div>
                </div>
                ` : ''}

                ${Array.isArray(challenge.tips) && challenge.tips.length > 0 ? `
                    <div class="tips-section">
                        <h3><i class="fas fa-lightbulb"></i> Tips to Complete</h3>
                            <ul class="tips-list">
                                ${challenge.tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                    </div>
                ` : ''}

                <div class="actions-section">
                    ${!challenge.accepted && !challenge.completed ? `
                        <button class="btn accept-challenge">
                            <i class="fas fa-check-circle"></i> Accept Challenge
                        </button>
                    ` : ''}
                    
                    ${challenge.accepted && !challenge.completed ? `
                        <button class="btn complete-challenge">
                            <i class="fas fa-flag-checkered"></i> Mark as completed
                        </button>
                    ` : ''}
                    
                    ${challenge.completed ? '<span class="completed-badge">Completed</span>' : ''}
                </div>
            </div>
            <button id="share-btn" class="btn share-btn">
                <i class="fas fa-share-alt"></i> Share Medal
            </button>
        </div>
    `;

    const acceptBtn = detailContainer.querySelector('.accept-challenge');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            acceptChallenge(challengeId);
        });
    }

    const completeBtn = detailContainer.querySelector('.complete-challenge');
    if (completeBtn) {
        completeBtn.addEventListener('click', () => {
            completeChallenge(challengeId);
        });
    }

    const shareBtn    = detailContainer.querySelector('#share-btn');
    if (shareBtn) shareBtn.onclick = ()=> openShareDialog();
}

function acceptChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    challenge.accepted = true;
    challenge.acceptedDate = new Date().toISOString();

    showChallengeDetails(challengeId);
    filterChallenges();

    console.log(`Challenge "${challenge.name}" accepted`);
}

async function completeChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    try {
        const user = getAuth().currentUser;
        if (!user) throw new Error("User not authenticated");

        const userRef = doc(db, "Users", user.uid, "CompletedChallenges", challengeId);

        await setDoc(userRef, {
            completed: true,
            completedAt: new Date()
        });

        challenge.completed = true;
        challenge.completedDate = new Date().toISOString();

        addPointsToFirebase(challenge.points);
        addToStreak();
        showChallengeDetails(challengeId);
        filterChallenges();

        console.log(`Challenge "${challenge.name}" completed and registered. Points added: ${challenge.points}`);
    } catch (error) {
        console.error("Error registering completed challenge:", error);
    }
}

async function addPointsToFirebase(pointsToAdd) {
    try {
        const user = getAuth().currentUser;
        if (!user) throw new Error("User not authenticated");

        const userRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                points: pointsToAdd,
                streak: 0,
                lastTaskDate: new Date().toDateString()
            });
        } else {
            await updateDoc(userRef, {
                points: increment(pointsToAdd)
            });
        }

        const updatedSnap = await getDoc(userRef);
        const updatedPoints = updatedSnap.data().points;

        console.log(`Points updated: ${updatedPoints}`);

        const pointsUpdatedEvent = new CustomEvent("pointsUpdated", {
            detail: { points: updatedPoints }
        });
        document.dispatchEvent(pointsUpdatedEvent);
    } catch (error) {
        console.error("Error updating points:", error);
    }
}

async function addToStreak() {
    try {
        const today = new Date().toDateString();
        const user = getAuth().currentUser;
        if (!user) throw new Error("User not authenticated");

        const userRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();

        const lastDate = data.lastTaskDate;
        let newStreak = data.streak || 0;

        if (lastDate !== today) {
            newStreak++;
            await updateDoc(userRef, {
                streak: newStreak,
                lastTaskDate: today
            });

            const streakUpdatedEvent = new CustomEvent("streakUpdated");
            document.dispatchEvent(streakUpdatedEvent);
        }
    } catch (error) {
        console.error("Error updating streak:", error);
    }
}

function showError(message) {
    const container = document.getElementById('cards-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }
}

async function markCompletedChallenges() {
    try {
        const user = getAuth().currentUser;
        if (!user) return;

        const completedRef = collection(db, "Users", user.uid, "CompletedChallenges");
        const snapshot = await getDocs(completedRef);
        const completedIds = snapshot.docs.map(doc => doc.id);

        challengesData.forEach(challenge => {
            if (completedIds.includes(challenge.id)) {
                challenge.completed = true;
            }
        });
    } catch (error) {
        console.error("Error marking completed challenges:", error);
    }
}

window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('challenges')) {
        initChallenges();
    }
});

function openShareDialog() {
    const dialog = document.getElementById('share-dialog');
    const img   = document.getElementById('share-image');
    const medal = document.querySelector('#challenge-detail .medal-img')?.src || 'assets/medal.png';
    img.src = medal;
    dialog.showModal();
    dialog.style.display = 'block';
}
document.getElementById('share-dialog')?.addEventListener('click', e => {
    const btn      = e.target.closest('[data-platform]');
    const dialog   = document.getElementById('share-dialog');
    if (!btn) return;
    const text     = encodeURIComponent("I just earned this medal!");
    const url      = encodeURIComponent(document.getElementById('share-image').src);
    let shareUrl = '';
    switch(btn.dataset.platform) {
        case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
        case 'twitter':  shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
        case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
        case 'copy':     navigator.clipboard.writeText(document.getElementById('share-image').src); alert('Link copied'); return;
    }
    window.open(shareUrl,'_blank');
});

document.getElementById('share-dialog')?.addEventListener('close', () => {
    document.getElementById('share-dialog').close();
    document.getElementById('share-dialog').style.display = 'none';

});

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('challenges')) {
        import('./shareMedal.js').then(m => m.initShareModal());
    }
});

initChallenges();
