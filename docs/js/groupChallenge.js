import { auth, db } from '../../../backend/utils/firebase_config.js';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import { addPoints } from './points.js';

let groupId, members = [], memberInfos = [], instanceMap = {}, challenges = [];

export function initGroupChallenges() {
    onAuthStateChanged(auth, async user => {
        if (!user) return window.location.href = '#/register';
        const params = new URLSearchParams(location.hash.split('?')[1] || '');
        groupId = params.get('id');
        members = (await getDoc(doc(db, 'Groups', groupId))).data().members || [];
        memberInfos = await Promise.all(
            members.map(async uid => {
                const u = await getDoc(doc(db, 'Users', uid));
                return { id: uid, name: u.exists() ? (u.data().name || u.data().email) : 'Unknown' };
            })
        );
        instanceMap = (await getDocs(collection(db, 'Groups', groupId, 'challenges')))
            .docs.reduce((m, s) => (m[s.data().challengeId] = { id: s.id, ...s.data() }, m), {});
        await loadChallenges();
        setupFilters();
    });
}

async function loadChallenges() {
    challenges = (await getDocs(collection(db, 'GroupChallenges')))
        .docs.map(s => {
            const d = s.data(), inst = instanceMap[s.id] || {};
            return {
                id: s.id,
                name: d.name,
                shortDescription: d.shortDescription,
                description: d.description,
                details: d.details,
                tips: d.tips || [],
                points: d.points,
                level: d.level,
                duration: d.duration,
                category: d.category,
                joined: !!inst.id,
                completed: inst.completed || false,
                acceptedTimestamp: inst.acceptedTimestamp,
                membersAssigned: inst.members || []
            };
        });
    render(challenges);
}

function setupFilters() {
    document.getElementById('search-group-challenges').oninput = applyFilter;
    document.getElementById('filter-group-challenges').onchange = applyFilter;
    document.getElementById('filter-group-level').onchange = applyFilter;
}

function applyFilter() {
    const term = document.getElementById('search-group-challenges').value.toLowerCase();
    const status = document.getElementById('filter-group-challenges').value;
    const level = document.getElementById('filter-group-level').value;
    render(challenges.filter(c => {
        if (!c.name.toLowerCase().includes(term)) return false;
        if (status === 'joined' && !c.joined) return false;
        if (status === 'open' && (c.joined || c.completed)) return false;
        if (status === 'completed' && !c.completed) return false;
        if (level !== 'all' && c.level.toLowerCase() !== level) return false;
        return true;
    }));
}

function render(list) {
    const container = document.getElementById('group-cards-container');
    if (!list.length) {
        container.innerHTML = '<p class="no-results"><i class="fas fa-exclamation-circle"></i>No group challenges available</p>';
        return;
    }
    container.innerHTML = list.map(c => {
        const state = c.completed ? 'completed' : c.joined ? 'active' : '';
        return `
      <article class="card group-card ${state}" data-id="${c.id}">
        <div class="card-header">
          <h2>${c.name}</h2>
          <span class="tag ${c.level.toLowerCase()}">${c.level}</span>
          <button class="join-btn" data-id="${c.id}" ${c.joined?'disabled':''}>
            <i class="fas fa-check-circle"></i>
          </button>
        </div>
        <p>${c.shortDescription}</p>
      </article>
    `;
    }).join('');
    document.querySelectorAll('.join-btn').forEach(b => {
        b.onclick = e => { e.stopPropagation(); showDetails(b.dataset.id); };
    });
    document.querySelectorAll('.group-card').forEach(card => {
        card.onclick = () => showDetails(card.dataset.id);
    });
}

async function showDetails(id) {
    const c = challenges.find(x => x.id === id);
    const cont = document.getElementById('group-challenge-detail');
    let timerHtml = '';
    if (c.joined && !c.completed && c.acceptedTimestamp) {
        const start = c.acceptedTimestamp.toDate();
        const end = new Date(start.getTime() + c.duration*24*60*60*1000);
        const daysLeft = Math.ceil((end - Date.now())/(1000*60*60*24));
        timerHtml = `<p class="time-left"><i class="fa-solid fa-clock-rotate-left"></i> Time left: ${daysLeft>0?daysLeft+' days':'Expired'}</p>`;
    }
    cont.innerHTML = `
    <div class="detail-content">
      <div class="detail-header-group">
        <h2>${c.name}</h2>
        <div class="challenge-meta">
          <p class="meta-item"><i class="far fa-clock"></i>${c.duration} days</p>
          <p class="meta-item"><i class="fas fa-star"></i>${c.points} pts</p>
          <p class="meta-item meta-category">${c.category}</p>
        </div>
      </div>
      <div class="details-description">
        <h2>Description</h2>
        <p class="description-section">${c.description}</p>
        
        <div class="details-section-group"><h3><i class="fa-solid fa-circle-info"></i> Details</h3>
            ${c.details}
        </div>
      </div>
      <div class="tips-section"><h3><i class="fas fa-lightbulb"></i> Tips</h3>
        <ul class="tips-list">${c.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
      ${timerHtml}
      <div class="member-checklist"><h4>Assign to members</h4>
        ${memberInfos.map(m => `
          <label class="member-checkbox">
            <input type="checkbox" name="members" value="${m.id}" ${c.membersAssigned.includes(m.id)?'checked':''}>
            <span class="member-name">${m.name}</span>
          </label>
        `).join('')}
      </div>
      <div class="actions-section">
        ${!c.joined?'<button class="btn accept-challenge"><i class="fas fa-check-circle"></i> Join Challenge</button>':''}
        ${c.joined && !c.completed?'<button class="btn complete-challenge"><i class="fas fa-flag-checkered"></i> Mark as Completed</button>':''}
        ${c.completed?'<span class="completed-badge">Completed</span>':''}
      </div>
    </div>
  `;
    if (!c.joined) cont.querySelector('.accept-challenge').onclick = () => accept(id);
    if (c.joined && !c.completed) cont.querySelector('.complete-challenge').onclick = () => complete(id);
}

async function accept(challengeId) {
    const cont = document.getElementById('group-challenge-detail');
    const selected = Array.from(
        cont.querySelectorAll('input[name="members"]:checked')
    ).map(i => i.value);
    const membersToAssign = selected.length ? selected : members;

    await addDoc(
        collection(db, 'Groups', groupId, 'challenges'),
        {
            challengeId,
            acceptedTimestamp: serverTimestamp(),
            members: membersToAssign,
            completed: false,
            createdBy: auth.currentUser.uid
        }
    );

    const instSnaps = await getDocs(
        collection(db, 'Groups', groupId, 'challenges')
    );
    instanceMap = instSnaps.docs.reduce((m, s) => {
        const d = s.data();
        m[d.challengeId] = { id: s.id, ...d };
        return m;
    }, {});

    await loadChallenges();
    await showDetails(challengeId);
}

async function complete(challengeId) {
    const inst=instanceMap[challengeId];
    if(!inst||inst.completed) return;
    const ref=doc(db,'Groups',groupId,'challenges',inst.id);
    await updateDoc(ref,{
        completed:true,
        completedBy:auth.currentUser.uid,
        completedTimestamp:serverTimestamp()
    });
    inst.completed=true;

    const pts = challenges.find(c => c.id === challengeId).points || 0;
    await addPoints(pts);

    challenges.find(c=>c.id===challengeId).completed=true;
    render(challenges);
    await showDetails(challengeId);
}

window.addEventListener('hashchange', () => {
    if (location.hash.includes('groupchallenges')) initGroupChallenges();
});

initGroupChallenges();
