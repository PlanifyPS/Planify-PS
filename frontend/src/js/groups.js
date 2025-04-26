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

        dialogAdd.style.display = 'none';
    });

    dialogJoin.addEventListener('close', () => {
        const form = dialogJoin.querySelector('form');
        const code = form.inviteCode.value.trim();

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
    });
}

initGroups();
