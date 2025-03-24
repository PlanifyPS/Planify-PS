document.addEventListener("DOMContentLoaded", () => {
    checkChallengesSection();
});

window.addEventListener("hashchange", () => {
    checkChallengesSection();
});

function checkChallengesSection() {
    const challengesSection = document.getElementById("challenges");
    if (challengesSection) {
        initChallenges();
    }
}

function initChallenges() {
    const challengesSection = document.getElementById("challenges");
    const challengesContainer = document.getElementById("cards-container");
    const challengeDetail = document.getElementById("challenge-detail");
    const closeDetailBtn = document.getElementById("close-detail");

    let challenges = [];

    async function loadChallenges() {
        try {
            const response = await fetch("../src/json/challenges.json");
            if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
            challenges = await response.json();
            loadStatus();
            renderChallenges();
        } catch (error) {
            console.error("Error al cargar los desafíos:", error);
        }
    }

    function loadStatus() {
        const completedStatus = JSON.parse(localStorage.getItem("completedChallenges")) || {};
        const pinnedStatus = JSON.parse(localStorage.getItem("pinnedChallenges")) || {};

        challenges.forEach(challenge => {
            challenge.completed = completedStatus[challenge.id] || false;
            challenge.pinned = pinnedStatus[challenge.id] || false;
        });

        challenges.sort((a, b) => b.pinned - a.pinned); // Poner los fijados arriba
    }

    function saveStatus() {
        const completedStatus = {};
        const pinnedStatus = {};

        challenges.forEach(challenge => {
            completedStatus[challenge.id] = challenge.completed;
            pinnedStatus[challenge.id] = challenge.pinned;
        });

        localStorage.setItem("completedChallenges", JSON.stringify(completedStatus));
        localStorage.setItem("pinnedChallenges", JSON.stringify(pinnedStatus));
    }

    function renderChallenges() {
        if (!challengesContainer) return;

        challengesContainer.innerHTML = "";
        challenges.forEach(challenge => {
            const challengeCard = document.createElement("article");
            challengeCard.className = `card ${challenge.completed ? "completed" : ""} ${challenge.pinned ? "pinned" : ""}`;
            challengeCard.dataset.id = challenge.id;

            challengeCard.innerHTML = `
                <div class="card-header">
                    <h2>${challenge.name}</h2>
                    <div class="card-actions">
                        <button class="icon-btn pin-btn"><i class="fas fa-thumbtack"></i></button>
                        <button class="icon-btn complete-btn"><i class="fas ${challenge.completed ? "fa-check-circle" : "fa-circle"}"></i></button>
                        <button class="icon-btn close-btn"><i class="fas fa-xmark"></i></button>
                    </div>
                </div>
                <p>${challenge.description}</p>
                <div class="card-footer">
                    <span class="tag">${challenge.level}</span>
                    <span class="card-date">${challenge.points} Pts</span>
                </div>
            `;

            challengesContainer.appendChild(challengeCard);
        });

        setupCardEvents();
    }

    function setupCardEvents() {
        document.querySelectorAll(".close-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                const card = e.target.closest(".card");
                card.remove();
            });
        });

        document.querySelectorAll(".complete-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                const card = e.target.closest(".card");
                const challengeId = parseInt(card.dataset.id);
                const challenge = challenges.find(c => c.id === challengeId);
                challenge.completed = !challenge.completed;
                saveStatus();
                renderChallenges();
            });
        });

        document.querySelectorAll(".pin-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                const card = e.target.closest(".card");
                const challengeId = parseInt(card.dataset.id);
                const challenge = challenges.find(c => c.id === challengeId);
                challenge.pinned = !challenge.pinned;
                saveStatus();
                renderChallenges();
            });
        });

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", () => openChallengeDetail(card));
        });
    }

    function openChallengeDetail(card) {
        const challengeId = parseInt(card.dataset.id);
        const challenge = challenges.find(c => c.id === challengeId);

        challengeDetail.innerHTML = `
            <div class="detail-header">
                <h2>${challenge.name}</h2>
                <button id="close-detail" class="icon-btn"><i class="fas fa-xmark"></i></button>
            </div>
            <p>${challenge.description}</p>
            <div class="points">${challenge.points} Pts</div>
        `;

        document.getElementById("close-detail").addEventListener("click", closeChallengeDetail);
        challengesSection.classList.add("expanded");
    }

    function closeChallengeDetail() {
        challengesSection.classList.remove("expanded");
    }

    loadChallenges();
}
