// js/points.js
import { auth, db } from "../../../backend/utils/firebase_config.js";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

let currentUserUid = null;

export function initPoints() {
    if (document.readyState === 'complete') {
        loadPoints();
    } else {
        document.addEventListener('DOMContentLoaded', loadPoints);
    }

    document.addEventListener('pointsUpdated', () => {
        updatePointsUI();
    });
}

async function loadPoints() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserUid = user.uid;
            const docRef = doc(db, "Users", currentUserUid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    points: 0,
                    streak: 0,
                    lastTaskDate: ""
                });
            }

            const data = (await getDoc(docRef)).data();
            const points = data.points || 0;

            updatePointsUI(points);
            updateMedals(points);
            updateRank(Math.floor(points / 50));
            updateStreakUI(data.streak);
            checkStreak(data.lastTaskDate, data.streak);

            setupTaskButton();
        }
    });
}

async function addPoint() {
    const docRef = doc(db, "Users", currentUserUid);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data();

    const newPoints = (data.points || 0) + 1;
    await updateDoc(docRef, { points: newPoints });

    updatePointsUI(newPoints);
    updateMedals(newPoints);
    await addToStreak(data.streak, data.lastTaskDate);
}

function updatePointsUI(points = 0) {
    document.querySelectorAll('#points').forEach(el => {
        el.textContent = points + 'pts';
    });
}

function updateMedals(points) {
    const medalsContainer = document.getElementById('medals-container');
    if (!medalsContainer) return;

    medalsContainer.innerHTML = "";

    const totalMedals = Math.floor(points / 50);
    for (let i = 0; i < totalMedals; i++) {
        const medalIcon = document.createElement('i');
        medalIcon.className = "fa-solid fa-medal";
        medalsContainer.appendChild(medalIcon);
    }

    updateRank(totalMedals);
}

function updateRank(totalMedals) {
    const rankDisplay = document.getElementById('rank-display');
    if (!rankDisplay) return;

    const ranks = ["Beginner", "Apprentice", "Novice", "Intermediate",
        "Advanced", "Expert", "Master", "Elite", "Legend", "Mythical"];

    const newRankIndex = Math.min(Math.floor(totalMedals / 3), ranks.length - 1);
    const newRank = ranks[newRankIndex];

    rankDisplay.textContent = `Range: ${newRank}`;
}

function updateStreakUI(streak = 0) {
    const streakElement = document.getElementById('streak');
    if (streakElement) {
        streakElement.textContent = streak;
    }
}

async function checkStreak(lastDate, currentStreak) {
    const today = new Date().toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastDate !== today && lastDate !== yesterdayStr) {
        await updateDoc(doc(db, "Users", currentUserUid), {
            streak: 0
        });
        updateStreakUI(0);
    }
}

async function addToStreak(currentStreak = 0, lastDate = "") {
    const today = new Date().toDateString();

    if (lastDate !== today) {
        const newStreak = currentStreak + 1;
        await updateDoc(doc(db, "Users", currentUserUid), {
            streak: newStreak,
            lastTaskDate: today
        });
        updateStreakUI(newStreak);
    }
}

function setupTaskButton() {
    document.querySelectorAll('.complete-task-button').forEach(button => {
        button.addEventListener('click', async () => {
            await addPoint();
        });
    });
}

document.addEventListener('streakUpdated', () => {
    updateStreakUI();
});

window.initPoints = initPoints;
