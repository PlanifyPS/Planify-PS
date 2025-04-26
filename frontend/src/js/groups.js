export function initGroups() {
    if (document.readyState === 'complete') {
        loadGroups();
    } else {
        document.addEventListener('DOMContentLoaded', loadGroups);
    }
}

function loadGroups() {
    loadDialog();
}

function loadDialog() {
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
                    text: 'Please complete all fields before continuing.',
                }).then(() => {
                    dialogAdd.showModal();
                    dialogAdd.style.display = 'block';
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Group Created!',
                    text: `The group "${name}" has been created successfully.`,
                    timer: 2000,
                    showConfirmButton: false
                });
                // TODO: real creation logic
            }
        }
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
        if (dialogJoin.returnValue === 'default') {
            if (!code) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Code',
                    text: 'You need to enter an invitation code to join.',
                }).then(() => {
                    dialogJoin.showModal();
                    dialogJoin.style.display = 'block';
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Joined!',
                    text: `You have joined the group with code "${code}".`,
                    timer: 2000,
                    showConfirmButton: false
                });
                // TODO: join-group logic
            }
        }

            dialogJoin.style.display = 'none';
            form.reset();
        });
    }
}

initGroups();
