// firebase.js

// Importa Firebase desde el CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCdglQenmZHjyETJKf-JYhLC5M65NRX8yA",
    authDomain: "planify-ps.firebaseapp.com",
    projectId: "planify-ps",
    storageBucket: "planify-ps.firebasestorage.app",
    messagingSenderId: "171520075566",
    appId: "1:171520075566:web:c08de2caa9a6e588d7fcbf",
    measurementId: "G-WENQ178MXY"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
console.log(app);

// Obtén las instancias de Auth y Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
