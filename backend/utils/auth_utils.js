// js/auth_utils.js
import { auth, googleProvider, signOut } from "./firebase_config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { saveUserData, getUserData } from "./firestore_utils.js";

export const registerUser = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(userCredential.user.uid, {
            userName: username,
            email: email,
            points: 0 // empieza con 0 puntos al registrar
        });
        sessionStorage.setItem("uid", userCredential.user.uid);
        sessionStorage.setItem("points", 0);
        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        sessionStorage.setItem("uid", uid);

        const userData = await getUserData(uid);
        const points = userData?.points ?? 0;
        sessionStorage.setItem("points", points);

        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const uid = result.user.uid;
        sessionStorage.setItem("uid", uid);

        const userData = await getUserData(uid);
        const points = userData?.points ?? 0;
        sessionStorage.setItem("points", points);

        return result.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const handleLogout = async () => {
    try {
        await signOut(auth);
        sessionStorage.clear();
        window.location.href = '#/register';
    } catch (error) {
        console.error('Error en logout:', error);
    }
};
