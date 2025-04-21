// js/auth_utils.js
import { auth, googleProvider,db, signOut } from "./firebase_config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {saveUserData} from "./firestore_utils.js";

export const registerUser = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(userCredential, {
            userName: username,
            email: email,
        });

        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        sessionStorage.setItem("uid", JSON.stringify(userCredential.user.uid));
        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        sessionStorage.setItem("uid", JSON.stringify(result.user.uid));
        return result.user;
    } catch (error) {
        throw new Error(error.message);
    }
};


export const handleLogout = async () => {
    try {
        await signOut(auth);
        window.location.href = '#/register';

    } catch (error) {
        console.error('Error en logout:', error);
    }
}