import {db} from "./firebase_config.js";
import {
    addDoc,
    collection,
    deleteField,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

export const createUser = async(uid,data) =>{
    try {
        const userRef = doc(db, "Users", uid);
        await setDoc(userRef, data);
        console.log("Data updated successfully.");
    } catch (error) {
        console.error("Error saving data:", error);
    }
}

export const saveUserData = async (uid, data) => {
    try {
        const userRef = doc(db, "Users", uid);
        await updateDoc(userRef, data);
        console.log("Data updated successfully.");
    } catch (error) {
        console.error("Error saving data:", error);
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
    try {
        const forumRef = doc(db, "Forums", forumUid);
        await updateDoc(forumRef, data);
        console.log("Data updated successfully.");
    } catch (error) {
        console.error("Error saving data:", error);
    }
}

export async function initForum(forumUid, data) {
    try {
        const userRef = doc(db, "Forums", forumUid);
        await setDoc(userRef, data);
        console.log("Data updated successfully.");
    } catch (error) {
        console.error("Error saving data:", error);
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

            console.log(`Points updated in Firestore. Total: ${newPoints}`);
            return newPoints;
        } else {
            console.error("User not found in Firestore");
        }
    } catch (error) {
        console.error("Error adding points to user:", error);
    }
};

export async function sendForumMessage(forumId, senderUid, messageBody, senderName) {
    try {
        const messageRef = collection(db, "Forums", forumId, "messages");
        await addDoc(messageRef, {
            body:messageBody,
            sender: senderUid,
            senderName:senderName,
            timestamp: serverTimestamp(),
        });
    }catch (error) {
        console.error("Error saving messages:", error);
    }
}

export async function getForumMessagesFromFirebase(forumId) {
    try {
        const messageRef = collection(db, "Forums", forumId, "messages");
        const queryRef = query(messageRef, orderBy("timestamp", "asc"));
        return await getDocs(queryRef);
    }catch (error) {
        console.error("Error saving messages:", error);
    }
}
