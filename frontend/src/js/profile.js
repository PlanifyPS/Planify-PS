// frontend/src/js/profile.js
import { auth, db } from "../../../backend/utils/firebase_config.js";
import {
    doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { loadUserProfile } from "../../../backend/utils/LoadProfileData.js";

const avatarList = ['avatar1','avatar2','avatar3','avatar4','avatar5'];

let currentUserUid = null;
let selectedAvatar = null;

export function initProfile() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "#/register";
            return;
        }
        currentUserUid = user.uid;
        await loadUserProfile();

        const snap = await getDoc(doc(db, "Users", currentUserUid));
        if (snap.exists()) {
            selectedAvatar = snap.data().image || avatarList[0];
        } else {
            selectedAvatar = avatarList[0];
        }
        document.getElementById("profile-avatar")
            .src = `/frontend/public/assets/${selectedAvatar}.webp`;

        initAvatarDialog();
        initProfileForm();
    });
}

function initAvatarDialog() {
    const dialog    = document.getElementById("avatar-dialog");
    const btnOpen   = document.getElementById("change-avatar-btn");
    const btnCancel   = document.getElementById("cancel-button");
    const grid      = document.getElementById("avatar-options");
    const btnSave   = document.getElementById("avatar-save-btn");

    avatarList.forEach(name => {
        const img = document.createElement("img");
        img.src           = `/frontend/public/assets/${name}.webp`;
        img.dataset.name  = name;
        if (name === selectedAvatar) img.classList.add("selected");
        img.addEventListener("click", () => {
            grid.querySelectorAll("img").forEach(i => i.classList.remove("selected"));
            img.classList.add("selected");
            selectedAvatar = name;
        });
        grid.appendChild(img);
    });

    btnOpen.addEventListener("click", () => dialog.showModal());

    btnCancel.addEventListener("click", e => {
        e.preventDefault();
        dialog.style.display = 'none';
        dialog.close();
    });

    btnSave.addEventListener("click", () => {
        document.getElementById("profile-avatar")
            .src = `/frontend/public/assets/${selectedAvatar}.webp`;
        dialog.style.display = 'none';
        dialog.close();
    });
}

function initProfileForm() {
    const saveBtn = document.getElementById("save-profile");

    saveBtn.addEventListener("click", async e => {
        e.preventDefault();
        if (!currentUserUid) return;

        const updatedData = {
            firstName:   document.getElementById("first_name").value.trim(),
            lastName:    document.getElementById("last_name").value.trim(),
            phoneNumber: document.getElementById("Phone_Number").value.trim(),
            address:     document.getElementById("address").value.trim(),
            postCode:    document.getElementById("post_code").value.trim(),
            city:        document.getElementById("city").value.trim(),
            country:     document.getElementById("Country").value.trim(),
            UserEmail:   document.getElementById("email_address").value.trim(),
            image:       selectedAvatar
        };

        await updateDoc(doc(db, "Users", currentUserUid), updatedData);

        Swal.fire({
            icon: 'success',
            title: 'Profile Updated',
            timer: 1500,
            showConfirmButton: false
        });

        initHeader();
    });
}

initProfile();
