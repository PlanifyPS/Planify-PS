import {deleteUserField, getUserData, saveUserData} from "../../../backend/utils/firestore_utils.js";
import {addDoc, collection, serverTimestamp} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {db} from "/backend/utils/firebase_config.js";

const userUID = sessionStorage.getItem("uid");
let habitsData;
let editingHabitId = null;

function initHome() {
    if (document.readyState === 'complete') {
        initTextContent();
        initModal();
        initFilterButton();
        initSearchFunction();
        loadUserHabits().then();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initTextContent();
            initModal();
            initFilterButton();
            initSearchFunction();
            loadUserHabits().then();
        });
    }
}

function initTextContent() {
    document.getElementById("TitleHabitsTasks").textContent = "Habits";
}

function initModal() {
    let openModalButton = document.getElementById('add-button');
    let modal = document.getElementById('AddHabitModal');
    let closeHabitButton = document.getElementById('closeHabitButton');
    let saveHabitButton = document.getElementById('saveHabit');

    openModalButton.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeHabitButton.addEventListener('click', () => { modal.style.display = 'none'; clearInputs(); });
    saveHabitButton.addEventListener('click', () => { saveHabit(); });
}

function initFilterButton() {
    const filterButton = document.getElementById('filter-button');
    const filterDropdown = document.getElementById('filterDropdown');

    filterButton.addEventListener('click', () => {
        filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (event) => {
        if (!filterButton.contains(event.target) && !filterDropdown.contains(event.target)) {
            filterDropdown.style.display = 'none';
        }
    });

    document.querySelectorAll('input[name="category-filter"]').forEach(radio => {
        radio.addEventListener('change', async () => {
            await sortHabits();
        });
    });
}

function initSearchFunction() {
    const searchInput = document.getElementById('search-HabitsTasks');

    let debounceTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(async () => {
            document.querySelector('.habits-content').classList.toggle('search-active', searchInput.value.trim() !== '');
            await sortHabits();
        }, 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            document.querySelector('.habits-content').classList.remove('search-active');
            sortHabits().then();
        }
    });
}

function clearInputs() {
    document.getElementById('NewHabitTitle').value = '';
    document.getElementById('HabitDescription').value = '';
    document.getElementById('HabitCategory').value = 'Wellness';
}

async function reloadUserHabits() {
    document.getElementById("user-content").innerHTML = '';
    await loadUserHabits();
}

async function saveHabit() {
    const title = document.getElementById("NewHabitTitle").value.trim().toString();
    const description = document.getElementById("HabitDescription").value.trim().toString();
    const frequency = document.getElementById("HabitFrequency").value;
    const category = document.getElementById("HabitCategory").value;

    if (!title || !description) {
        alert("Please complete all fields.");
        return;
    }

    const newHabit = {
        title,
        description,
        frequency,
        category,
        completed: false,
        streak: 0,
    };
    const habitId = editingHabitId || crypto.randomUUID().toString();

    if (editingHabitId && habitsData[editingHabitId]) {
        newHabit.completed = habitsData[editingHabitId].completed;
        newHabit.streak = habitsData[editingHabitId].streak;
    }

    await saveUserData(userUID, { [`habits.${habitId}`]: newHabit });

    editingHabitId = null;
    document.getElementById('AddHabitModal').style.display = 'none';
    clearInputs();
    await reloadUserHabits();
}

async function loadUserHabits() {
    const userData = await getUserData(userUID);
    habitsData = userData.habits;
    await sortHabits();
}

async function deleteHabit(habitId) {
    await deleteUserField(userUID, `habits.${habitId}`);
    await reloadUserHabits();
}

async function completeHabit(habitId) {
    if (habitsData[habitId].completed) {
        alert("This habit has already been completed.");
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
            userId: userUID,
            habitId: habitId
        }
    );
}

async function sortHabits() {
    const completed = [];
    const incomplete = [];
    const selectedCategory = document.querySelector('input[name="category-filter"]:checked').value;
    const searchQuery = document.getElementById('search-HabitsTasks').value.trim().toLowerCase();

    for (const habitId in habitsData) {
        const habit = habitsData[habitId];

        if (selectedCategory !== 'all' && habit.category !== selectedCategory) continue;

        if (searchQuery &&
            !habit.title.toLowerCase().includes(searchQuery) &&
            !habit.description.toLowerCase().includes(searchQuery)) {
            continue;
        }

        if (habit.completed) {
            completed.push({ id: habitId, ...habit });
        } else {
            incomplete.push({ id: habitId, ...habit });
        }
    }

    document.getElementById("user-content").innerHTML = '';

    if (incomplete.length === 0 && completed.length === 0) {
        const noResultsElement = document.createElement("div");
        noResultsElement.className = "no-results-message";
        noResultsElement.textContent = "No habits matched your search.";
        document.getElementById("user-content").appendChild(noResultsElement);
        return;
    }

    for (const habit of [...incomplete, ...completed]) {
        await addTemplate("user-content", "../src/templates/habitsItem.html", habit, habit.id);
    }

    await setupHabitsListeners();
    addStylesToCompletedHabits();
}

function addStylesToCompletedHabits() {
    document.querySelectorAll('.habits-list-item').forEach(habit => {
        const id = habit.getAttribute('data-id');
        if (habitsData[id].completed) {
            habit.classList.add('habit-completed');
        } else {
            habit.classList.remove('habit-completed');
        }
    });
}

function getHabitInfo(button) {
    const habitItem = button.closest('.habits-list-item');
    const habitId = habitItem.getAttribute('data-id');
    const habitTitle = habitItem.querySelector('.habits-task-title').textContent;
    return { habitItem, habitId, habitTitle };
}

async function handleCompleteHabit(button) {
    const habitInfo = getHabitInfo(button);
    await completeHabit(habitInfo.habitId);
}

async function handleDeleteHabit(button) {
    const habitInfo = getHabitInfo(button);
    if (confirm(`Are you sure you want to delete the habit "${habitInfo.habitTitle}"?`)) {
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
    document.getElementById("HabitCategory").value = habitsData[habitInfo.habitId].category || "other";
}

async function setupHabitsListeners() {
    document.querySelectorAll('.Task-Habit-complete-btn').forEach(button => {
        button.addEventListener('click', () => handleCompleteHabit(button));
    });

    document.querySelectorAll('.Task-Habit-delete-btn').forEach(button => {
        button.addEventListener('click', () => handleDeleteHabit(button));
    });

    document.querySelectorAll('.Task-Habit-edit-btn').forEach(button => {
        button.addEventListener('click', () => handleEditHabit(button));
    });
}

function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

async function addTemplate(id, url, item, habitId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);

        const container = document.getElementById(id);
        const newElement = document.createElement("div");
        newElement.innerHTML = await response.text();

        const searchQuery = document.getElementById('search-HabitsTasks').value.trim();
        if (searchQuery) {
            newElement.querySelector(".habits-task-title").innerHTML =
                highlightSearchTerm(item.title, searchQuery);
        } else {
            newElement.querySelector(".habits-task-title").textContent = item.title;
        }

        newElement.querySelector(".habits-list-item").setAttribute("data-id", habitId);

        const habitItem = newElement.querySelector(".habits-list-item");

        const categoryIndicator = document.createElement("div");
        categoryIndicator.classList.add("habits-list-item-indicator");
        categoryIndicator.classList.add(`category-${item.category || 'other'}`);
        habitItem.prepend(categoryIndicator);

        const titleElement = newElement.querySelector(".habits-task-title");
        const categoryLabel = document.createElement("span");
        categoryLabel.classList.add("habits-list-item-category");
        categoryLabel.classList.add(`category-${item.category || 'other'}`);
        categoryLabel.textContent = item.category || 'other';
        titleElement.after(categoryLabel);

        if (item.completed) {
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
