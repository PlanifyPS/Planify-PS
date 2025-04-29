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
            showError("All fields are required.");
            return;
        }

        if (password !== repeatPassword) {
            showError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters long.");
            return;
        }

        try {
            await registerUser(email, password, username);
            showSuccess("Registration successful. Redirecting...");
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
            showError("All fields are required.");
            return;
        }

        try {
            await loginUser(email, password);
            showSuccess("Login successful. Redirecting...");
        } catch (error) {
            showError(error.message);
        }
    });
}

if (googleLoginButton) {
    googleLoginButton.addEventListener("click", async () => {
        try {
            await loginWithGoogle();
            showSuccess("Google sign-in successful. Redirecting...");
        } catch (error) {
            showError(error.message);
        }
    });
}

function showSuccess(message, title = 'Success') {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'success',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'OK',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
    }).then(() => {
        window.location.href = "#/home";
    });
}

function showError(message, title = 'Error') {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'error',
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'OK',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
    });
}
