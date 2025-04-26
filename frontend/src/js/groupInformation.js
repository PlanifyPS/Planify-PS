// group-information.js
import {auth, db} from '../../../backend/utils/firebase_config.js';
import {
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
//import { Chart } from 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.esm.js';

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
                name: d.username || d.name || 'Unknown',
                points: d.points || 0,
                improvement: d.improvement || 0
            };
        });

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

    /*const ctx = document.getElementById('improvementChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: members.map(u => u.name),
            datasets: [
                {
                    label: 'Improvement',
                    data: members.map(u => u.improvement)
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });*/
}

initGroupInformation();
