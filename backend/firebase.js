// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCdglQenmZHjyETJKf-JYhLC5M65NRX8yA",
    authDomain: "planify-ps.firebaseapp.com",
    projectId: "planify-ps",
    storageBucket: "planify-ps.firebasestorage.app",
    messagingSenderId: "171520075566",
    appId: "1:171520075566:web:c08de2caa9a6e588d7fcbf",
    measurementId: "G-WENQ178MXY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log(app);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };