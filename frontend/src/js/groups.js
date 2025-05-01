import { db } from '../../../backend/utils/firebase_config.js';
import { auth } from '../../../backend/utils/firebase_config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';
import {
    collection,
    addDoc,
    serverTimestamp,
    arrayUnion,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

let user = {};

export function initGroups() {
    const loadGroupsWhenReady = () => {
        onAuthStateChanged(auth, authUser => {
            if (authUser) {
                user = authUser;
                loadGroups();
            }
        });
    };

    if (document.readyState === 'complete') {
        loadGroupsWhenReady();
    } else {
        document.addEventListener('DOMContentLoaded', loadGroupsWhenReady);
    }
}

function loadGroups() {
    const groupsList = document.querySelector('.groups-list');
    if (groupsList) {
        groupsList.innerHTML = '<li class="loading-groups">Loading your groups...</li>';
    }
    displayUserGroups();
    loadDialog();
}

async function createNewGroup(name, description) {
    try {
        if (!user) throw new Error('You must be logged in to create a group');

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const groupRef = await addDoc(collection(db, 'Groups'), {
            name,
            description,
            createdBy: user.uid,
            members: [user.uid],
            inviteCode,
            challenges: [],
            habits: [],
            createdAt: serverTimestamp()
        });

        const userRef = doc(db, 'Users', user.uid);
        await updateDoc(userRef, { groups: arrayUnion(groupRef.id) });

        return { success: true, groupId: groupRef.id, inviteCode };
    } catch (error) {
        console.error('Error creating group:', error);
        return { success: false, error: error.message };
    }
}

async function joinExistingGroup(inviteCode) {
    try {
        if (!user) throw new Error('You must be logged in to join a group');

        const groupQuery = query(collection(db, 'Groups'), where('inviteCode', '==', inviteCode));
        const querySnapshot = await getDocs(groupQuery);
        if (querySnapshot.empty) throw new Error('Invalid invitation code');

        const groupDoc = querySnapshot.docs[0];
        const groupId = groupDoc.id;
        const groupData = groupDoc.data();
        if (groupData.members.includes(user.uid)) throw new Error('You are already a member of this group');

        const groupRef = doc(db, 'Groups', groupId);
        await updateDoc(groupRef, { members: arrayUnion(user.uid) });

        const userRef = doc(db, 'Users', user.uid);
        await updateDoc(userRef, { groups: arrayUnion(groupId) });

        return { success: true, groupName: groupData.name };
    } catch (error) {
        console.error('Error joining group:', error);
        return { success: false, error: error.message };
    }
}

async function displayUserGroups() {
    try {
        const groupsList = document.querySelector('.groups-list');
        if (!groupsList) return;

        if (!user || !user.uid) {
            groupsList.innerHTML = '<li class="no-groups">Please log in to view your groups</li>';
            return;
        }

        const userRef = doc(db, 'Users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            groupsList.innerHTML = '<li class="no-groups">User profile not found</li>';
            return;
        }

        const userData = userDoc.data();
        const userGroups = userData.groups || [];
        groupsList.innerHTML = '';

        if (userGroups.length === 0) {
            groupsList.innerHTML = '<li class="no-groups">You are not in any group yet</li>';
            return;
        }

        const groupPromises = userGroups.map(groupId => getDoc(doc(db, 'Groups', groupId)));
        const groupDocs = await Promise.all(groupPromises);

        groupDocs.forEach((groupDoc, index) => {
            if (!groupDoc.exists()) return;

            const groupId = userGroups[index];
            const groupData = groupDoc.data();
            const li = document.createElement('li');
            li.className = 'group-item';
            li.innerHTML = `
        <div class="group-info">
            <h3>${groupData.name}</h3>
            <p>${groupData.description || 'No description'}</p>
            <small>Members: ${groupData.members.length}</small>
            ${groupData.createdBy === user.uid ? `<small class="invite-code">Invite Code: ${groupData.inviteCode}</small>` : ''}
        </div>
        <div class="group-buttons">
            <button class="btn-view-group" data-id="${groupId}">View Group</button>
            <button class="btn-view-challenges" data-id="${groupId}">Challenges</button>
            <button class="btn-view-habits" data-id="${groupId}">Habits</button>
        </div>
        
    `;

            // Evento para el botón de "View Group"
            li.querySelector('.btn-view-group').addEventListener('click', () => {
                window.location.href = `#/group-information?id=${groupId}`;
            });

            // Evento para el botón de "Challenges"
            li.querySelector('.btn-view-challenges').addEventListener('click', () => {
                window.location.href = `#/groupChallenge?id=${groupId}`;
            });

            li.querySelector('.btn-view-habits').addEventListener('click', () => {
                window.location.href = `#/groupHabits?id=${groupId}`;
            });

            groupsList.appendChild(li);
        });

    } catch (error) {
        console.error('Error displaying groups:', error);
        const groupsList = document.querySelector('.groups-list');
        if (groupsList) {
            groupsList.innerHTML = '<li class="error-groups">Error loading groups. Please try again later.</li>';
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Could not load groups.'
        });
    }
}

function loadDialog() {
    const dialogAdd = document.getElementById('dialog-add-group');
    const dialogJoin = document.getElementById('dialog-join-group');
    const btnAddGroup = document.querySelector('.btn-add-group');
    const btnJoinGroup = document.querySelector('.btn-join-group');

    if (dialogAdd && btnAddGroup) {
        btnAddGroup.addEventListener('click', () => dialogAdd.showModal());

        const formAdd = dialogAdd.querySelector('form');
        if (formAdd) {
            formAdd.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = formAdd.groupName.value.trim();
                const desc = formAdd.groupDesc.value.trim();

                dialogAdd.close();
                if (!name || !desc) {
                    formAdd.reset();
                    await Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Please complete all fields before continuing.'
                    });
                    return;
                }

                Swal.fire({
                    title: 'Creating group...',
                    text: 'Please wait',
                    allowOutsideClick: false,
                    didOpen: Swal.showLoading
                });

                const result = await createNewGroup(name, desc);
                Swal.close();

                if (result.success) {
                    formAdd.reset();
                    await Swal.fire({
                        icon: 'success',
                        title: 'Group Created!',
                        text: `The group "${name}" has been created successfully.`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    displayUserGroups();
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error creating group',
                        text: result.error || 'An unexpected error occurred.'
                    });
                    dialogAdd.showModal();
                }
            });

            const cancelButton = dialogAdd.querySelector('button[value="cancel"]');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    dialogAdd.close();
                    formAdd.reset();
                });
            }
        }
    }

    if (dialogJoin && btnJoinGroup) {
        btnJoinGroup.addEventListener('click', () => dialogJoin.showModal());

        const formJoin = dialogJoin.querySelector('form');
        if (formJoin) {
            formJoin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const code = formJoin.inviteCode.value.trim();

                dialogJoin.close();
                if (!code) {
                    formJoin.reset();
                    await Swal.fire({
                        icon: 'error',
                        title: 'Missing Code',
                        text: 'You need to enter an invitation code to join.'
                    });
                    return;
                }

                Swal.fire({
                    title: 'Joining group...',
                    text: 'Please wait',
                    allowOutsideClick: false,
                    didOpen: Swal.showLoading
                });

                const result = await joinExistingGroup(code);
                Swal.close();

                if (result.success) {
                    formJoin.reset();
                    await Swal.fire({
                        icon: 'success',
                        title: 'Joined!',
                        text: `You have joined the group with code "${code}".`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    displayUserGroups();
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error joining group',
                        text: result.error || 'Cannot join the group.'
                    });
                    dialogJoin.showModal();
                }
            });

            const cancelButton = dialogJoin.querySelector('button[value="cancel"]');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    dialogJoin.close();
                    formJoin.reset();
                });
            }
        }
    }
}

initGroups();
