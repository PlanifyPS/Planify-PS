// analytics.js
import Chart from 'https://esm.run/chart.js/auto';
import { auth, db } from '../../../backend/utils/firebase_config.js';
import { collection, getDocs, getDoc, doc } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';

let habitsBarChart, habitsPieChart;
let tasksBarChart, tasksPieChart;

export function initAnalytics() {
    onAuthStateChanged(auth, user => {
        if (!user) return window.location.href = '#/register';
        loadAnalytics(user.uid);
    });
}

async function loadAnalytics(uid) {
    await loadHabitsAnalytics(uid);
    await loadTasksAnalytics(uid);
}

function getLastNDates(n) {
    const arr = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        arr.push(d);
    }
    return arr;
}

function groupSum(records, keyFn) {
    return records.reduce((acc, r) => {
        const k = keyFn(r);
        acc[k] = (acc[k] || 0) + 1;
        return acc;
    }, {});
}

function drawBar(containerId, labels, data, label) {
    const ctx = document.createElement('canvas');
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    cont.appendChild(ctx);

    const cfg = {
        type: 'bar',
        data: { labels, datasets: [{ label, data, backgroundColor: '#4f46e5' }] },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    };

    if (containerId.startsWith('habits')) {
        habitsBarChart?.destroy();
        habitsBarChart = new Chart(ctx.getContext('2d'), cfg);
    } else {
        tasksBarChart?.destroy();
        tasksBarChart = new Chart(ctx.getContext('2d'), cfg);
    }
}

function drawPie(containerId, doneCount, totalDays) {
    const missed = totalDays - doneCount;
    const ctx = document.createElement('canvas');
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    cont.appendChild(ctx);

    const cfg = {
        type: 'pie',
        data: {
            labels: ['Done','Missed'],
            datasets: [{
                data: [doneCount, missed],
                backgroundColor: ['#2563EB', '#93C5FD']
            }]
        },
        options: { responsive: true }
    };

    if (containerId.startsWith('habits')) {
        habitsPieChart?.destroy();
        habitsPieChart = new Chart(ctx.getContext('2d'), cfg);
    } else {
        tasksPieChart?.destroy();
        tasksPieChart = new Chart(ctx.getContext('2d'), cfg);
    }
}

async function loadHabitsAnalytics(uid) {
    // 0) Traer doc de usuario para leer habits.{id}.completed
    const userSnap = await getDoc(doc(db, 'Users', uid));
    const userData = userSnap.exists() ? userSnap.data() : {};
    const habitsObj = userData.habits || {};
    // cuenta cuántos están pendientes (completed === false)
    const habitsInProgress = Object.values(habitsObj)
        .filter(h => h.completed === false)
        .length;

    // 1) Histórico de completion timestamps…
    const snaps = await getDocs(collection(db, 'Users', uid, 'habitsHistory'));
    const dates = snaps.docs.map(d =>
        new Date(d.data().timestamp.seconds * 1000)
    );

    // 2) Generar últimas 7 fechas y conteos diarios…
    const last7Dates = getLastNDates(7);
    const grouped = groupSum(dates, d => d.toISOString().slice(0,10));
    const dailyCounts = last7Dates.map(d =>
        grouped[d.toISOString().slice(0,10)] || 0
    );

    // 3) Calcula streaks, totals, etc.
    const todayCount    = dailyCounts[6];
    const currentStreak = (() => { let s=0; for(let i=6;i>=0&&dailyCounts[i]>0;i--) s++; return s; })();
    const maxStreak     = (() => { let m=0,c=0; for(const v of dailyCounts){ v>0?c++:(m=Math.max(m,c),c=0);} return Math.max(m,c); })();
    const totalDone     = dates.length;
    const planned       = 0;  // si tienes lógica de “planned” añádela aquí

    // 4) Actualizar DOM
    document.getElementById('habits-current-streak').textContent  = currentStreak;
    document.getElementById('habits-completed-today').textContent = todayCount;
    document.getElementById('habits-planned').textContent        = planned;
    document.getElementById('habits-total').textContent          = totalDone;
    document.getElementById('habits-in-progress').textContent    = habitsInProgress;
    document.getElementById('habits-max-streak').textContent     = maxStreak;

    // 5) Dibuja barra y pie…
    const dayLabels = last7Dates.map(d =>
        d.toLocaleDateString('en-US',{ weekday: 'short' })
    );
    drawBar('habits-BarChart', dayLabels, dailyCounts, 'Habits done');
    const doneThisWeek = dailyCounts.reduce((acc,v)=> acc + (v>0?1:0), 0);
    drawPie('habits-circle-progress', doneThisWeek, 7);
}

async function loadTasksAnalytics(uid) {
    // 0) Leemos las tareas del localStorage para el in-progress
    const userTasks = JSON.parse(localStorage.getItem("UserTasks")) || [];
    const tasksInProgress = userTasks.filter(t => t.completed === false).length;

    // 1) Histórico de completions…
    const snaps = await getDocs(collection(db, 'Users', uid, 'tasksHistory'));
    const dates = snaps.docs.map(d =>
        new Date(d.data().timestamp.seconds * 1000)
    );

    // 2) Últimos 7 días…
    const last7Dates = getLastNDates(7);
    const grouped    = groupSum(dates, d => d.toISOString().slice(0,10));
    const dailyCounts = last7Dates.map(d =>
        grouped[d.toISOString().slice(0,10)] || 0
    );

    // 3) Cálculo de counters…
    const todayCount    = dailyCounts[6];
    const currentStreak = (() => { let s=0; for(let i=6;i>=0&&dailyCounts[i]>0;i--) s++; return s; })();
    const maxStreak     = (() => { let m=0,c=0; for(const v of dailyCounts){ v>0?c++:(m=Math.max(m,c),c=0);} return Math.max(m,c); })();
    const totalDone     = dates.length;
    const planned       = 0; // si tienes lógica de planned
    const inProgress    = tasksInProgress;

    // 4) Actualizar DOM
    document.getElementById('tasks-current-streak').textContent  = currentStreak;
    document.getElementById('tasks-completed-today').textContent = todayCount;
    document.getElementById('tasks-planned').textContent        = planned;
    document.getElementById('tasks-total').textContent          = totalDone;
    document.getElementById('tasks-in-progress').textContent    = inProgress;
    document.getElementById('tasks-max-streak').textContent     = maxStreak;

    // 5) Gráficas…
    const dayLabels = last7Dates.map(d =>
        d.toLocaleDateString('en-US',{ weekday: 'short' })
    );
    drawBar('tasks-BarChart', dayLabels, dailyCounts, 'Tasks done');
    const doneThisWeek = dailyCounts.reduce((acc,v)=> acc + (v>0?1:0), 0);
    drawPie('tasks-circle-progress', doneThisWeek, 7);
}


initAnalytics();
