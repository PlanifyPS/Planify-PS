// JS/register.js
import { auth } from "../../../backend/firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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

    // Inicio de sesión
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Usuario autenticado:", user);
            alert("Inicio de sesión exitoso.");
        } catch (error) {
            console.error("Error al iniciar sesión:", error.message);
            alert(error.message);
        }
    });
}