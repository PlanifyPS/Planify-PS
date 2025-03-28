export function initPoints() {
    if (document.readyState === 'complete') {
        loadPoints();
    } else {
        document.addEventListener('DOMContentLoaded', loadPoints);
    }

    document.addEventListener('pointsUpdated', (e) => {
        updatePoints();
    });
}

function loadPoints(){
    updatePoints();
    checkStreak();
    updateStreakUI();
    setupTaskButton();
}

if (!localStorage.getItem('points')) {
    localStorage.setItem('points', '0');
}

function updatePoints() {
    const points = localStorage.getItem('points') || '0';
    document.querySelectorAll('#points').forEach(el => {
        el.textContent = points + 'pts';
    });

    updateMedals(parseInt(points));
}

function updateMedals(points) {
    const medalsContainer = document.getElementById('medals-container');
    if (!medalsContainer) return;

    medalsContainer.innerHTML = "";

    const medalCount = Math.floor(points / 50);

    for (let i = 0; i < medalCount; i++) {
        const medalIcon = document.createElement('i');
        medalIcon.className = "fa-solid fa-medal";
        medalsContainer.appendChild(medalIcon);
    }
}

if (!localStorage.getItem('streak')) {
    localStorage.setItem('streak', '0');
    localStorage.setItem('lastTaskDate', '');
}

function updateStreakUI() {
    const streakElement = document.getElementById('streak');
    if (streakElement) {
        streakElement.textContent = localStorage.getItem('streak');
    }
}

function checkStreak() {
    const lastDate = localStorage.getItem('lastTaskDate');
    const today = new Date().toDateString();

    if (!lastDate) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate !== yesterday.toDateString() && lastDate !== today) {
        localStorage.setItem('streak', '0');
        updateStreakUI();
    }
}

function addToStreak() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastTaskDate');

    if (lastDate !== today) {
        const newStreak = parseInt(localStorage.getItem('streak')) + 1;
        localStorage.setItem('streak', newStreak.toString());
        localStorage.setItem('lastTaskDate', today);
        updateStreakUI();
    }
}

function setupTaskButton() {
    document.querySelectorAll('.complete-task-button').forEach(button => {
        button.addEventListener('click', function() {
            const newPoints = parseInt(localStorage.getItem('points') || '0') + 1;
            localStorage.setItem('points', newPoints.toString());
            updatePoints();
            addToStreak();
        });
    });
}

initPoints();
document.addEventListener('streakUpdated', updateStreakUI);
window.initPoints = initPoints;