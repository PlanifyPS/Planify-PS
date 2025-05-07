import { deleteUserField, getUserData, saveUserData } from "../../../backend/utils/firestore_utils.js";
import { addDoc, getDocs, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from "/backend/utils/firebase_config.js";
import { addPoints } from './points.js';
import Chart from 'https://esm.run/chart.js/auto';

let tasksData;
let editingTaskId = null;

const userUID = sessionStorage.getItem("uid");


function initHome() {
    if (document.readyState === 'complete') {
        initTextContent();
        initModal();
        initFilterButton();
        initSearchFunction();
        loadUserTasks().then();
        initCalendar();
        initPieByCategory();
        initPiecompleted();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initTextContent();
            initModal();
            initFilterButton();
            initSearchFunction();
            loadUserTasks().then();
            initCalendar();
            initPieByCategory();
            initPiecompleted();
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
    document.getElementById("TaskModalTitle").textContent = "Add New Task";

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
    //const dueDate = document.getElementById("TaskDueDate").value;
    const dueDateRaw = document.getElementById("TaskDueDate").value;
    const dueDate = dueDateRaw + "T12:00:00";  // forzar al mediodía
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
    await loadTasksPieByCategory(userUID);
    await loadTasksPiecompleted(userUID);
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

    await loadTasksPieByCategory(userUID);
    await loadTasksPiecompleted(userUID);

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
    document.getElementById("TaskModalTitle").textContent = "Edit Task";
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

    await loadTasksPieByCategory(userUID);
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

// ------------------------------ CALENDARIO ------------------------------

function initCalendar() {

    const today = new Date();

    const calendarContainer = document.getElementById('calendar-container');

    if (!calendarContainer) {
        console.error('No se encontró el contenedor del calendario');
        return;
    }

    calendarContainer.innerHTML = createCalendar(today.getFullYear(), today.getMonth());
    displayEvents();
    setupEventListeners();
    const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    updateTaskList(formattedDate);
}

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

function createCalendar(year, month) {
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    let calendarHTML = `
        <div class="calendar-header">
            <button id="prev-month" class="calendar-nav-btn">←</button>
            <h3>${monthNames[month]} ${year}</h3>
            <button id="next-month" class="calendar-nav-btn">→</button>
        </div>
        <div class="weekdays">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
        </div>
        <div class="days">
    `;

    let startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startingDay; i++) {
        calendarHTML += `<div class="day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

        calendarHTML += `
            <div class="day ${isToday ? 'today' : ''}" data-date="${year}-${month+1}-${day}">
                ${day}
                <div class="day-events"></div>
            </div>
        `;
    }

    calendarHTML += `</div>`;
    return calendarHTML;
}

function displayEvents() {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    const days = document.querySelectorAll('.day:not(.empty)');

    days.forEach(day => {
        const date = day.getAttribute('data-date');
        const dayEvents = events[date] || [];
        const eventsContainer = day.querySelector('.day-events');

        eventsContainer.innerHTML = '';
        day.classList.remove('has-events');

        if (dayEvents.length > 0) {
            day.classList.add('has-events');
            eventsContainer.innerHTML = `<div class="event-dot" title="${dayEvents.length} evento(s)"></div>`;
        }
    });
}


function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.id === 'prev-month' || e.target.id === 'next-month') {
            const header = document.querySelector('.calendar-header h3');
            const [monthName, year] = header.textContent.split(' ');
            const monthIndex = monthNames.indexOf(monthName);
            const currentYear = parseInt(year);
            const calendarContainer = document.getElementById('calendar-container');

            let newMonth, newYear;

            if (e.target.id === 'prev-month') {
                newMonth = monthIndex === 0 ? 11 : monthIndex - 1;
                newYear = monthIndex === 0 ? currentYear - 1 : currentYear;
            } else {
                newMonth = monthIndex === 11 ? 0 : monthIndex + 1;
                newYear = monthIndex === 11 ? currentYear + 1 : currentYear;
            }

            calendarContainer.innerHTML = createCalendar(newYear, newMonth);
            displayEvents();
        }

        if (e.target.classList.contains('day') && !e.target.classList.contains('empty')) {
            const date = e.target.getAttribute('data-date');
            updateTaskList(date);
        }
    });
}

async function updateTaskList(dateString) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');

    const dayEvents = events[dateString] || [];

    const userData = await getUserData(userUID);
    const tasks = userData?.tasks ? Object.values(userData.tasks) : [];

    const formattedDate = new Date(dateString);
    const isoDateString = formattedDate.toISOString().split('T')[0];

    const tasksInProgress = tasks.filter(t => t.completed === false);

    const dayTasks = tasksInProgress.filter(task => {
        const taskDate = new Date(task.dueDate);
        // const taskDateString = taskDate.toISOString().split('T')[0];
        const taskDateString = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
        return taskDateString === isoDateString;

    });


    const combined = [
        ...dayEvents.map(event => ({
            type: 'event',
            name: event.name,
            time: event.time || ''
        })),
        ...dayTasks.map(task => ({
            type: 'task',
            name: task.title,
            time: task.time || ''
        }))
    ];

    // Ordenar por hora (vacíos al final)
    combined.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });

    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    document.querySelector('.day.selected')?.classList.remove('selected');
    document.querySelector(`.day[data-date="${dateString}"]`)?.classList.add('selected');

    taskList.innerHTML = combined.length > 0 // muestra lista de eventos y tareas del día seleccionado con sus iconos.
        ? combined.map(item => `
            <div class="task-item">
                <div class="task-icon">${item.type === 'event' ? '📆' : '<i class="fas fa-sticky-note" style="color: #219ebc;"></i>'}</div>
                <span>${item.name}</span>
                <span>${item.time}</span>
            </div>
        `).join('')
        : `<div class="task-item">
                <div class="task-icon">ℹ️</div>
                <span>There are no events or tasks</span>
                <span></span>
           </div>`;
}

// ------------------------------ FIN CALENDARIO ------------------------------

// ------------------------------ INICIO GRÁFICO COMPLETADAS/PENDIENTES ------------------------------

let tasksCompletedPieChart;

async function initPiecompleted() {
    await loadTasksPiecompleted(userUID);

}

function drawPie(containerId, tasksDone, tasksInProgress) {
    const ctx = document.createElement('canvas');
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    cont.appendChild(ctx);

    const cfg = {
        type: 'pie',
        data: {
            labels: ['Done','Pending'],
            datasets: [{
                data: [tasksDone, tasksInProgress],
                backgroundColor: ['#2563EB', '#93C5FD']
            }]
        },
        options: { responsive: true }
    };

    tasksCompletedPieChart?.destroy();
    tasksCompletedPieChart = new Chart(ctx.getContext('2d'), cfg);
}



async function loadTasksPiecompleted(uid) {
    // 1) Obtener tareas completadas desde Firestore ('tasksHistory')
    const historySnap = await getDocs(collection(db, 'Users', uid, 'tasksHistory'));
    const tasksDone = historySnap.docs.length;

    // 2) Obtener tareas pendientes desde userData.tasks
    const userData = await getUserData(uid);
    const allTasks = userData?.tasks ? Object.values(userData.tasks) : [];
    const tasksInProgress = allTasks.filter(t => t.completed === false).length;

    // 3) Dibujar gráfico
    drawPie('circle-progress', tasksDone, tasksInProgress);
}

// ------------------------------ FIN GRÁFICO COMPLETADAS/PENDIENTES ------------------------------

// ------------------------------ INICIO GRÁFICO POR CATEGORÍAS ------------------------------

async function initPieByCategory() {
    await loadTasksPieByCategory(userUID);
}

function groupSumByCategory(tasks) {
    const counts = {};

    for (const task of tasks) {
        console.log('Task category:', task.category);               // ******    corregir esto: no lee las categorías
        const category = task.category?.trim() || 'Other';
        counts[category] = (counts[category] || 0) + 1;
    }

    return counts;
}

function drawPieByCategory(containerId, categoryCounts) {

    const ctx = document.createElement('canvas');
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    cont.appendChild(ctx);


    // Mapa de colores fijos por categoría (coincide con tus clases CSS)
    const categoryColors = {
        Wellness: '#8ecae6',
        Fitness: '#219ebc',
        Education: '#fb8500',
        Career: '#023047',
        Social: '#ffb703',
        Other: '#606c38'
    };

    // Preparamos datos para el gráfico
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    const backgroundColors = labels.map(category => categoryColors[category] || '#999999');

    // Destruye el gráfico anterior si existe (evita superposición)
    if (window.pieChartByCategory) {
        window.pieChartByCategory.destroy();
    }

    // Creamos nuevo gráfico
    window.pieChartByCategory = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Pending tasks'
                }
            }
        }
    });
}

async function loadTasksPieByCategory(uid) {
    const userData = await getUserData(uid);
    const tasks = userData.tasks || {};

    // Filtramos solo las tareas que no están completadas
    const incompleteTasks = Object.values(tasks).filter(task => !task.completed);

    // Contamos por categoría
    const categoryCounts = groupSumByCategory(incompleteTasks);

    // Dibujamos el gráfico
    drawPieByCategory('circle-categories', categoryCounts);
}

// ------------------------------ FIN GRÁFICO POR CATEGORÍAS------------------------------

initHome();
