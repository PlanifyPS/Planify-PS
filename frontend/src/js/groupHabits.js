import { auth, db } from '../../../backend/utils/firebase_config.js';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    getDoc,
    addDoc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import { getUserData, saveUserData, deleteUserField } from '../../../backend/utils/firestore_utils.js';
import { deleteDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { addPoints } from './points.js';


let groupId, members = [], memberInfos = [], instanceMap = {}, definitions = {},  habits = [];

export function initGroupHabits() {
    onAuthStateChanged(auth, async user => {
        initModal();
        setupFilters();
        if (!user) return window.location.href = '#/register';
        const params = new URLSearchParams(location.hash.split('?')[1] || '');
        groupId = params.get('id');
        const grpSnap = await getDoc(doc(db, 'Groups', groupId));
        members = grpSnap.exists() ? grpSnap.data().members || [] : [];
        memberInfos = await Promise.all(
            members.map(async uid => {
                const u = await getDoc(doc(db, 'Users', uid));
                return { id: uid, name: u.exists() ? (u.data().name || u.data().email) : 'Unknown' };
            })
        );
        const instSnaps = await getDocs(collection(db, 'Groups', groupId, 'habits'));
        instanceMap = instSnaps.docs.reduce((m, s) => {
            const d = s.data();
            m[d.habitId] = { id: s.id, ...d };
            return m;
        }, {});

        await loadDefinitions();
        renderHabits();
    });
}

async function loadDefinitions() {
    const defsSnap = await getDocs(collection(db, 'Groups', groupId, 'habitDefinitions'));
    definitions = defsSnap.docs.reduce((m, d) => {
        m[d.id] = d.data();
        return m;
    }, {});
}

function setupFilters() {
    document.getElementById('search-HabitsTasks').oninput = () => renderHabits();
    document.querySelectorAll('input[name="category-filter"]').forEach(radio =>
        radio.onchange = () => renderHabits()
    );
}

function renderHabits() {
    const search = document.getElementById('search-HabitsTasks').value.trim().toLowerCase();
    const cat = document.querySelector('input[name="category-filter"]:checked').value;
    habits = Object.entries(definitions)
        .filter(([id,d]) => {
            if (cat !== 'all' && d.category !== cat) return false;
            const text = (d.title + ' ' + d.description).toLowerCase();
            if (search && !text.includes(search)) return false;
            return true;
        })
        .map(([id, d]) => {
            const inst = instanceMap[id] || {};
            return {
                id,
                title: d.title,
                description: d.description,
                frequency: d.frequency,
                category: d.category,
                points: d.points,
                joined: !!inst.id,
                completed: inst.completed || false,
                membersAssigned: inst.members || []
            };
        });

    const container = document.getElementById('group-habits-cards');
    if (!habits.length) {
        container.innerHTML = `
      <p class="no-results"><i class="fas fa-exclamation-circle"></i>No group habits</p>`;
    } else {
        container.innerHTML = habits.map(h => {
            const state = h.completed ? 'completed' : h.joined ? 'active' : '';
            return `
      <article class="card group-card ${state}" data-id="${h.id}">
        <div class="card-header">
          <h2>${h.title}</h2>
          <span class="tag ${h.frequency.toLowerCase()}">${h.frequency}</span>
          <button class="delete-card-btn" data-id="${h.id}" title="Eliminar hábito">
            <i class="fas fa-trash"></i>
          </button>
          <button class="join-btn" data-id="${h.id}" ${h.joined?'disabled':''}>
            <i class="fas fa-check-circle"></i>
          </button>
        </div>
        <p>${h.description}</p>
      </article>`;
        }).join('');
    }

    container.querySelectorAll('.join-btn')
        .forEach(b => b.onclick = e => { e.stopPropagation(); showHabitDetails(b.dataset.id); });
    container.querySelectorAll('.delete-card-btn')
        .forEach(b => b.onclick = async e => {
            e.stopPropagation();
            const id = b.dataset.id;
            if (!confirm('¿Seguro que quieres eliminar este hábito?')) return;
            await deleteHabitDefinition(id);
        });


    container.querySelectorAll('.group-card')
        .forEach(card => card.onclick = () => showHabitDetails(card.dataset.id));
}

function showHabitDetails(id) {
    const h = habits.find(x => x.id === id);
    const cont = document.getElementById('group-habit-detail');
    let html = `
    <div class="detail-content">
      <div class="detail-header-group">
        <h2>${h.title}</h2>
        <div class="habit-meta">
          <p class="meta-item"><i class="far fa-sync-alt"></i>${h.frequency}</p>
          <p class="meta-item"><i class="fas fa-star"></i>${h.points} pts</p>
          <p class="meta-item meta-category">${h.category}</p>
        </div>
      </div>
      <div class="details-description">
        <h3>Description</h3><p>${h.description}</p>
      </div>
      <div class="member-checklist">
        <h4>Assign to members</h4>
        ${memberInfos.map(m=>`
          <label class="member-checkbox">
            <input type="checkbox" name="members" value="${m.id}"
              ${h.membersAssigned.includes(m.id)?'checked':''}>
            <span class="member-name">${m.name}</span>
          </label>
        `).join('')}
      </div>
      <div class="actions-section">`;

    if (!h.joined)      html += `<button class="btn accept-habit">Join Habit</button>`;
    else if (!h.completed) html += `<button class="btn complete-habit">Mark as Completed</button>`;
    else                   html += `<span class="completed-badge">Completed</span>`;
    html += `
       <button class="btn edit-habit">Edit</button>
        <button class="btn delete-habit">Delete</button>`;

    html += `</div></div>`;
    cont.innerHTML = html;
    cont.querySelector('.edit-habit').onclick = () => startEditingHabit(id);
    cont.querySelector('.delete-habit').onclick = () => deleteHabitDefinition(id);

    if (!h.joined)      cont.querySelector('.accept-habit').onclick  = () => acceptHabit(id);
    else if (!h.completed) cont.querySelector('.complete-habit').onclick = () => completeHabit(id);
}

let editingHabitId = null;

function startEditingHabit(habitId) {
    editingHabitId = habitId;
    const def = definitions[habitId];
    document.getElementById('NewHabitTitle').value       = def.title;
    document.getElementById('HabitDescription').value    = def.description;
    document.getElementById('HabitFrequency').value      = def.frequency;
    document.getElementById('HabitCategory').value       = def.category;
    document.getElementById('AddHabitModal').style.display = 'flex';
}

async function deleteHabitDefinition(habitId) {
    delete definitions[habitId];
    delete instanceMap[habitId];
    renderHabits();
    document.getElementById('group-habit-detail').innerHTML = `...`;

    await deleteUserField(auth.currentUser.uid, `habits.${habitId}`);
    const inst = instanceMap[habitId];
    if (inst && inst.id) {
        await deleteDoc(doc(db, 'Groups', groupId, 'habits', inst.id));
    }
    await loadDefinitions();
    const snaps = await getDocs(collection(db, 'Groups', groupId, 'habits'));
    instanceMap = snaps.docs.reduce((m, s) => {
        const d = s.data();
        m[d.habitId] = { id: s.id, ...d };
        return m;
    }, {});
    renderHabits();
    document.getElementById('group-habit-detail').innerHTML = `
     <div class="empty-detail-group">
       <i class="fas fa-people-arrows"></i>
       <h2>Select a Group Habit</h2>
       <p>Click one to see details and join!</p>
     </div>`;
}



async function acceptHabit(habitId) {
    const selected = Array.from(
        document.querySelectorAll('#group-habit-detail input[name="members"]:checked')
    ).map(i => i.value);
    const membersToAssign = selected;

    await addDoc(
        collection(db,'Groups',groupId,'habits'),
        {
            habitId,
            acceptedTimestamp: serverTimestamp(),
            members: membersToAssign,
            completed: false,
            createdBy: auth.currentUser.uid
        }
    );
    const snaps = await getDocs(collection(db,'Groups',groupId,'habits'));
    instanceMap = snaps.docs.reduce((m,s)=>{ const d=s.data(); m[d.habitId]={id:s.id,...d}; return m; }, {});
    await loadDefinitions();
    renderHabits();
    showHabitDetails(habitId);
}

async function completeHabit(habitId) {
    const inst = instanceMap[habitId];
    if (!inst||inst.completed) return;
    const ref = doc(db,'Groups',groupId,'habits',inst.id);
    await updateDoc(ref,{
        completed: true,
        completedBy: auth.currentUser.uid,
        completedTimestamp: serverTimestamp(),
        members: [ auth.currentUser.uid ]
    });
    const pts = habits.find(h=>h.id===habitId).points || 0;
    await addPoints(pts);
    instanceMap[habitId].completed = true;
    renderHabits();
    showHabitDetails(habitId);
}

function initModal() {
    const modal = document.getElementById('AddHabitModal');
    document.getElementById('add-button').onclick = () => modal.style.display = 'flex';
    document.getElementById('closeHabitButton').onclick = () => { modal.style.display='none'; clearInputs(); };
    document.getElementById('saveHabit').onclick  = () => saveHabit();

}

function clearInputs() {
    ['NewHabitTitle','HabitDescription'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('HabitFrequency').value = 'daily';
    document.getElementById('HabitCategory').value = 'Wellness';
}

async function saveHabit() {
    const title       = document.getElementById('NewHabitTitle').value.trim();
    const description = document.getElementById('HabitDescription').value.trim();
    const frequency   = document.getElementById('HabitFrequency').value;
    const category    = document.getElementById('HabitCategory').value;
    if (!title || !description) {
        return alert('Complete todos los campos.');
    }

    const habitId = editingHabitId || crypto.randomUUID();
    const newHabit = { title, description, frequency, category, points: 1, groupId };
    await setDoc(
        doc(db, 'Groups', groupId, 'habitDefinitions', habitId),
        newHabit
    );
    await saveUserData(auth.currentUser.uid, { [`habits.${habitId}`]: { ...newHabit, groupId } });

    editingHabitId = null;
    document.getElementById('AddHabitModal').style.display = 'none';
    clearInputs();
    await loadDefinitions();
    renderHabits();

}

window.addEventListener('hashchange', () => {
    if (location.hash.includes('grouphabits')) initGroupHabits();
});

initGroupHabits();
