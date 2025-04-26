const JSON_PATH = '../../frontend/src/json/challenges.json';
let challengesData = [];

export function initChallenges() {
    if (document.readyState === 'complete') {
        loadChallenges();
    } else {
        document.addEventListener('DOMContentLoaded', loadChallenges);
    }
}

async function loadChallenges() {
    try {
        const container = document.getElementById('cards-container');
        if (container) container.innerHTML = '<p>Loading challenges...</p>';

        const response = await fetch(JSON_PATH);
        if (!response.ok) throw new Error('Failed to load challenges');

        challengesData = await response.json();
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
                    <p>Click on any challenge to see its details</p>
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
            <div class="progress-section">
                <h3>Progress</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${challenge.completed ? 100 : challenge.accepted ? 50 : 0}%"></div>
                </div>
            </div>

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

                ${challenge.tips && challenge.tips.length > 0 ? `
                <div class="tips-section">
                    <h3><i class="fas fa-lightbulb"></i> Tips to complete it</h3>
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
                            <i class="fas fa-flag-checkered"></i> Mark as Completed
                        </button>
                    ` : ''}

                    ${challenge.completed ? '<span class="completed-badge">Completed</span>' : ''}
                </div>
            </div>
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
}

function acceptChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    challenge.accepted = true;
    challenge.acceptedDate = new Date().toISOString();

    let acceptedChallenges = JSON.parse(localStorage.getItem('acceptedChallenges') || '[]');
    if (!acceptedChallenges.includes(challengeId)) {
        acceptedChallenges.push(challengeId);
        localStorage.setItem('acceptedChallenges', JSON.stringify(acceptedChallenges));
    }

    showChallengeDetails(challengeId);
    filterChallenges();

    console.log(`Challenge "${challenge.name}" accepted`);
}

function completeChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    challenge.completed = true;
    challenge.completedDate = new Date().toISOString();

    addPointsToLocalStorage(challenge.points);
    addToStreak();
    showChallengeDetails(challengeId);
    filterChallenges();

    console.log(`Challenge "${challenge.name}" completed. Points added: ${challenge.points}`);
}

function addToStreak() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastTaskDate');

    if (lastDate !== today) {
        const newStreak = parseInt(localStorage.getItem('streak')) + 1;
        localStorage.setItem('streak', newStreak.toString());
        localStorage.setItem('lastTaskDate', today);

        const streakUpdatedEvent = new CustomEvent('streakUpdated');
        document.dispatchEvent(streakUpdatedEvent);
    }
}

function addPointsToLocalStorage(pointsToAdd) {
    try {
        let points = parseInt(localStorage.getItem('points')) || 0;
        points += pointsToAdd;
        localStorage.setItem('points', points.toString());
        console.log(`Points updated in localStorage. Total: ${points}`);

        const pointsUpdatedEvent = new CustomEvent('pointsUpdated', {
            detail: { points }
        });
        document.dispatchEvent(pointsUpdatedEvent);

    } catch (error) {
        console.error('Error updating points in localStorage:', error);
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

window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('challenges')) {
        initChallenges();
    }
});

initChallenges();
