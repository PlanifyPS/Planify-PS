alert("challenges.js cargado!"); // Depuración

// Función principal exportada
export function initChallenges() {
    alert("initChallenges ejecutado"); // Depuración
    try {
        loadChallenges();
    } catch (error) {
        alert(`Error en initChallenges: ${error.message}`); // Depuración
        console.error(error);
    }
}

async function loadChallenges() {
    alert("Intentando cargar challenges.json"); // Depuración
    try {
        const response = await fetch('../../frontend/src/json/challenges.json');
        if (!response.ok) throw new Error("Error en la respuesta");

        const data = await response.json();
        alert(`Cargados ${data.length} desafíos`); // Depuración
        renderChallenges(data);
    } catch (error) {
        alert(`Error cargando desafíos: ${error.message}`); // Depuración
        throw error;
    }
}

function renderChallenges(challenges) {
    alert("Intentando renderizar desafíos"); // Depuración
    const container = document.getElementById('cards-container');

    if (!container) {
        alert("No se encontró cards-container"); // Depuración
        return;
    }

    container.innerHTML = challenges.map(challenge => `
        <div class="challenge-card">
            <h3>${challenge.name}</h3>
            <p>${challenge.description}</p>
            <span>${challenge.points} puntos</span>
        </div>
    `).join('');

    alert("Desafíos renderizados"); // Depuración
}

// Llamada automática si estamos en la página de desafíos
if (window.location.hash.includes('challenges')) {
    alert("Página de desafíos detectada, iniciando..."); // Depuración
    initChallenges();
}