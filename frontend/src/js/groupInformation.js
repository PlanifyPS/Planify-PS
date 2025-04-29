// group-information.js
import {auth, db} from '../../../backend/utils/firebase_config.js';
import {
    doc,
    getDoc,
    getDocs,
    collection
} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';

import Chart from 'https://esm.run/chart.js/auto';

let user = {};
export function initGroupInformation() {
    if (document.readyState === 'complete') {

        onAuthStateChanged(auth, authUser => {
            if (authUser) {
                user = authUser;
                loadGroupInformation();
            } else {
                console.log('No user is signed in');
            }
        });
    } else {
        document.addEventListener('DOMContentLoaded', loadGroupInformation);
    }
}

async function loadGroupInformation() {
    const hash = window.location.hash || '';
    const queryString = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    const groupId = params.get('id');
    if (!groupId) {
        console.error('No group ID provided');
        return;
    }

    const groupRef = doc(db, 'Groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
        console.error('Group not found:', groupId);
        return;
    }

    const groupData = groupSnap.data();

    document.getElementById('group-name').textContent = groupData.name;
    document.getElementById('group-desc').textContent = groupData.description || '';
    document.getElementById('invite-code').textContent =
        groupData.createdBy === user.uid
            ? `Invite Code: ${groupData.inviteCode}`
            : '';

    const memberDocs = await Promise.all(
        groupData.members.map(uid => getDoc(doc(db, 'Users', uid)))
    );


    const members = memberDocs
        .filter(snap => snap.exists())
        .map(snap => {
            const d = snap.data();
            return {
                uid: snap.id,
                name: d.username || d.name || 'Unknown',
                points: d.points || 0,
                improvement: d.improvement || 0
            };
        });

    console.log(members);

    members.sort((a, b) => b.points - a.points);
    const [first, second, third, ...others] = members;

    const podiumEls = {
        first: document.querySelector('.podium-item.first'),
        second: document.querySelector('.podium-item.second'),
        third: document.querySelector('.podium-item.third')
    };
    [second, first, third].forEach((user, idx) => {
        const key = ['second', 'first', 'third'][idx];
        const el = podiumEls[key];
        el.querySelector('.user-name').textContent = user?.name || '';
        el.querySelector('.points').textContent = user ? `${user.points} pts` : '';
    });

    const ul = document.getElementById('members-list');
    ul.innerHTML = '';
    others.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${u.name}</span><span>${u.points} pts</span>`;
        ul.appendChild(li);
    });

    const ctx1 = document.getElementById('improvementChart').getContext('2d');
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels:    members.map(u => u.name),
            datasets: [{
                label: 'Improvement',
                data:   members.map(u => u.improvement)
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    const historySnapshots = await Promise.all(
        members.map(u =>
            getDocs(collection(db, 'Users', u.uid, 'pointsHistory'))
        )
    );

    console.log(historySnapshots);

    function getWeekStart(dateStr) {
        const d = new Date(dateStr);
        const day = d.getUTCDay();
        const diff = (day + 6) % 7;
        d.setDate(d.getDate() - diff);
        return d.toISOString().slice(0, 10);
    }

    const allRecords = [];
    historySnapshots.forEach(snap => {
        snap.docs.forEach(d => {
            const { points, timestamp } = d.data();
            const dateStr = new Date(timestamp.seconds * 1000)
                .toISOString().slice(0,10);
            allRecords.push({ date: dateStr, points });
        });
    });

    const sumByWeek = {};
    allRecords.forEach(({ date, points }) => {
        const weekStart = getWeekStart(date);
        sumByWeek[weekStart] = (sumByWeek[weekStart] || 0) + points;
    });

    const sortedWeeks = Object.keys(sumByWeek).sort();
    const totalPointsPerWeek = sortedWeeks.map(week => sumByWeek[week]);

    const ctx2 = document.getElementById('pointsHistoryChart').getContext('2d');
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: sortedWeeks,
            datasets: [{
                label: 'Total Points (by week)',
                data: totalPointsPerWeek
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true },
                x: {
                    ticks: {
                        callback: val => {
                            return sortedWeeks[val].slice(5);
                        }
                    }
                }
            }
        }
    });
}

initGroupInformation();
