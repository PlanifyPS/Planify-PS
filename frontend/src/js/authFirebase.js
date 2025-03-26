// js/authFirebase.js
import { registerUser, loginUser, loginWithGoogle } from "../../../backend/utils/auth_utils.js";

// Elementos del DOM
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const googleLoginButton = document.getElementById("google-login");

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("signup-email").value.trim();
        const username = document.getElementById("signup-username").value.trim();
        const password = document.getElementById("signup-password").value.trim();
        const repeatPassword = document.getElementById("signup-repeat-password").value.trim();

        if (!email || !password || !repeatPassword || !username) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        if (password !== repeatPassword) {
            showError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            showError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            await registerUser(email, password, username);
            showSuccess("Registro exitoso. Redirigiendo...");
        } catch (error) {
            showError(error.message);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        if (!email || !password) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        try {
            await loginUser(email, password);
            showSuccess("Inicio de sesión exitoso. Redirigiendo...");
        } catch (error) {
            showError(error.message);
        }
    });
}

if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
        try {
            await loginWithGoogle();
            showSuccess("Inicio de sesión con Google exitoso. Redirigiendo...");
            window.location.href = "/";
        } catch (error) {
            showError(error.message);
        }
    });
}