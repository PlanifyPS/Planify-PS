import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { auth, db } from "/backend/utils/firebase_config.js";

function initHome() {
    if (document.readyState === 'complete') {
        initTextContent();
        initModal();
        loadUserTasks().then();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initTextContent();
            initModal();
            loadUserTasks().then();
        });
    }
}

function initTextContent() {
    document.getElementById("TitleHabitsTasks").textContent = "Tasks";
    document.getElementById("add-button").textContent = "Add Task"
}

function initModal() {
    let openModalButton = document.getElementById('add-button');
    let modal = document.getElementById('AddTaskModal');
    let closeTaskButton = document.getElementById('closeTaskButton');
    let saveTaskButton = document.getElementById('saveTask');

    openModalButton.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeTaskButton.addEventListener('click', () => { modal.style.display = 'none'; clearInputs(); });
    saveTaskButton.addEventListener('click', () => { saveTask(); });
}

function clearInputs() {
    document.getElementById('NewTaskTitle').value = '';
    document.getElementById('TaskDescription').value = '';
    document.getElementById('TaskDueDate').value = '';
}

function reloadUserTasks() {
    document.getElementById("user-content").innerHTML = '';
    loadUserTasks().then();
}

function saveTask() {
    const title = document.getElementById("NewTaskTitle").value.trim().toString();
    const description = document.getElementById("TaskDescription").value.trim().toString();
    const dueDate = document.getElementById("TaskDueDate").value;
    const points = 1;

    if (!title || !description || !dueDate) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const tasks = JSON.parse(localStorage.getItem("UserTasks")) || [];
    const newTask = {
        title,
        description,
        dueDate,
        points,
        completed: false,
        id: Date.now()
    };

    tasks.push(newTask);
    localStorage.setItem("UserTasks", JSON.stringify(tasks));
    document.getElementById('AddTaskModal').style.display = 'none';
    clearInputs();
    reloadUserTasks();
}

async function loadUserTasks() {
    let userTasks = localStorage.getItem('UserTasks');
    userTasks = JSON.parse(userTasks) || [];

    for (const task of userTasks) {
        await addTemplate("user-content", "../src/templates/habitsItem.html", task);
    }

    document.querySelectorAll('.Task-Habit-complete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const taskItem = this.closest('.habits-list-item');
            const taskTitle = taskItem.querySelector('.habits-task-title').textContent;
            completeTask(taskTitle);
        });
    });

    document.querySelectorAll('.Task-Habit-delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const taskItem = this.closest('.habits-list-item');
            const taskId = parseInt(taskItem.getAttribute('data-id'));
            const taskTitle = taskItem.querySelector('.habits-task-title').textContent;
            if (confirm(`¿Estás seguro que quieres eliminar la tarea "${taskTitle}"?`)) {
                deleteTask(taskId);
            }
        });
    });
}

function deleteTask(taskId) {
    let userTasks = JSON.parse(localStorage.getItem("UserTasks")) || [];
    const updatedTasks = userTasks.filter(task => task.id !== taskId);
    localStorage.setItem("UserTasks", JSON.stringify(updatedTasks));
    reloadUserTasks();
}

async function completeTask(taskTitle) {
    let userTasks = JSON.parse(localStorage.getItem("UserTasks")) || [];
    const taskIndex = userTasks.findIndex(t => t.title === taskTitle);

    if (taskIndex !== -1 && !userTasks[taskIndex].completed) {
        const taskPoints = userTasks[taskIndex].points || 5;
        const newPoints  = parseInt(localStorage.getItem('points') || '0') + taskPoints;
        localStorage.setItem('points', newPoints.toString());

        const today    = new Date().toDateString();
        const lastDate = localStorage.getItem('lastTaskDate');
        if (lastDate !== today) {
            const newStreak = parseInt(localStorage.getItem('streak') || '0') + 1;
            localStorage.setItem('streak', newStreak.toString());
            localStorage.setItem('lastTaskDate', today);
        }

        userTasks[taskIndex].completed = true;
        localStorage.setItem("UserTasks", JSON.stringify(userTasks));

        document.dispatchEvent(new Event('pointsUpdated'));
        document.dispatchEvent(new Event('streakUpdated'));

        reloadUserTasks();

        const user = auth.currentUser;
        if (user) {
            try {
                await addDoc(
                    collection(db, "Users", user.uid, "tasksHistory"),
                    {
                        timestamp: serverTimestamp(),
                        userId:    user.uid,
                        taskTitle: taskTitle
                    }
                );
            } catch (e) {
                console.error("Error writing task history:", e);
            }
        }

        alert(`Task completed! You earned ${taskPoints} points.`);
    }
    else if (userTasks[taskIndex]?.completed) {
        alert("This task has already been completed.");
    }
}

async function addTemplate(id, url, item) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fail loading ${url}`);
        const container = document.getElementById(id);
        const newElement = document.createElement("div");
        newElement.innerHTML = await response.text();
        newElement.querySelector(".habits-task-title").textContent = item.title;
        newElement.querySelector(".habits-list-item").setAttribute("data-id", item.id);
        if (item.completed) {
            const taskItem = newElement.querySelector(".habits-list-item");
            taskItem.classList.add("completed");
            const completeBtn = taskItem.querySelector(".complete-btn");
            if (completeBtn) completeBtn.style.display = 'none';
        }
        container.appendChild(newElement);
    } catch (error) {
        console.log(error);
    }
}

initHome();