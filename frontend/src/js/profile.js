import { auth, db } from "../../../backend/utils/firebase_config.js";
import {
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.4.1/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.4.1/firebase-auth.js";
import {saveUserData} from "../../../backend/utils/firestore_utils.js";

const saveButton = document.getElementById("save-profile");

console.log("pRUEBA");
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("dentro");
        saveButton.addEventListener("click", async (e) => {
            e.preventDefault();

            console.log("dentro2");


            const updatedData = {
                firstName: document.getElementById("first_name").value.trim(),
                lastName: document.getElementById("last_name").value.trim(),
                phoneNumber: document.getElementById("Phone_Number").value.trim(),
                address: document.getElementById("address").value.trim(),
                postCode: document.getElementById("post_code").value.trim(),
                city: document.getElementById("city").value.trim(),
                country: document.getElementById("Country").value.trim(),
            };

            saveUserData(user.uid, updatedData);

        });
    } else {
        window.location.href = "/login.html";
    }
});

import { loadUserProfile } from "./LoadProfileData.js";


export function initProfile() {
    if (document.readyState === 'complete') {
        loadUserProfile();
        console.log("aqui estuve")
    } else {
        document.addEventListener('DOMContentLoaded', loadUserProfile);
    }
}

initProfile();