import { db} from "./firebase_config.js";
import {
    collection,
    deleteField,
    doc,
    getDoc, getDocs, setDoc,
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


export async function getForum(forumUid) {
    const forumRef = doc(db, "Forums", forumUid);
    const forumSnap = await getDoc(forumRef);

    if (forumSnap.exists()) {
        return forumSnap.data();
    }
    else{
        console.error("Forum data not found");
    }
}

export async function saveForumUser(forumUid,data) {
    console.log(data);
    console.log(forumUid)
    try {
        const forumRef = doc(db, "Forums", forumUid);
        await updateDoc(forumRef, data);
        console.log("Datos actualizados correctamente.");
    } catch (error) {
        console.error("Error al guardar datos:", error);
    }
}

export async function initForum(forumUid, data) {
    try {
        const userRef = doc(db, "Forums", forumUid);
        await setDoc(userRef, data);
        
        console.log("Datos actualizados correctamente.");
    } catch (error) {
        console.error("Error al guardar datos:", error);
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

export async function getAllDocumentsFromCollection(collectionName) {
    try {
        const colRef = collection(db, collectionName);
        const colSnap = await getDocs(colRef);

        const docs = [];
        colSnap.forEach(doc => {
            docs.push({id:doc.id, ...doc.data()});
        });
        return docs;
    }catch (error) {
        console.error("Error getAllDocumentsFromCollection:", error);
    }
}

export const addPointsToUser = async (uid, pointsToAdd) => {
    try {
        const userRef = doc(db, "Users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const currentPoints = userSnap.data().points || 0;
            const newPoints = currentPoints + pointsToAdd;

            await updateDoc(userRef, { points: newPoints });

            console.log(`Puntos actualizados en Firestore. Total: ${newPoints}`);
            return newPoints;
        } else {
            console.error("Usuario no encontrado en Firestore");
        }
    } catch (error) {
        console.error("Error al añadir puntos al usuario:", error);
    }
};