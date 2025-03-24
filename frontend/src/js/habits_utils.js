// js/habits_utils.js
import { db } from "./firebase_config.js";
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-firestore.js";

// Agregar un hábito a la subcolección "habits" del usuario
export const addHabit = async (userId, habitTitle, points) => {
    try {
        const habitRef = collection(db, "Users", userId, "habits");
        await addDoc(habitRef, {
            title: habitTitle,
            createdAt: new Date().toISOString(),
            points: points
        });

        // Sumar puntos al usuario
        const userRef = doc(db, "Users", userId);
        await setDoc(userRef, { points: points }, { merge: true });

        console.log("Hábito añadido correctamente y puntos actualizados.");
    } catch (error) {
        console.error("Error añadiendo hábito:", error);
    }
};

// Obtener todos los hábitos de un usuario
export const getUserHabits = async (userId) => {
    try {
        const habitsRef = collection(db, "Users", userId, "habits");
        const querySnapshot = await getDocs(habitsRef);

        let habits = [];
        querySnapshot.forEach((doc) => {
            habits.push({ id: doc.id, ...doc.data() });
        });

        console.log("Hábitos del usuario:", habits);
        return habits;
    } catch (error) {
        console.error("Error obteniendo hábitos:", error);
    }
};

// Eliminar un hábito específico de un usuario
export const deleteHabit = async (userId, habitId) => {
    try {
        const habitRef = doc(db, "Users", userId, "habits", habitId);
        await deleteDoc(habitRef);
        console.log("Hábito eliminado correctamente.");
    } catch (error) {
        console.error("Error eliminando hábito:", error);
    }
};
