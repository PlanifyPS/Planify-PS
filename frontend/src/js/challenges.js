// Ruta al archivo JSON
const JSON_PATH = '../../frontend/src/json/challenges.json';
let challengesData = []; // Almacenar los desafíos cargados

// Función principal que se ejecuta al cargar la página
export function initChallenges() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'complete') {
        loadChallenges();
    } else {
        document.addEventListener('DOMContentLoaded', loadChallenges);
    }
}

async function loadChallenges() {
    try {
        const container = document.getElementById('cards-container');
        if (container) container.innerHTML = '<p>Cargando desafíos...</p>';

        const response = await fetch(JSON_PATH);
        if (!response.ok) throw new Error('No se pudieron cargar los desafíos');

        challengesData = await response.json();
        renderChallenges(challengesData);
        setupCardClickListeners();
        setupFilterEvents(); // Añade esta línea
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los desafíos');
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
        // Filtro por búsqueda (nombre)
        const matchesSearch = challenge.name.toLowerCase().includes(searchTerm);

        // Filtro por estado
        let matchesStatus = true;
        if (statusFilter === 'completed') {
            matchesStatus = challenge.completed === true;
        } else if (statusFilter === 'pending') {
            matchesStatus = !challenge.completed;
        }

        // Filtro por nivel
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
        container.innerHTML = '<p>No hay desafíos disponibles</p>';
        return;
    }

    container.innerHTML = challenges.map(challenge => `
        <article class="card" data-id="${challenge.id}">
            <div class="card-header">
                <h2>${challenge.name}</h2>
                <span class="tag ${challenge.level.toLowerCase()}">${challenge.level}</span>
                <button class="delete-challenge" data-id="${challenge.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p>${challenge.shortDescription}</p>
            <div class="card-footer">
                <span class="points">${challenge.points} pts</span>
                <span class="duration"><i class="far fa-clock"></i> ${challenge.duration} días</span>
            </div>
        </article>
    `).join('');

    setupDeleteButtons();
}

function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-challenge');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el click se propague a la tarjeta
            const challengeId = button.getAttribute('data-id');
            removeChallengeFromView(challengeId);
        });
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
                    <h2>Selecciona un desafío</h2>
                    <p>Haz clic en cualquier desafío para ver sus detalles</p>
                </div>
            `;
        }
    }
}

function setupCardClickListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Solo mostrar detalles si el click no fue en el botón de eliminar
            if (!e.target.closest('.delete-challenge')) {
                const challengeId = card.getAttribute('data-id');
                showChallengeDetails(challengeId);
            }
        });
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
                    <span class="duration"><i class="far fa-clock"></i> ${challenge.duration} días</span>
                    ${challenge.category ? `<span class="category"><i class="fas fa-tag"></i> ${challenge.category}</span>` : ''}
                </div>
            </div>
            <div class="detail-body">
                <div class="description-section">
                    <h3>Descripción</h3>
                    <p>${challenge.description}</p>
                </div>

                ${challenge.details ? `
                <div class="details-section">
                    <h3>Detalles</h3>
                    <div class="challenge-details">${challenge.details}</div>
                </div>
                ` : ''}

                ${challenge.tips && challenge.tips.length > 0 ? `
                <div class="tips-section">
                    <h3><i class="fas fa-lightbulb"></i> Consejos para completarlo</h3>
                    <ul class="tips-list">
                        ${challenge.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <div class="actions-section">
                    <button class="btn accept-challenge">
                        <i class="fas fa-check-circle"></i> Aceptar Desafío
                    </button>
                    ${challenge.completed ? '<span class="completed-badge">Completado</span>' : ''}
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
}

function acceptChallenge(challengeId) {
    const challenge = challengesData.find(c => c.id == challengeId);
    if (!challenge) return;

    challenge.completed = true;

    const detailContainer = document.getElementById('challenge-detail');
    if (detailContainer) {
        const completedBadge = document.createElement('span');
        completedBadge.className = 'completed-badge';
        completedBadge.textContent = 'Completado';

        const actionsSection = detailContainer.querySelector('.actions-section');
        if (actionsSection) {
            actionsSection.appendChild(completedBadge);
        }
    }

    console.log(`Desafío "${challenge.name}" aceptado y marcado como completado`);
}

function showError(message) {
    const container = document.getElementById('cards-container');
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
    if (window.location.hash.includes('challenges')) {
        initChallenges();
    }
});

initChallenges();