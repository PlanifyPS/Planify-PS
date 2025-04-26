// js/firebase_config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCdglQenmZHjyETJKf-JYhLC5M65NRX8yA",
    authDomain: "planify-ps.firebaseapp.com",
    projectId: "planify-ps",
    storageBucket: "planify-ps.firebasestorage.app",
    messagingSenderId: "171520075566",
    appId: "1:171520075566:web:c08de2caa9a6e588d7fcbf",
    measurementId: "G-WENQ178MXY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signOut };
