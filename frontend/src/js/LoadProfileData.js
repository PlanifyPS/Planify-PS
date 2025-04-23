import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from "../../../backend/utils/firebase_config.js";

export const loadUserProfile = async () => {
    const uid = JSON.parse(sessionStorage.getItem("uid"));
    if (!uid) return;

    try {
        console.log(uid);
        const userRef = doc(db, "Users", uid);
        console.log(userRef);
        const docSnap = await getDoc(userRef);
        console.log(docSnap);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("first_name").value = data.firstName || "";
            document.getElementById("last_name").value = data.lastName || "";
            document.getElementById("Phone_Number").value = data.phoneNumber || "";
            document.getElementById("address").value = data.address || "";
            document.getElementById("post_code").value = data.postCode || "";
            document.getElementById("email_address").value = data.UserEmail || "";
            document.getElementById("city").value = data.city || "";
            document.getElementById("Country").value = data.country || "";
        } else {
            console.log("No se encontraron datos del perfil.");
        }
    } catch (error) {
        console.error("Error cargando datos del perfil:", error);
    }
};
