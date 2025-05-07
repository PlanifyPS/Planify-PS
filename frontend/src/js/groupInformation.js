import { auth, db } from '../../../backend/utils/firebase_config.js';
import {
    doc, getDoc,
    getDocs, collection
} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import Chart from 'https://esm.run/chart.js/auto';

let currentUser;
let members = [];
let totalPoints = 0;
let allRecords = [];
let memberPieChart, historyChart;

export function initGroupInformation() {
    onAuthStateChanged(auth, u => {
        if (u) {
            currentUser = u;
            loadGroupInformation();
        }
    });
}

async function loadGroupInformation() {
    const params   = new URLSearchParams(window.location.hash.split('?')[1]);
    const groupId  = params.get('id');
    if (!groupId) return console.error('No group ID');

    const btnChallenges = document.getElementById('group-challenges');
    const btnHabits     = document.getElementById('group-habits');

    if (groupId && btnChallenges && btnHabits) {
        btnChallenges.dataset.id = groupId;
        btnHabits.dataset.id     = groupId;

        btnChallenges.addEventListener('click', () => {
            window.location.href = `#/groupChallenge?id=${groupId}`;
        });

        btnHabits.addEventListener('click', () => {
            window.location.href = `#/groupHabits?id=${groupId}`;
        });
    }

    const gSnap = await getDoc(doc(db, 'Groups', groupId));
    if (!gSnap.exists()) return console.error('Group not found');
    const g = gSnap.data();

    document.getElementById('group-name').textContent = g.name;
    document.getElementById('group-desc').textContent = g.description || '';
    const inviteCodeEl = document.getElementById('invite-code');
    if (g.createdBy === currentUser.uid) {
        inviteCodeEl.textContent = g.inviteCode;
    } else {
        inviteCodeEl.textContent = 'Ask the admin for the invite code';
        inviteCodeEl.style.fontStyle = 'Roboto';
        inviteCodeEl.style.color = '03045EFF';
    }


    // 2) Trae miembros y suma puntos
    const snaps = await Promise.all(
        g.members.map(uid => getDoc(doc(db, 'Users', uid)))
    );
    members = snaps
        .filter(s=>s.exists())
        .map(s => {
            const userData = s.data();
            const userName =
                userData.userName ||
                userData.Username ||
                userData.name ||
                userData.firstName ||
                userData.displayName ||
                'Unknown';

            return {
                uid: s.id,
                name: userName,
                points: userData.points || 0
            };
        })
        .sort((a,b)=>b.points - a.points);
    totalPoints = members.reduce((sum,u)=> sum+u.points, 0);

    // 3) Rellenar podio
    const [first,second,third] = [members[0],members[1],members[2]].filter(Boolean);
    const pods = { first, second, third };
    Object.entries(pods).forEach(([pos,u])=>{
        const el = document.querySelector(`.podium-item.${pos}`);
        if (!u) return el.style.visibility='hidden';
        el.querySelector('.user-name').textContent = u.name;
        el.querySelector('.points').textContent    = `${u.points} pts`;
    });

    // 4) Lista de demás miembros
    const ul = document.getElementById('members-list');
    ul.innerHTML = '';
    members.forEach(u=>{
        const li = document.createElement('li');
        li.textContent = u.name;
        li.dataset.uid = u.uid;
        li.addEventListener('click', ()=> selectMember(u));
        ul.appendChild(li);
    });

    // 5) Inicializa primer gráfico de historial
    await loadAllRecords();
    setupHistoryChart();
    document.getElementById('range-select')
        .addEventListener('change', e=> updateHistoryChart(e.target.value));
}

async function loadAllRecords() {
    // lee todas las subcolecciones pointsHistory
    const snaps = await Promise.all(
        members.map(u =>
            getDocs(collection(db, 'Users', u.uid, 'pointsHistory'))
        )
    );
    allRecords = [];
    snaps.forEach((snap,i)=>{
        snap.docs.forEach(d=>{
            const { points, timestamp } = d.data();
            const date = new Date(timestamp.seconds*1000).toISOString().slice(0,10);
            allRecords.push({ date, points });
        });
    });
}

function selectMember(u) {
    const instr = document.getElementById('member-instruction');
    if (instr) instr.style.display = 'none';

    const pct = totalPoints > 0
        ? Math.round(u.points / totalPoints * 100)
        : 0;
    document.getElementById('member-chart-title').textContent =
        `${u.name}: ${pct}% of total`;

    const ctx = document.getElementById('memberPieChart').getContext('2d');
    if (memberPieChart) memberPieChart.destroy();
    memberPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [u.name, 'Others'],
            datasets: [{
                data:   [u.points, totalPoints - u.points],
                backgroundColor: ['#4f46e5', '#c7d2fe']
            }]
        },
        options: { responsive: true }
    });
}


function getPeriodKey(dateStr, range) {
    const d = new Date(dateStr);
    if (range==='daily')   return dateStr;
    if (range==='weekly')  {
        const day = d.getUTCDay(), diff = (day+6)%7;
        d.setDate(d.getDate()-diff);
        return d.toISOString().slice(0,10);
    }
    return dateStr.slice(0,7);
}

function setupHistoryChart() {
    const ctx = document.getElementById('pointsHistoryChart').getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets:[{ label:'Points', data:[] }] },
        options:{
            responsive:true,
            scales:{ y:{ beginAtZero:true } }
        }
    });
    updateHistoryChart('weekly');
}

function updateHistoryChart(range) {
    const sum = {};
    allRecords.forEach(r=>{
        const key = getPeriodKey(r.date, range);
        sum[key] = (sum[key]||0) + r.points;
    });
    const labels = Object.keys(sum).sort();
    const data   = labels.map(l=>sum[l]);
    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = data;
    historyChart.data.datasets[0].label = `Total Points (${range})`;
    historyChart.update();
}

initGroupInformation();