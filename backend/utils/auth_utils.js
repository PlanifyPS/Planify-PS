// js/auth_utils.js
import { auth, googleProvider,db, signOut } from "./firebase_config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc,setDoc,addDoc, collection}  from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

export const registerUser = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserInDataBase(email, username, password, userCredential);
        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        throw new Error(error.message);
    }
};
const createUserInDataBase = async (email, username, password, userCredential) =>{
    try {

        const userRef = doc(db, "Users", userCredential.user.uid);

        await setDoc(userRef, {
            Username: username,
            UserEmail: email,
            UserPassword: password,
        });
        console.log("Document written with ID: ", userCredential.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

export const handleLogout = async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = '#/register';

    } catch (error) {
        console.error('Error en logout:', error);
    }
}
