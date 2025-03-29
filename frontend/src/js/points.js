export function initPoints() {
    if (document.readyState === 'complete') {
        loadPoints();
    } else {
        document.addEventListener('DOMContentLoaded', loadPoints);
    }
}

function loadPoints(){
    updatePoints();
    checkStreak();
    updateStreakUI();
}

if (!localStorage.getItem('points')) {
    localStorage.setItem('points', '0');
}

function updatePoints() {
    const points = localStorage.getItem('points') || '0';
    const pointsElement = document.getElementById('points');
    const medalsContainer = document.getElementById('medals-container');

    if (pointsElement) {
        pointsElement.textContent = `${points}pts`;
    }

    updateMedals(parseInt(points));
}

function updateMedals(points) {
    const medalsContainer = document.getElementById('medals-container');
    if (!medalsContainer) return;

    const medalCount = Math.floor(points / 50);
    medalsContainer.innerHTML = "";

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
    document.getElementById('streak').textContent = localStorage.getItem('streak');
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

document.querySelector('.complete-task-button').addEventListener('click', function() {
    const newPoints = parseInt(localStorage.getItem('points')) + 1;
    localStorage.setItem('points', newPoints.toString());
    updatePoints();
    addToStreak();
});

function incrementPoints() {
    let points = parseInt(localStorage.getItem('points')) || 0;
    points += 1;
    localStorage.setItem('points', points.toString());
    updatePoints();

    console.log("Disparando evento taskCompleted");
    document.dispatchEvent(new CustomEvent('taskCompleted'));
}


document.addEventListener('taskCompleted', incrementPoints);
initPoints();