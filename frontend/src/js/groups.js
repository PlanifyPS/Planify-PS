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

    btnAdd.addEventListener('click', () => {
        dialogAdd.showModal();
        dialogAdd.style.display = 'block';
    });

    btnJoin.addEventListener('click', () => {
        dialogJoin.showModal();
        dialogJoin.style.display = 'block';
    });

    dialogAdd.addEventListener('close', () => {
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
                Swal.fire({
                    icon: 'success',
                    title: '¡Grupo creado!',
                    text: `El grupo "${name}" ha sido creado correctamente.`,
                    timer: 2000,
                    showConfirmButton: false
                });
                //TODO: lógica real de creación
            }
        }

        dialogAdd.style.display = 'none';
    });

    dialogJoin.addEventListener('close', () => {
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
                Swal.fire({
                    icon: 'success',
                    title: '¡Te has unido!',
                    text: `Te has unido al grupo con el código "${code}".`,
                    timer: 2000,
                    showConfirmButton: false
                });
                //TODO: lógica de unirse al grupo
            }
        }

        dialogJoin.style.display = 'none';
    });
}

initGroups();
