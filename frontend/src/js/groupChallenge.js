const JSON_PATH = '../../frontend/src/json/challenges.json';
let groupChallengesData = [];

import { db } from '../../../backend/utils/firebase_config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

async function fetchGroupMembers(groupId) {
    const groupRef = doc(db, 'Groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) return [];

    const groupData = groupSnap.data();
    return groupData.members || [];
}

async function fetchUsernamesFromIds(userIds) {
    const userDocs = await Promise.all(userIds.map(uid => getDoc(doc(db, 'Users', uid))));
    return userDocs.map(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name || data.email || 'Unknown User'
            };
        }
        return { id: 'unknown', name: 'Unknown User' };
    });
}

function getGroupIdFromURL() {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    return params.get('id');
}


export function initGroupChallenges() {
    if (document.readyState === 'complete') {
        loadGroupChallenges();
    } else {
        document.addEventListener('DOMContentLoaded', loadGroupChallenges);
    }
}

async function loadGroupChallenges() {
    try {
        const container = document.getElementById('group-cards-container');
        if (container) container.innerHTML = '<p>Loading group challenges...</p>';

        const response = await fetch(JSON_PATH);
        if (!response.ok) throw new Error('Group challenges could not be loaded');

        groupChallengesData = await response.json();
        groupChallengesData.forEach(challenge => {
            if (challenge.joined === undefined) challenge.joined = false;
            if (challenge.completed === undefined) challenge.completed = false;
        });

        renderGroupChallenges(groupChallengesData);
        setupGroupFilterEvents();
    } catch (error) {
        console.error('Error:', error);
        showGroupError('Error loading group challenges');
    }
}

function setupGroupFilterEvents() {
    const searchInput = document.getElementById('search-group-challenges');
    const statusFilter = document.getElementById('filter-group-challenges');
    const levelFilter = document.getElementById('filter-group-level');

    if (searchInput) {
        searchInput.addEventListener('input', filterGroupChallenges);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterGroupChallenges);
    }
    if (levelFilter) {
        levelFilter.addEventListener('change', filterGroupChallenges);
    }
}

function filterGroupChallenges() {
    const searchTerm = document.getElementById('search-group-challenges').value.toLowerCase();
    const statusFilter = document.getElementById('filter-group-challenges').value;
    const levelFilter = document.getElementById('filter-group-level').value;

    const filtered = groupChallengesData.filter(challenge => {
        const matchesSearch = challenge.name.toLowerCase().includes(searchTerm);

        let matchesStatus = true;
        if (statusFilter === 'joined') {
            matchesStatus = challenge.joined === true;
        } else if (statusFilter === 'open') {
            matchesStatus = !challenge.joined && !challenge.completed;
        } else if (statusFilter === 'completed') {
            matchesStatus = challenge.completed === true;
        }

        let matchesLevel = true;
        if (levelFilter !== 'all') {
            matchesLevel = challenge.level.toLowerCase() === levelFilter;
        }

        return matchesSearch && matchesStatus && matchesLevel;
    });

    renderGroupChallenges(filtered);
}

function renderGroupChallenges(challenges) {
    const container = document.getElementById('group-cards-container');
    if (!container) return;

    if (!challenges || challenges.length === 0) {
        container.innerHTML = '<p>No group challenges available</p>';
        return;
    }

    container.innerHTML = challenges.map(challenge => `
        <article class="card group-card" data-id="${challenge.id}">
            <div class="card-header">
                <h2>${challenge.name}</h2>
                <span class="tag ${challenge.level.toLowerCase()}">${challenge.level}</span>
                <button class="join-group-challenge" data-id="${challenge.id}">
                    <i class="fas fa-user-plus"></i>
                </button>
            </div>
            <p>${challenge.shortDescription}</p>
        </article>
    `).join('');

    setupGroupCardClickListeners();
    setupJoinButtons();
}

function setupJoinButtons() {
    const joinButtons = document.querySelectorAll('.join-group-challenge');
    joinButtons.forEach(button => {
        button.removeEventListener('click', button.clickHandler);

        button.clickHandler = (e) => {
            e.stopPropagation();
            const challengeId = button.getAttribute('data-id');
            joinGroupChallenge(challengeId);
        };

        button.addEventListener('click', button.clickHandler);
    });
}

function joinGroupChallenge(challengeId) {
    const challenge = groupChallengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    challenge.joined = true;
    challenge.joinDate = new Date().toISOString();

    console.log(`Joined to the group challenge"${challenge.name}"`);
    showGroupChallengeDetails(challengeId);
    filterGroupChallenges();
}

function setupGroupCardClickListeners() {
    const cards = document.querySelectorAll('.group-card');
    cards.forEach(card => {
        card.removeEventListener('click', card.clickHandler);

        card.clickHandler = (e) => {
            if (!e.target.closest('.join-group-challenge')) {
                const challengeId = card.getAttribute('data-id');
                showGroupChallengeDetails(challengeId);
            }
        };

        card.addEventListener('click', card.clickHandler);
    });
}

async function showGroupChallengeDetails(challengeId) {
    const challenge = groupChallengesData.find(c => c.id == challengeId);
    const detailContainer = document.getElementById('group-challenge-detail');

    if (!challenge || !detailContainer) return;

    detailContainer.innerHTML = `
        <div class="detail-content">
            <div class="detail-header">
                <h2>${challenge.name}</h2>
                <div class="challenge-meta">
                    <span class="tag ${challenge.level.toLowerCase()}">${challenge.level}</span>
                    <span class="points">${challenge.points} pts</span>
                    <span class="duration"><i class="far fa-clock"></i> ${challenge.duration} días</span>
                </div>
            </div>
            <div class="detail-body">
                <p>${challenge.description}</p>
                ${!challenge.joined ? `
                    <button class="btn join-btn" data-id="${challenge.id}">
                        <i class="fas fa-user-plus"></i> Unirse al desafío
                    </button>
                ` : ''}
                ${challenge.joined && !challenge.completed ? `
                    <button class="btn complete-btn" data-id="${challenge.id}">
                        <i class="fas fa-flag-checkered"></i> Mark as Completed
                    </button>
                ` : ''}
                ${challenge.completed ? '<span class="completed-badge">Completed</span>' : ''}
            </div>
        </div>
    `;
    const groupId = getGroupIdFromURL();
    if (groupId) {
        const memberIds = await fetchGroupMembers(groupId);
        const memberInfos = await fetchUsernamesFromIds(memberIds);

        const checklistHTML = memberInfos.map(member => `
            <label class="member-checkbox">
                <input type="checkbox" name="members" value="${member.id}" />
                ${member.name}
            </label>
        `).join('');

        const checklistContainer = document.createElement('div');
        checklistContainer.classList.add('member-checklist');
        checklistContainer.innerHTML = `
            <h4>Assign to members</h4>
            ${checklistHTML}
        `;

        detailContainer.querySelector('.detail-body').appendChild(checklistContainer);
    }


    const joinBtn = detailContainer.querySelector('.join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            joinGroupChallenge(challengeId);
        });
    }

    const completeBtn = detailContainer.querySelector('.complete-btn');
    if (completeBtn) {
        completeBtn.addEventListener('click', () => {
            completeGroupChallenge(challengeId);
        });
    }
}

function completeGroupChallenge(challengeId) {
    const challenge = groupChallengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    challenge.completed = true;
    challenge.completedDate = new Date().toISOString();

    console.log(`Desafío grupal "${challenge.name}" completado.`);
    showGroupChallengeDetails(challengeId);
    filterGroupChallenges();
}

function showGroupError(message) {
    const container = document.getElementById('group-cards-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> Reintentar
                </button>
            </div>
        `;
    }
}

window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('groupchallenges')) {
        initGroupChallenges();
    }
});

initGroupChallenges();
