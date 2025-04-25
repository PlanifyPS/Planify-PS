import {
    db
} from '../../../backend/utils/firebase_config.js';
import {
    auth
} from '../../../backend/utils/firebase_config.js';
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
}from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

export function initGroups() {
    if (document.readyState === 'complete') {
        loadGroups();
    } else {
        document.addEventListener('DOMContentLoaded', loadGroups);
    }
}

function loadGroups() {
    loadDialogs();
    displayUserGroups();
}

async function createNewGroup(name, description) {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('Debes iniciar sesión para crear un grupo');
        }

        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const groupRef = await addDoc(collection(db, 'Groups'), {
            name: name,
            description: description,
            createdBy: user.uid,
            members: [user.uid],
            inviteCode: inviteCode,
            createdAt: serverTimestamp()
        });

        const userRef = doc(db, 'Users', user.uid);
        await updateDoc(userRef, {
            groups: arrayUnion(groupRef.id)
        });

        console.log('Grupo creado exitosamente:', groupRef.id);
        return {
            success: true,
            groupId: groupRef.id,
            inviteCode: inviteCode
        };
    } catch (error) {
        console.error('Error al crear grupo:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function joinExistingGroup(inviteCode) {
    try {
        const user = auth.currentUser;

        if (!user) {
            throw new Error('Debes iniciar sesión para unirte a un grupo');
        }

        const groupQuery = query(
            collection(db, 'Groups'),
            where('inviteCode', '==', inviteCode)
        );

        const querySnapshot = await getDocs(groupQuery);

        if (querySnapshot.empty) {
            throw new Error('Código de invitación inválido');
        }

        const groupDoc = querySnapshot.docs[0];
        const groupId = groupDoc.id;
        const groupData = groupDoc.data();

        if (groupData.members.includes(user.uid)) {
            throw new Error('Ya eres miembro de este grupo');
        }

        const groupRef = doc(db, 'Groups', groupId);
        await updateDoc(groupRef, {
            members: arrayUnion(user.uid)
        });

        const userRef = doc(db, 'Users', user.uid);
        await updateDoc(userRef, {
            groups: arrayUnion(groupId)
        });

        return {
            success: true,
            groupName: groupData.name
        };
    } catch (error) {
        console.error('Error al unirse al grupo:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function displayUserGroups() {
    try {
        const user = auth.currentUser;

        if (!user) {
            console.log('No hay usuario conectado');
            return;
        }

        const userRef = doc(db, 'Users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            console.log('No se encontró el documento del usuario');
            return;
        }

        const userData = userDoc.data();
        const userGroups = userData.groups || [];
        const groupsList = document.querySelector('.groups-list');

        groupsList.innerHTML = '';

        if (userGroups.length === 0) {
            groupsList.innerHTML = '<li class="no-groups">No estás en ningún grupo aún</li>';
            return;
        }

        for (const groupId of userGroups) {
            const groupRef = doc(db, 'Groups', groupId);
            const groupDoc = await getDoc(groupRef);

            if (groupDoc.exists()) {
                const groupData = groupDoc.data();

                // Crear elemento de lista
                const li = document.createElement('li');
                li.className = 'group-item';
                li.innerHTML = `
                    <div class="group-info">
                        <h3>${groupData.name}</h3>
                        <p>${groupData.description || 'Sin descripción'}</p>
                        <small>Miembros: ${groupData.members.length}</small>
                        ${groupData.createdBy === user.uid ?
                    `<small class="invite-code">Código de invitación: ${groupData.inviteCode}</small>` : ''}
                    </div>
                    <button class="btn-view-group" data-id="${groupId}">Ver grupo</button>
                `;

                const btnView = li.querySelector('.btn-view-group');
                btnView.addEventListener('click', () => {
                    window.location.href = `group.html?id=${groupId}`;
                });

                groupsList.appendChild(li);
            }
        }
    } catch (error) {
        console.error('Error al mostrar grupos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los grupos.'
        });
    }
}

function loadDialogs() {
    const btnAdd = document.querySelector('.btn-add-group');
    const btnJoin = document.querySelector('.btn-join-group');
    const dialogAdd = document.getElementById('dialog-add-group');
    const dialogJoin = document.getElementById('dialog-join-group');

    console.log('btnAdd:', btnAdd);
    console.log('btnJoin:', btnJoin);
    console.log('dialogAdd:', dialogAdd);
    console.log('dialogJoin:', dialogJoin);

    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            dialogAdd.showModal();
            dialogAdd.style.display = 'block';
            console.log('Botón Add clickeado');
        });
    }

    if (btnJoin) {
        btnJoin.addEventListener('click', () => {
            dialogJoin.showModal();
            dialogJoin.style.display = 'block';
            console.log('Botón Join clickeado');
        });
    }

    if (dialogAdd) {
        dialogAdd.addEventListener('close', async () => {
            const form = dialogAdd.querySelector('form');
            const name = form.groupName.value.trim();
            const desc = form.groupDesc.value.trim();

            if (dialogAdd.returnValue === 'default') {
                if (!name || !desc) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'Por favor completa todos los campos antes de continuar.',
                    }).then(() => {
                        dialogAdd.showModal();
                        dialogAdd.style.display = 'block';
                    });
                } else {
                    const result = await createNewGroup(name, desc);

                    if (result.success) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Grupo creado!',
                            text: `El grupo "${name}" ha sido creado correctamente. Código de invitación: ${result.inviteCode}`,
                            timer: 3000,
                            showConfirmButton: true
                        });

                        displayUserGroups();
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al crear grupo',
                            text: result.error || 'Ha ocurrido un error inesperado'
                        });
                    }
                }
            }

            dialogAdd.style.display = 'none';
            form.reset();
        });
    }

    if (dialogJoin) {
        dialogJoin.addEventListener('close', async () => {
            const form = dialogJoin.querySelector('form');
            const code = form.inviteCode.value.trim();

            if (dialogJoin.returnValue === 'default') {
                if (!code) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Código faltante',
                        text: 'Necesitas ingresar un código de invitación para unirte.',
                    }).then(() => {
                        dialogJoin.showModal();
                        dialogJoin.style.display = 'block';
                    });
                } else {
                    const result = await joinExistingGroup(code);

                    if (result.success) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Te has unido!',
                            text: `Te has unido al grupo "${result.groupName}".`,
                            showConfirmButton: false
                        });

                        displayUserGroups();
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al unirse',
                            text: result.error || 'No se pudo unir al grupo'
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