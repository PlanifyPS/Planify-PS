import { deleteUserField, getUserData, saveUserData } from "../../../backend/utils/firestore_utils.js";
import { addDoc, getDocs, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { db } from "/backend/utils/firebase_config.js";
import { addPoints } from './points.js';
import Chart from 'https://esm.run/chart.js/auto';

const userUID = sessionStorage.getItem("uid");
export let habitsData;
let editingHabitId = null;

async function initHome() {
    async function initAll() {
        initTextContent();
        initModal();
        initFilterButton();
        initSearchFunction();
        loadUserHabits().then();
        await initCalendar();
        await initPieByCategory();
        await initPiecompleted();
    }
    if (document.readyState === 'complete') {
        await initAll();
    } else {
        document.addEventListener('DOMContentLoaded', async () => {
            await initAll();
        });
    }
}

function initTextContent() {
    document.getElementById("TitleHabitsTasks").textContent = "Habits";
    document.getElementById("add-button").textContent = "Add Habit";
}

function initModal() {
    let openModalButton = document.getElementById('add-button');
    let modal = document.getElementById('AddHabitModal');
    let closeHabitButton = document.getElementById('closeHabitButton');
    let saveHabitButton = document.getElementById('saveHabit');
    document.getElementById("HabitModalTitle").textContent = "Add New Habit";

    openModalButton.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeHabitButton.addEventListener('click', () => { modal.style.display = 'none'; clearInputs(); });
    saveHabitButton.addEventListener('click', async () => {await saveHabit();});
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
    //Todo refactorizar todo y abstraerlo a un habits utils para tocar firebase desde ahí y tener codigo más limpio.
    const newHabit = {
        title,
        description,
        frequency,
        category,
        completed: false,
        streak: 0,
        lastCompleted: null,
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
    await loadHabitsPieByCategory(userUID);
    await loadHabitsPiecompleted(userUID);
}

//Todo refactorizar desde aquí

function getWeekYear(date) {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return {
        week: Math.ceil((((d - week1) / 86400000) + 1) / 7),
        year: d.getFullYear()
    };
}


function hasPeriodPassed(lastCompleted, frequency) {
    const last = new Date(lastCompleted);
    const now = new Date();

    switch (frequency) {
        case 'daily':

            return now.getFullYear() !== last.getFullYear() || now.getMonth() !== last.getMonth() || now.getDate() !== last.getDate();

        case 'weekly':
            const nowWeek = getWeekYear(now);
            const lastWeek = getWeekYear(last);
            return nowWeek.week !== lastWeek.week || nowWeek.year !== lastWeek.year;

        case 'monthly':
            return now.getFullYear() !== last.getFullYear() || now.getMonth() !== last.getMonth();

        default:
            return false;
    }
}

async function checkFrequencyHabits() {
    const now = new Date();

    for (const habitId in habitsData) {
        const habit = habitsData[habitId];
        let lastCompleted;
        if (habit.lastCompleted && typeof habit.lastCompleted.toDate === 'function') {
            lastCompleted = habit.lastCompleted.toDate();
        } else {
            lastCompleted = null; //
        }


        if (!lastCompleted || hasPeriodPassed(lastCompleted, habit.frequency)) {
            habit.completed = false;
            habit.lastCompleted = now;

            await saveUserData(userUID, {
                [`habits.${habitId}`]: habit,
            });
        }
    }
}

//Todo hasta aquí

async function loadUserHabits() {
    const userData = await getUserData(userUID);
    habitsData = userData.habits;
    await checkFrequencyHabits();
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
    habitsData[habitId].lastCompleted = new Date();
    await saveUserData(userUID, {
        [`habits.${habitId}`]: habitsData[habitId],
    });

    const category = habitsData[habitId].category;
        const pointsByCategory = {
              Wellness: 1,
              Fitness: 5,
              Education: 5,
              Career: 5,
              Social: 3,
              Other: 2
        };
        const pts = pointsByCategory[category];
        await addPoints(pts);

    await sortHabits();
    await loadHabitsPieByCategory(userUID);
    await loadHabitsPiecompleted(userUID);

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
    document.getElementById("HabitModalTitle").textContent = "Edit Habit";
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

    await loadHabitsPieByCategory(userUID);
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

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

async function initCalendar() {

    const today = new Date();

    const calendarContainer = document.getElementById('calendar-container');

    if (!calendarContainer) {
        console.error('Calendar container not found');
        return;
    }

    calendarContainer.innerHTML = createCalendar(today.getFullYear(), today.getMonth());
    await displayEvents();
    setupEventListeners();
    const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    await updateTaskList(formattedDate);
}

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

async function displayEvents() {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    const userData = await getUserData(userUID);
    const tasks = userData?.tasks ? Object.values(userData.tasks) : [];
    const tasksInProgress = tasks.filter(t => t.completed === false);

    const taskDates = {};
    for (const task of tasksInProgress) {
        const due = new Date(task.dueDate);
        const key = `${due.getFullYear()}-${due.getMonth() + 1}-${due.getDate()}`;

        taskDates[key] = (taskDates[key] || 0) + 1;
    }

    const days = document.querySelectorAll('.day:not(.empty)');
    days.forEach(day => {
        const date = day.getAttribute('data-date');
        const dayEvents = events[date] || [];
        const taskCount = taskDates[date] || 0;

        const totalItems = dayEvents.length + taskCount;

        const eventsContainer = day.querySelector('.day-events');
        eventsContainer.innerHTML = '';
        day.classList.remove('has-events');

        if (totalItems > 0) {
            day.classList.add('has-events');
            eventsContainer.innerHTML = `<div class="event-dot" title="${totalItems} event(s)/task(s)"></div>`;
        }
    });
}

function setupEventListeners() {
    document.addEventListener('click', async (e) => {
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
            await displayEvents();
        }

        if (e.target.classList.contains('day') && !e.target.classList.contains('empty')) {
            const date = e.target.getAttribute('data-date');
            await updateTaskList(date);
        }
    });
}

async function updateTaskList(dateString) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    const dayEvents = events[dateString] || [];

    const userData = await getUserData(userUID);
    const tasks = userData?.tasks ? Object.values(userData.tasks) : [];
    const tasksInProgress = tasks.filter(t => t.completed === false);

    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));

    const normalizedDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const dayTasks = tasksInProgress.filter(task => {
        if (!task.dueDate) return false;

        const taskDate = new Date(task.dueDate);

        const taskDateString = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;

        return taskDateString === normalizedDateString;
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

    combined.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });

    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    document.querySelector('.day.selected')?.classList.remove('selected');
    document.querySelector(`.day[data-date="${dateString}"]`)?.classList.add('selected');

    taskList.innerHTML = combined.length > 0
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

let habitsCompletedPieChart;

async function initPiecompleted() {
    await loadHabitsPiecompleted(userUID);

}

function drawPie(containerId, habitsDone, habitsInProgress) {
    const ctx = document.createElement('canvas');
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    cont.appendChild(ctx);

    const cfg = {
        type: 'pie',
        data: {
            labels: ['Done','Pending'],
            datasets: [{
                data: [habitsDone, habitsInProgress],
                backgroundColor: ['#2563EB', '#93C5FD']
            }]
        },
        options: { responsive: true }
    };

    habitsCompletedPieChart?.destroy();
    habitsCompletedPieChart = new Chart(ctx.getContext('2d'), cfg);
}



async function loadHabitsPiecompleted(uid) {
    const historySnap = await getDocs(collection(db, 'Users', uid, 'habitsHistory'));
    const habitsDone = historySnap.docs.length;

    const userData = await getUserData(uid);
    const allHabits = userData?.habits ? Object.values(userData.habits) : [];
    const habitsInProgress = allHabits.filter(t => t.completed === false).length;

    drawPie('circle-progress', habitsDone, habitsInProgress);
}

async function initPieByCategory() {
    await loadHabitsPieByCategory(userUID);
}

function groupSumByCategory(habits) {
    const counts = {};

    for (const habit of habits) {
        const category = habit.category?.trim() || 'Other';
        counts[category] = (counts[category] || 0) + 1;
    }

    return counts;
}

function drawPieByCategory(containerId, categoryCounts) {

    const ctx = document.createElement('canvas');
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    cont.appendChild(ctx);

    const categoryColors = {
        Wellness: '#8ecae6',
        Fitness: '#219ebc',
        Education: '#fb8500',
        Career: '#023047',
        Social: '#ffb703',
        Other: '#606c38'
    };

    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    const backgroundColors = labels.map(category => categoryColors[category] || '#999999');

    if (window.pieChartByCategory) {
        window.pieChartByCategory.destroy();
    }

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
                    text: 'Pending habits'
                }
            }
        }
    });
}

async function loadHabitsPieByCategory(uid) {
    const userData = await getUserData(uid);
    const habits = userData.habits || {};
    const incompleteHabits = Object.values(habits).filter(habit => !habit.completed);
    const categoryCounts = groupSumByCategory(incompleteHabits);
    drawPieByCategory('circle-categories', categoryCounts);
}
initHome();
