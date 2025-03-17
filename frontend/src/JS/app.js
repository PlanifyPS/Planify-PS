// JS/app.js
import { registerUser, loginUser } from "../../../backend/auth.js";

// Elementos del DOM
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");

// Registro de usuario
if (signupForm) {
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
            await registerUser(email, password);
            alert("Registro exitoso.");
        } catch (error) {
            alert(error.message);
        }
    });
}

// Inicio de sesión
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            await loginUser(email, password);
            alert("Inicio de sesión exitoso.");
        } catch (error) {
            alert(error.message);
        }
    });
}