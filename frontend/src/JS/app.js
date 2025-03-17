// JS/app.js
import { registerUser, loginUser, loginWithGoogle } from "../../../backend/auth.js";

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const googleLoginButton = document.getElementById("google-login");

const redirectToHome = () => {
    window.location.href = "/home.html";
};

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
            redirectToHome();
        } catch (error) {
            alert(error.message);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            await loginUser(email, password);
            alert("Inicio de sesión exitoso.");
            redirectToHome();
        } catch (error) {
            alert(error.message);
        }
    });
}

if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
        try {
            await loginWithGoogle();
            alert("Inicio de sesión con Google exitoso.");
            redirectToHome();
        } catch (error) {
            alert(error.message);
        }
    });
}