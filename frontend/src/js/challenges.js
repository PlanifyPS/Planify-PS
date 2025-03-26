// Ruta al archivo JSON
const JSON_PATH = '../../frontend/src/json/challenges.json';

// Función principal que se ejecuta al cargar la página
export function initChallenges() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'complete') {
        loadChallenges();
    } else {
        document.addEventListener('DOMContentLoaded', loadChallenges);
    }
}

// Cargar los challenges desde el JSON
async function loadChallenges() {
    try {
        // Mostrar estado de carga
        const container = document.getElementById('cards-container');
        if (container) container.innerHTML = '<p>Cargando desafíos...</p>';

        // Hacer la petición al JSON
        const response = await fetch(JSON_PATH);

        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error('No se pudieron cargar los desafíos');
        }

        // Convertir la respuesta a JSON
        const challenges = await response.json();

        // Mostrar los challenges en la página
        renderChallenges(challenges);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los desafíos');
    }
}

// Mostrar los challenges en el HTML
function renderChallenges(challenges) {
    const container = document.getElementById('cards-container');
    if (!container) return;

    // Si no hay challenges, mostrar mensaje
    if (!challenges || challenges.length === 0) {
        container.innerHTML = '<p>No hay desafíos disponibles</p>';
        return;
    }

    // Generar el HTML para cada challenge
    container.innerHTML = challenges.map(challenge => `
        <article class="card" data-id="${challenge.id}">
            <div class="card-header">
                <h2>${challenge.name}</h2>
            </div>
            <p>${challenge.description}</p>
            <div class="card-footer">
                <span class="tag ${challenge.level.toLowerCase()}">${challenge.level}</span>
                <span class="points">${challenge.points} pts</span>
            </div>
        </article>
    `).join('');
}

// Mostrar mensaje de error
function showError(message) {
    const container = document.getElementById('cards-container');
    if (container) {
        container.innerHTML = `
            <div class="error">
                <p>${message}</p>
                <button onclick="window.location.reload()">Reintentar</button>
            </div>
        `;
    }
}

// Escuchar cambios en la URL
window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('challenges')) {
        initChallenges();
    }
});

// Iniciar cuando se carga la página
initChallenges();