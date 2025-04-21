import { db} from "./firebase_config.js";
import {doc, getDoc, setDoc, updateDoc} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";


export async function saveUserData(userCredential, data) {
    const userRef = doc(db, "Users", userCredential);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            await updateDoc(userRef, data);
        }else {
            await setDoc(userRef, data);
        }
    }catch (error) {
        console.error("Error saving user data in database: ", error);
    }
}

export async function getUserData(userCredential) {
    const userRef = doc(db, "Users", userCredential.user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data();
    }
    else{
        console.error("User data not found");
    }
}