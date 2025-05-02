import { auth, db } from "../../../backend/utils/firebase_config.js";
import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

export function initPoints() {
    onAuthStateChanged(auth, user => {
        if (!user) return;
        loadPoints(user.uid);
    });
    document.addEventListener("pointsUpdated", () => {
        if (auth.currentUser) loadPoints(auth.currentUser.uid);
    });
}

async function loadPoints(uid) {
    const userRef = doc(db, "Users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        await setDoc(userRef, { points: 0, streak: 0, lastTaskDate: "" });
    }
    const data = (await getDoc(userRef)).data();
    const pts = data.points || 0;
    updatePointsUI(pts);
    updateMedals(pts);
    updateRank(Math.floor(pts / 50));
    updateStreakUI(data.streak);
    checkStreak(data.lastTaskDate, data.streak);
}

export async function addPoints(amount) {
    const user = auth.currentUser;
    if (!user) {
        console.error("addPoints: no user logged in");
        return;
    }
    const uid = user.uid;
    const userRef = doc(db, "Users", uid);
    const snap = await getDoc(userRef);
    const old = snap.exists() ? snap.data().points || 0 : 0;
    const next = old + amount;

    await updateDoc(userRef, { points: next });
    await addDoc(
        collection(db, "Users", uid, "pointsHistory"),
        { timestamp: serverTimestamp(), delta: amount, total: next }
    );

    document.dispatchEvent(new Event("pointsUpdated"));
    return next;
}

function updatePointsUI(pts) {
    document.querySelectorAll("#points").forEach(el => el.textContent = pts + "pts");
}

function updateMedals(pts) {
    const m = document.getElementById("medals-container");
    if (!m) return;
    m.innerHTML = "";
    const medals = Math.floor(pts / 50);
    for (let i = 0; i < medals; i++) {
        const iEl = document.createElement("i");
        iEl.className = "fa-solid fa-medal";
        m.appendChild(iEl);
    }
    updateRank(medals);
}

function updateRank(medals) {
    const r = document.getElementById("rank-display");
    if (!r) return;
    const ranks = ["Beginner","Apprentice","Novice","Intermediate","Advanced","Expert","Master","Elite","Legend","Mythical"];
    r.textContent = `Range: ${ranks[Math.min(Math.floor(medals/3), ranks.length-1)]}`;
}

function updateStreakUI(streak=0) {
    const s = document.getElementById("streak");
    if (s) s.textContent = streak;
}

async function checkStreak(lastDate, streak) {
    const today = new Date().toDateString();
    const y = new Date(); y.setDate(y.getDate()-1);
    const yesterday = y.toDateString();
    if (lastDate!==today && lastDate!==yesterday) {
        await updateDoc(doc(db,"Users",auth.currentUser.uid),{ streak:0 });
        updateStreakUI(0);
    }
}

window.initPoints = initPoints;
