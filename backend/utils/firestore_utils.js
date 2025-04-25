// js/firestore_utils.js
import { db } from "./firebase_config.js";
import {
    deleteField,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

export const saveUserData = async (uid, data) => {
    try {
        const userRef = doc(db, "Users", uid);
        await setDoc(userRef, data, { merge: true }); // <-- usar setDoc con merge
        console.log("Datos guardados correctamente.");
    } catch (error) {
        console.error("Error al guardar datos:", error);
    }
};

export async function getUserData(userUid) {
    try {
        const userRef = doc(db, "Users", userUid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            console.error("Datos de usuario no encontrados");
            return null;
        }
    } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
        return null;
    }
}

export const deleteUserHabit = async (uid, habitId) => {
    await saveUserData(uid, { [habitId]: deleteField() });
};
