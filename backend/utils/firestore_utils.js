import { db} from "./firebase_config.js";
import {
    deleteField,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";



export const saveUserData = async (uid, data) => {
    try {
        const userRef = doc(db, "Users", uid);
        await updateDoc(userRef, data);
        console.log("Datos actualizados correctamente.");
    } catch (error) {
        console.error("Error al guardar datos:", error);
    }
};

export async function getUserData(userUid) {
    const userRef = doc(db, "Users", userUid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data();
    }
    else{
        console.error("User data not found");
    }
}

export async function getGroupData(groupUID) {
    const groupRef = doc(db, "Groups", groupUID);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
        return groupSnap.data();
    }
    else{
        console.error("User data not found");
    }
}

export const deleteUserField = async (uid, fieldToRemove) => {
    await saveUserData(uid, {[fieldToRemove]: deleteField()});
}