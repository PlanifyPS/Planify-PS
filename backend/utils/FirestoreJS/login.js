import { loginUser } from "./auth_utils.js";
import { getUserData } from "./firestore_utils.js";

const handleLogin = async () => {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;

    try {
        const user = await loginUser(email, password);
        const userData = await getUserData(user.uid);

        if (userData && userData.points !== undefined) {
            const pointsEl = document.getElementById("userPoints");
            if (pointsEl) pointsEl.textContent = `Points: ${userData.points}`;
        }

        window.location.hash = "#/home"; // o lo que uses para navegación

    } catch (error) {
        console.error("Error to login:", error.message);
    }
};
