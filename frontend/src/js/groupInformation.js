//import { Chart } from 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.esm.js';

export function initGroupInformation() {
    if (document.readyState === 'complete') {
        loadGroupInformation();
    } else {
        document.addEventListener('DOMContentLoaded', loadGroupInformation);
    }
}

async function loadGroupInformation() {
    const groupData = {
        name: "Awesome Devs",
        users: [
            { name: "Alice",   points: 150, improvement: 12 },
            { name: "Bob",     points: 120, improvement:  8 },
            { name: "Charlie", points: 100, improvement:  5 },
            { name: "Diana",   points:  80, improvement: 10 },
            { name: "Eve",     points:  60, improvement:  3 },
            { name: "Frank",   points:  40, improvement:  6 }
        ]
    };

    document.getElementById('group-name').textContent = groupData.name;

    const sorted = [...groupData.users].sort((a,b) => b.points - a.points);
    const [first, second, third, ...others] = sorted;

    const podiumEls = {
        first:  document.querySelector('.podium-item.first'),
        second: document.querySelector('.podium-item.second'),
        third:  document.querySelector('.podium-item.third')
    };

    [second, first, third].forEach((user, idx) => {
        // El orden en HTML es second, first, third
        const key = ['second','first','third'][idx];
        const el = podiumEls[key];
        el.querySelector('.user-name').textContent = user.name;
        el.querySelector('.points').textContent    = `${user.points} pts`;
    });

    const ul = document.getElementById('members-list');
    others.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${u.name}</span><span>${u.points} pts</span>`;
        ul.appendChild(li);
    });

    /*const ctx = document.getElementById('improvementChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels:    groupData.users.map(u => u.name),
            datasets: [{
                label: 'Improvement',
                data:   groupData.users.map(u => u.improvement),
            }]
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
