// js/auth_utils.js
import { auth, googleProvider, db, signOut } from "./firebase_config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { saveUserData, getUserData } from "./firestore_utils.js";

export const registerUser = async (email, password, username) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserData(userCredential.user.uid, {
            userName:     username,
            email:        email,
            image:        'avatar1',
            points:       0,
            streak:       0,
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

        const userData = await getUserData(userCredential.user.uid);
        if (userData) {
            console.log("User Data:", userData);
        }

        return userCredential.user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user   = result.user;
        sessionStorage.setItem("uid", user.uid);

        const existing = await getUserData(user.uid);
        if (!existing) {
            await saveUserData(user.uid, {
                userName:     user.displayName || 'Google User',
                email:        user.email,
                image:        'avatar1',
                points:       0,
                streak:       0,
                lastTaskDate: ""
            });
            console.log("New Google user saved to Firestore");
        } else {
            console.log("Google user already exists:", existing);
        }

        return user;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const handleLogout = async () => {
    try {
        await signOut(auth);
        window.location.href = '#/register';
    } catch (error) {
        console.error('Error in logout:', error);
    }
};

export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw new Error(error.message);
    }
};
