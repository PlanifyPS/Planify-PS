// JS/register.js
import { auth, db } from "../../../backend/firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-firestore.js";


if (document.body.id === 'register') {
    const logInBtn = document.getElementById("logIn");
    const signUpBtn = document.getElementById("signUp");
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");
    const container = document.querySelector(".container");

    logInBtn.addEventListener("click", () => {
        container.classList.remove("right-panel-active");
    });

    signUpBtn.addEventListener("click", () => {
        container.classList.add("right-panel-active");
    });

    // Registro de usuarios
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;
        const repeatPassword = document.getElementById("signup-repeat-password").value;

        if (password !== repeatPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Usuario registrado:", user);
            alert("Registro exitoso.");
        } catch (error) {
            console.error("Error al registrar usuario:", error.message);
            alert(error.message);
        }
    });

    // Inicio de sesión con registro en Firestore
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Usuario autenticado:", user);
            alert("Inicio de sesión exitoso.");

            // Guardar el inicio de sesión en Firestore
            await addDoc(collection(db, "logins", user.uid, "sessions"), {
                timestamp: serverTimestamp(),
                email: user.email
            });

        } catch (error) {
            console.error("Error al iniciar sesión:", error.message);
            alert(error.message);
        }
    });
}
