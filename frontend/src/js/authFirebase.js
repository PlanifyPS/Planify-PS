// js/authFirebase.js
import { registerUser, loginUser, loginWithGoogle, handleLogout } from "../../../backend/utils/auth_utils.js";

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
        } catch (error) {
            showError(error.message);
        }
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

function showSuccess(message, title = 'Éxito') {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'success',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Entendido',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
    }).then(isConfirm => {window.location.href = "#/home";});
}

function showError(message, title = 'Error') {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'error',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Entendido',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
    });
}