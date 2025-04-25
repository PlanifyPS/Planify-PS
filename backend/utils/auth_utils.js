// js/auth_utils.js
import { auth, googleProvider, db, signOut } from "./firebase_config.js";
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
            points: 0, // Asignamos los puntos iniciales al usuario
            streak: 0,
            lastTaskDate: ""
        });

        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        sessionStorage.setItem("uid", userCredential.user.uid);

        // Cargar los datos del usuario (como los puntos) después del login
        const userData = await getUserData(userCredential.user.uid);
        if (userData) {
            console.log("User Data:", userData); // Mostrar los datos del usuario en consola, puedes eliminar esto después
        }

        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        sessionStorage.setItem("uid", result.user.uid);

        // Cargar los datos del usuario después de login con Google
        const userData = await getUserData(result.user.uid);
        if (userData) {
            console.log("User Data:", userData); // Mostrar los datos del usuario en consola, puedes eliminar esto después
        }

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
};
