import {deleteUserField, getUserData, saveUserData} from "../../../backend/utils/firestore_utils.js";
import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {db} from "/backend/utils/firebase_config.js";

const userUID = sessionStorage.getItem("uid");
let habitsData;
let editingHabitId = null;

function initHome() {
    if (document.readyState === 'complete') {
        initTextContent();
        initModal();
        loadUserHabit().then();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initTextContent();
            initModal();
            loadUserHabit().then();
        });
    }
}

function initTextContent() {
    document.getElementById("TitleHabitsTasks").textContent = "Habits"
}

function initModal() {
    let openModalButton = document.getElementById('add-button');
    let modal = document.getElementById('AddHabitModal');
    let closeHabitButton = document.getElementById('closeHabitButton')
    let saveHabitButton = document.getElementById('saveHabit');

    openModalButton.addEventListener('click', () => {modal.style.display = 'flex'; });
    closeHabitButton.addEventListener('click', () => {modal.style.display = 'none'; clearInputs()});
    saveHabitButton.addEventListener('click', () => {saveHabit();});
}

function clearInputs() {
    document.getElementById('NewHabitTitle').value = '';
    document.getElementById('HabitDescription').value = '';
}

async function reloadUserHabits() {
    document.getElementById("user-content").innerHTML = '';
    await loadUserHabit();
}


async function saveHabit() {
    const title = document.getElementById("NewHabitTitle").value.trim().toString();
    const description = document.getElementById("HabitDescription").value.trim().toString();
    const frequency = document.getElementById("HabitFrequency").value;

    if (!title || !description) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const newHabit = {
        title: title,
        description: description,
        frequency: frequency,
        completed: false,
        streak: 0,
    }
    const habitId = editingHabitId || crypto.randomUUID().toString();

    if(editingHabitId && habitsData[editingHabitId]){
        newHabit.completed = habitsData[editingHabitId].completed;
        newHabit.streak = habitsData[editingHabitId].streak;
    }

    await saveUserData(userUID, {[`habits.${habitId}`]: newHabit,});

    editingHabitId = null;
    document.getElementById('AddHabitModal').style.display = 'none';
    clearInputs();
    await reloadUserHabits();


}

async function loadUserHabit() {

    const userData = await getUserData(userUID);
    habitsData = userData.habits;

    await sortHabits()

}

async function deleteHabit(habitId) {

    await deleteUserField(userUID, `habits.${habitId}`)
    await reloadUserHabits();
}
///Pasar esta funcion a subfunciones para delegar responsabilidades en completeHabit()
function completeHabitTOREFACTORIZE(habitTitle) {
    let userHabits = JSON.parse(localStorage.getItem("UserHabits")) || [];
    const habitIndex = userHabits.findIndex(h => h.title === habitTitle);

    if (habitIndex !== -1 && !userHabits[habitIndex].completed) {
        const habitPoints = userHabits[habitIndex].points || 5;

        const newPoints = parseInt(localStorage.getItem('points')) + habitPoints;
        localStorage.setItem('points', newPoints.toString());

        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('lastTaskDate');
        if (lastDate !== today) {
            const newStreak = parseInt(localStorage.getItem('streak')) + 1;
            localStorage.setItem('streak', newStreak.toString());
            localStorage.setItem('lastTaskDate', today);
        }

        userHabits[habitIndex].completed = true;
        localStorage.setItem("UserHabits", JSON.stringify(userHabits));

        document.dispatchEvent(new Event('pointsUpdated'));
        document.dispatchEvent(new Event('streakUpdated'));

        reloadUserHabits();

        alert(`¡Hábito completado! Ganaste ${habitPoints} puntos.`);
    } else if (userHabits[habitIndex]?.completed) {
        alert("Este hábito ya fue completado.");
    }
}

async function sortHabits() {
    const completed = [];
    const incomplete = [];

    for (const habitId in habitsData) {
        const habit = habitsData[habitId];
        if (habit.completed) {
            completed.push({ id: habitId, ...habit });
        } else {
            incomplete.push({ id: habitId, ...habit });
        }
    }

    document.getElementById("user-content").innerHTML = '';
    for (const habit of [...incomplete, ...completed]) {
        await addTemplate("user-content", "../src/templates/habitsItem.html", habit, habit.id);
    }

    await setupHabitsListeners();
    addStylesToCompletedHabits();

}

function addStylesToCompletedHabits() {

    document.querySelectorAll('.habits-list-item').forEach(habit => {
        const id = habit.getAttribute('data-id');
        if(habitsData[id].completed) {
            habit.classList.add('habit-completed');
        }else {
            habit.classList.remove('habit-completed');
        }
    })
}

async function completeHabit(habitId) {
    if (habitsData[habitId].completed) {
        alert("Este hábito ya fue completado.");
        return;
    }

    habitsData[habitId].completed = true;
    await saveUserData(userUID, {
        [`habits.${habitId}`]: habitsData[habitId],
    });

    await sortHabits();

    await addDoc(
        collection(db, "Users", userUID, "habitsHistory"),
        {
            timestamp: serverTimestamp(),
            userId:    userUID,
            habitId:   habitId
        }
    );
}

/*
function setupHabitsListeners() {
    document.querySelectorAll('.Task-Habit-complete-btn').forEach(button => {
        button.addEventListener('click', async function () {
            const habitItem = this.closest('.habits-list-item');
            const habitTitle = habitItem.querySelector('.habits-task-title').textContent;
            await completeHabit(habitItem.getAttribute('data-id'));

        });
    });

    document.querySelectorAll('.Task-Habit-delete-btn').forEach(button => {
        button.addEventListener('click', async function () {
            const habitItem = this.closest('.habits-list-item');
            const habitId = habitItem.getAttribute('data-id');
            const habitTitle = habitItem.querySelector('.habits-task-title').textContent;
            if (confirm(`¿Estás seguro que quieres eliminar el hábito "${habitTitle}"?`)) {
                console.log(habitId);
                await deleteHabit(habitId);
            }
        });
    });
}

 */

function getHabitInfo(button) {
    const habitItem = button.closest('.habits-list-item');
    const habitId = habitItem.getAttribute('data-id');
    const habitTitle = habitItem.querySelector('.habits-task-title').textContent;
    return { habitItem, habitId, habitTitle };
}

async function handleCompleteHabit(button) {
    const  habitInfo  = getHabitInfo(button);
    await completeHabit(habitInfo.habitId);
}
async function handleDeleteHabit(button) {
    const habitInfo = getHabitInfo(button);
    if (confirm(`¿Estás seguro que quieres eliminar el hábito "${habitInfo.habitTitle}"?`)) {
        await deleteHabit(habitInfo.habitId);
    }
}

function handleEditHabit(button) {
    const habitInfo = getHabitInfo(button);
    editingHabitId = habitInfo.habitId;

    let modal = document.getElementById('AddHabitModal');
    modal.style.display = 'flex';
    document.getElementById("NewHabitTitle").value = habitsData[habitInfo.habitId].title;
    document.getElementById("HabitDescription").value = habitsData[habitInfo.habitId].description;
    document.getElementById("HabitFrequency").value = habitsData[habitInfo.habitId].frequency;


}

async function setupHabitsListeners(){
    document.querySelectorAll('.Task-Habit-complete-btn').forEach(button => {
        button.addEventListener('click', () => handleCompleteHabit(button));
    });

    document.querySelectorAll('.Task-Habit-delete-btn').forEach(button => {
        button.addEventListener('click', () => handleDeleteHabit(button));
    });
    document.querySelectorAll('.Task-Habit-edit-btn').forEach(button => {
        button.addEventListener('click', () => handleEditHabit(button));
    })
}

async function addTemplate(id, url, item, habitId) {
    try {
        const response = await fetch(url);
        if (!response.ok) new Error(`Fail loading ${url}`);

        const container = document.getElementById(id);
        const newElement = document.createElement("div");
        newElement.innerHTML = await response.text();

        newElement.querySelector(".habits-task-title").textContent = item.title;
        newElement.querySelector(".habits-list-item").setAttribute("data-id", habitId);

        if (item.completed) {
            const habitItem = newElement.querySelector(".habits-list-item");
            habitItem.classList.add("completed");
            const completeBtn = habitItem.querySelector(".complete-btn");
            if (completeBtn) completeBtn.style.display = 'none';
        }

        container.appendChild(newElement);


    } catch (error) {
        console.log(error);
    }
}

initHome();