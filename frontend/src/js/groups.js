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
    if (document.readyState === 'complete') {
        onAuthStateChanged(auth, authUser => {
            if (authUser) {
                user = authUser;
                loadGroups();
            } else {
                console.log('No user is signed in');
            }
        });
    } else {
        document.addEventListener('DOMContentLoaded', loadGroups);
    }
}

function loadGroups() {
    displayUserGroups();
    loadDialog();
}

async function createNewGroup(name, description) {
    try {
        if (!user) {
            throw new Error('You must be logged in to create a group');
        }

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const groupRef = await addDoc(collection(db, 'Groups'), {
            name,
            description,
            createdBy: user.uid,
            members: [user.uid],
            inviteCode,
            createdAt: serverTimestamp()
        });

        const userRef = doc(db, 'Users', user.uid);
        await updateDoc(userRef, { groups: arrayUnion(groupRef.id) });

        console.log('Group created successfully:', groupRef.id);
        return { success: true, groupId: groupRef.id, inviteCode };
    } catch (error) {
        console.error('Error creating group:', error);
        return { success: false, error: error.message };
    }
}

async function joinExistingGroup(inviteCode) {
    try {
        if (!user) {
            throw new Error('You must be logged in to join a group');
        }

        const groupQuery = query(
            collection(db, 'Groups'),
            where('inviteCode', '==', inviteCode)
        );
        const querySnapshot = await getDocs(groupQuery);
        if (querySnapshot.empty) {
            throw new Error('Invalid invitation code');
        }

        const groupDoc = querySnapshot.docs[0];
        const groupId = groupDoc.id;
        const groupData = groupDoc.data();
        if (groupData.members.includes(user.uid)) {
            throw new Error('You are already a member of this group');
        }

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
        const userRef = doc(db, 'Users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            console.log('User document not found');
            return;
        }

        const userData = userDoc.data();
        const userGroups = userData.groups || [];
        const groupsList = document.querySelector('.groups-list');
        groupsList.innerHTML = '';

        if (userGroups.length === 0) {
            groupsList.innerHTML = '<li class="no-groups">You are not in any group yet</li>';
            return;
        }

        for (const groupId of userGroups) {
            const groupRef = doc(db, 'Groups', groupId);
            const groupDoc = await getDoc(groupRef);
            if (!groupDoc.exists()) continue;

            const groupData = groupDoc.data();
            const li = document.createElement('li');
            li.className = 'group-item';
            li.innerHTML = `
        <div class="group-info">
          <h3>${groupData.name}</h3>
          <p>${groupData.description || 'No description'}</p>
          <small>Members: ${groupData.members.length}</small>
          ${
                groupData.createdBy === user.uid
                    ? `<small class="invite-code">Invite Code: ${groupData.inviteCode}</small>`
                    : ''
            }
        </div>
        <button class="btn-view-group" data-id="${groupId}">View Group</button>
      `;
            li.querySelector('.btn-view-group')
                .addEventListener('click', () => {
                    window.location.href = `#/group-information?id=${groupId}`;
                });
            groupsList.appendChild(li);
        }
    } catch (error) {
        console.error('Error displaying groups:', error);
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

    if (dialogAdd) {
        document.querySelector('.btn-add-group').addEventListener('click', () => {
            dialogAdd.showModal();
            dialogAdd.style.display = 'block';
        });

        dialogAdd.addEventListener('close', async () => {
            const form = dialogAdd.querySelector('form');
            const name = form.groupName.value.trim();
            const desc = form.groupDesc.value.trim();

            if (dialogAdd.returnValue === 'default') {
                if (!name || !desc) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Please complete all fields before continuing.'
                    });
                    dialogAdd.showModal();
                    dialogAdd.style.display = 'block';
                } else {
                    const result = await createNewGroup(name, desc);
                    if (result.success) {
                        await Swal.fire({
                            icon: 'success',
                            title: 'Group Created!',
                            text: `The group "${name}" has been created successfully.`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                        displayUserGroups();
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error creating group',
                            text: result.error || 'An unexpected error occurred.'
                        });
                    }
                }
            }

            dialogAdd.style.display = 'none';
            form.reset();
        });
    }

    if (dialogJoin) {
        document.querySelector('.btn-join-group').addEventListener('click', () => {
            dialogJoin.showModal();
            dialogJoin.style.display = 'block';
        });

        dialogJoin.addEventListener('close', async () => {
            const form = dialogJoin.querySelector('form');
            const code = form.inviteCode.value.trim();

            if (dialogJoin.returnValue === 'default') {
                if (!code) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Missing Code',
                        text: 'You need to enter an invitation code to join.'
                    });
                    dialogJoin.showModal();
                    dialogJoin.style.display = 'block';
                } else {
                    const result = await joinExistingGroup(code);
                    if (result.success) {
                        await Swal.fire({
                            icon: 'success',
                            title: 'Joined!',
                            text: `You have joined the group with code "${code}".`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                        displayUserGroups();
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error joining group',
                            text: result.error || 'Cannot join the group.'
                        });
                    }
                }
            }

            dialogJoin.style.display = 'none';
            form.reset();
        });
    }
}

initGroups();
