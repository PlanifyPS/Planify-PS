import { deleteUserField, getUserData, saveUserData } from "../../../backend/utils/firestore_utils.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from "/backend/utils/firebase_config.js";
import { addPoints } from './points.js';

const userUID = sessionStorage.getItem("uid");
let tasksData;
let editingTaskId = null;

function initHome() {
    if (document.readyState === 'complete') {
        initTextContent();
        initModal();
        initFilterButton();
        initSearchFunction();
        loadUserTasks().then();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initTextContent();
            initModal();
            initFilterButton();
            initSearchFunction();
            loadUserTasks().then();
        });
    }
}

function initTextContent() {
    document.getElementById("TitleHabitsTasks").textContent = "Tasks";
    document.getElementById("add-button").textContent = "Add Task";
}

function initModal() {
    let openModalButton = document.getElementById('add-button');
    let modal = document.getElementById('AddTaskModal');
    let closeButton = document.getElementById('closeTaskButton');
    let saveButton = document.getElementById('saveTask');

    openModalButton.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeButton.addEventListener('click', () => { modal.style.display = 'none'; clearInputs(); });
    saveButton.addEventListener('click', () => { saveTask(); });
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
            await sortTasks();
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
            await sortTasks();
        }, 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            document.querySelector('.habits-content').classList.remove('search-active');
            sortTasks().then();
        }
    });
}

function clearInputs() {
    document.getElementById('NewTaskTitle').value = '';
    document.getElementById('TaskDescription').value = '';
    document.getElementById('TaskDueDate').value = '';
    document.getElementById('TaskCategory').value = 'Wellness';

}

async function reloadUserTasks() {
    document.getElementById("user-content").innerHTML = '';
    await loadUserTasks();
}

async function saveTask() {
    const title = document.getElementById("NewTaskTitle").value.trim().toString();
    const description = document.getElementById("TaskDescription").value.trim().toString();
    const dueDate = document.getElementById("TaskDueDate").value;
    const category = document.getElementById("TaskCategory").value;


    if (!title || !description || !dueDate) {
        alert("Please complete all fields.");
        return;
    }

    const newTask = {
        title,
        description,
        dueDate,
        category,
        completed: false,
        streak: 0
    };

    const taskId = editingTaskId || crypto.randomUUID().toString();

    if (editingTaskId && tasksData[editingTaskId]) {
        newTask.completed = tasksData[editingTaskId].completed;
        newTask.streak = tasksData[editingTaskId].streak;
    }

    await saveUserData(userUID, { [`tasks.${taskId}`]: newTask });

    editingTaskId = null;
    document.getElementById('AddTaskModal').style.display = 'none';
    clearInputs();
    await reloadUserTasks();
}

async function loadUserTasks() {
    const userData = await getUserData(userUID);
    tasksData = userData.tasks;
    await sortTasks();
}

async function deleteTask(taskId) {
    await deleteUserField(userUID, `tasks.${taskId}`);
    await reloadUserTasks();
}

async function completeTask(taskId) {
    if (tasksData[taskId].completed) {
        alert("This task has already been completed.");
        return;
    }

    tasksData[taskId].completed = true;

    await saveUserData(userUID, {
        [`tasks.${taskId}`]: tasksData[taskId],
    });

    /* ¡¡ESTO ES IMPORTANTE!!
    const taskPoints = tasksData[taskId].points || 1;
    const newPoints = parseInt(localStorage.getItem('points') || '0') + taskPoints;
    localStorage.setItem('points', newPoints.toString());

    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastTaskDate');
    if (lastDate !== today) {
        const newStreak = parseInt(localStorage.getItem('streak') || '0') + 1;
        localStorage.setItem('streak', newStreak.toString());
        localStorage.setItem('lastTaskDate', today);
    }
     */
    const category = tasksData[taskId].category;
        const pointsByCategory = {
            Wellness: 1,
            Fitness: 3,
            Education: 3,
            Career: 3,
            Social: 1,
            Other: 2
        };
        const pts = pointsByCategory[category];
        await addPoints(pts);
    await sortTasks();

    await addDoc(collection(db, "Users", userUID, "tasksHistory"), {
            timestamp: serverTimestamp(),
            userId: userUID,
            taskId: taskId
        }
    );
    //alert(`Task completed! You earned ${taskPoints} points.`);
}

async function sortTasks() {
    const completed = [];
    const incomplete = [];
    const selectedCategory = document.querySelector('input[name="category-filter"]:checked').value;
    const searchQuery = document.getElementById('search-HabitsTasks').value.trim().toLowerCase();

    for (const taskId in tasksData) {
        const task = tasksData[taskId];

        if (selectedCategory !== 'all' && task.category !== selectedCategory) continue;

        if (searchQuery &&
            !task.title.toLowerCase().includes(searchQuery) &&
            !task.description.toLowerCase().includes(searchQuery)) {
            continue;
        }

        if (task.completed) {
            completed.push({ id: taskId, ...task });
        } else {
            incomplete.push({ id: taskId, ...task });
        }
    }

    document.getElementById("user-content").innerHTML = '';

    if (incomplete.length === 0 && completed.length === 0) {
        const noResultsElement = document.createElement("div");
        noResultsElement.className = "no-results-message";
        noResultsElement.textContent = "No tasks matched your search.";
        document.getElementById("user-content").appendChild(noResultsElement);
        return;
    }

    for (const task of [...incomplete, ...completed]) {
        await addTemplate("user-content", "../src/templates/habitsItem.html", task, task.id);
    }

    await setupTasksListeners();
    addStylesToCompletedTasks();
}

function addStylesToCompletedTasks() {
    document.querySelectorAll('.habits-list-item').forEach(task => {
        const id = task.getAttribute('data-id');
        if (tasksData[id].completed) {
            task.classList.add('habit-completed');
        } else {
            task.classList.remove('habit-completed');
        }
    });
}

function getTaskInfo(button) {
    const taskItem = button.closest('.habits-list-item');
    const taskId = taskItem.getAttribute('data-id');
    const taskTitle = taskItem.querySelector('.habits-task-title').textContent;
    return { taskItem, taskId, taskTitle };
}

async function handleCompleteTask(button) {
    const taskInfo = getTaskInfo(button);
    await completeTask(taskInfo.taskId);
}

async function handleDeleteTask(button) {
    const taskInfo = getTaskInfo(button);
    if (confirm(`Are you sure you want to delete the task "${taskInfo.taskTitle}"?`)) {
        await deleteTask(taskInfo.taskId);
    }
}

function handleEditTask(button) {
    const taskInfo = getTaskInfo(button);
    editingTaskId = taskInfo.taskId;

    let modal = document.getElementById('AddTaskModal');
    modal.style.display = 'flex';
    document.getElementById("NewTaskTitle").value = tasksData[taskInfo.taskId].title;
    document.getElementById("TaskDescription").value = tasksData[taskInfo.taskId].description;
    document.getElementById("TaskDueDate").value = tasksData[taskInfo.taskId].dueDate;
    document.getElementById("TaskCategory").value = tasksData[taskInfo.taskId].category || "other";
}

async function setupTasksListeners() {
    document.querySelectorAll('.Task-Habit-complete-btn').forEach(button => {
        button.addEventListener('click', () => handleCompleteTask(button));
    });

    document.querySelectorAll('.Task-Habit-delete-btn').forEach(button => {
        button.addEventListener('click', () => handleDeleteTask(button));
    });

    document.querySelectorAll('.Task-Habit-edit-btn').forEach(button => {
        button.addEventListener('click', () => handleEditTask(button));
    });
}

function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

async function addTemplate(id, url, item, taskId) {
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

        newElement.querySelector(".habits-list-item").setAttribute("data-id", taskId);

        const taskItem = newElement.querySelector(".habits-list-item");

        const categoryIndicator = document.createElement("div");
        categoryIndicator.classList.add("habits-list-item-indicator");
        categoryIndicator.classList.add(`category-${item.category || 'other'}`);
        taskItem.prepend(categoryIndicator);

        const titleElement = newElement.querySelector(".habits-task-title");
        const categoryLabel = document.createElement("span");
        categoryLabel.classList.add("habits-list-item-category");
        categoryLabel.classList.add(`category-${item.category || 'other'}`);
        categoryLabel.textContent = item.category || 'other';
        titleElement.after(categoryLabel);

        if (item.completed) {
            taskItem.classList.add("completed");
            //const completeBtn = taskItem.querySelector(".complete-btn");
            //if (completeBtn) completeBtn.style.display = 'none';
        }

        container.appendChild(newElement);
    } catch (error) {
        console.error(error);
    }
}

initHome();
