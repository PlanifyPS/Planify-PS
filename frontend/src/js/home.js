const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];

function initHome() {
    if (document.readyState === 'complete') {
        initCalendar();
        setupEventDialogListeners();

        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        updateTaskList(formattedDate);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initCalendar();
            setupEventDialogListeners();

            const today = new Date();
            const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            updateTaskList(formattedDate);
        });
    }
}

function setupEventDialogListeners() {
    const home = document.getElementById('home');
    const eventDialog = document.getElementById('event-dialog');
    const eventForm = document.querySelector('.event-form');
    const closeBtn = document.querySelector('.close-btn');
    const eventDate = document.getElementById('event-date');
    const eventName = document.getElementById('event-name');
    const eventTime = document.getElementById('event-time');
    const addEventBtn = document.getElementById('add-event-btn');

    eventName.setAttribute('autocomplete', 'off');
    eventTime.setAttribute('autocomplete', 'off');

    const editDialog = document.createElement('div');
    editDialog.id = 'edit-event-dialog';
    editDialog.className = 'dialog';
    editDialog.innerHTML = `
        <div class="dialog-header">
            <h3>Edit Event</h3>
            <button class="close-btn close-edit-btn">&times;</button>
        </div>
        <form class="event-form edit-event-form">
            <input type="hidden" id="edit-event-id">
            <input type="hidden" id="edit-event-date">
            <div class="form-group">
                <label for="edit-event-name">Event Name:</label>
                <input type="text" id="edit-event-name" required autocomplete="off">
            </div>
            <div class="form-group">
                <label for="edit-event-time">Time:</label>
                <input type="time" id="edit-event-time" autocomplete="off">
            </div>
            <button type="submit" class="save-btn">Save Changes</button>
        </form>
    `;
    document.body.appendChild(editDialog);

    const editEventForm = document.querySelector('.edit-event-form');
    const closeEditBtn = document.querySelector('.close-edit-btn');
    const editEventId = document.getElementById('edit-event-id');
    const editEventDate = document.getElementById('edit-event-date');
    const editEventName = document.getElementById('edit-event-name');
    const editEventTime = document.getElementById('edit-event-time');

    closeEditBtn.addEventListener('click', () => {
        editDialog.style.display = 'none';
        home.classList.remove('modal-open');
    });

    editEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventId = parseInt(editEventId.value);
        const date = editEventDate.value;
        const name = editEventName.value;
        const time = editEventTime.value;

        const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');

        if (events[date]) {
            const eventIndex = events[date].findIndex(event => event.id === eventId);
            if (eventIndex !== -1) {
                events[date][eventIndex] = {
                    name,
                    time,
                    id: eventId
                };
                localStorage.setItem('calendarEvents', JSON.stringify(events));

                displayEvents();
                updateTaskList(date);
                editDialog.style.display = 'none';
                home.classList.remove('modal-open');
            }
        }
    });

    addEventBtn.addEventListener('click', () => {
        const selectedDay = document.querySelector('.day.selected');

        if (selectedDay) {
            const date = selectedDay.getAttribute('data-date');
            eventDate.value = date;
        } else {
            const today = new Date();
            const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            eventDate.value = formattedDate;
        }

        eventName.value = '';
        eventTime.value = '';
        eventDialog.style.display = 'block';
        home.classList.add('modal-open');
    });

    closeBtn.addEventListener('click', () => {
        eventDialog.style.display = 'none';
        home.classList.remove('modal-open');
    });

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = eventDate.value;
        const name = eventName.value;
        const time = eventTime.value;

        const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
        const newEvent = { name, time, id: Date.now() };

        if (!events[date]) {
            events[date] = [];
        }
        events[date].push(newEvent);

        localStorage.setItem('calendarEvents', JSON.stringify(events));

        displayEvents();
        updateTaskList(date);
        eventDialog.style.display = 'none';
        home.classList.remove('modal-open');
    });

    const taskList = document.querySelector('.task-list');
    taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;


        if (taskItem.querySelector('span')?.textContent === 'There are no events') {
            return;
        }

        const dateString = document.querySelector('.day.selected')?.getAttribute('data-date');
        if (!dateString) return;

        const eventName = taskItem.querySelector('span:nth-child(2)').textContent;
        const eventTime = taskItem.querySelector('span:nth-child(3)').textContent;

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.classList.add('edit-task-btn');

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.classList.add('delete-task-btn');

        taskItem.querySelector('.edit-task-btn')?.remove();
        taskItem.querySelector('.delete-task-btn')?.remove();

        taskItem.appendChild(editBtn);
        taskItem.appendChild(deleteBtn);

        editBtn.addEventListener('click', () => {
            const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
            const dateEvents = events[dateString] || [];

            const eventToEdit = dateEvents.find(event =>
                event.name === eventName && event.time === eventTime
            );

            if (eventToEdit) {
                editEventId.value = eventToEdit.id;
                editEventDate.value = dateString;
                editEventName.value = eventToEdit.name;
                editEventTime.value = eventToEdit.time;

                editDialog.style.display = 'block';
                home.classList.add('modal-open');
            }
        });

        deleteBtn.addEventListener('click', () => {
            const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
            const dateEvents = events[dateString] || [];
            events[dateString] = dateEvents.filter(event =>
                event.name !== eventName || event.time !== eventTime
            );
            localStorage.setItem('calendarEvents', JSON.stringify(events));

            displayEvents();
            updateTaskList(dateString);
        });
    });
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

function initCalendar() {
    const today = new Date();
    const calendarContainer = document.getElementById('calendar-container');

    if (!calendarContainer) {
        console.error('Calendar container not found');
        return;
    }

    calendarContainer.innerHTML = createCalendar(today.getFullYear(), today.getMonth());
    displayEvents();
    setupEventListeners();
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
            eventsContainer.innerHTML = `<div class="event-dot" title="${dayEvents.length} event(s)"></div>`;
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

function updateTaskList(dateString) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    let dayEvents = events[dateString] || [];
    const taskList = document.querySelector('.task-list');

    document.querySelector('.day.selected')?.classList.remove('selected');

    const selectedDay = document.querySelector(`.day[data-date="${dateString}"]`);
    selectedDay?.classList.add('selected');

    if (!taskList) return;

    dayEvents.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;

        return a.time.localeCompare(b.time);
    });

    taskList.innerHTML = dayEvents.length > 0
        ? dayEvents.map(event => `
            <div class="task-item">
                <div class="task-icon">📆</div>
                <span>${event.name}</span>
                <span>${event.time || ''}</span>
            </div>
        `).join('')
        : `<div class="task-item">
                <div class="task-icon">ℹ️</div>
                <span>There are no events</span>
                <span></span>
            </div>`;


}

/*-------------------------  COSAS ALE -------------------------

async function initCalendar() {

    const today = new Date();
    const calendarContainer = document.getElementById('calendar-container');

    if (!calendarContainer) {
        console.error('No se encontró el contenedor del calendario');
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

    // Agrupar tareas por fecha en formato YYYY-M-D (sin ceros a la izquierda, igual que en los data-date)
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
            eventsContainer.innerHTML = `<div class="event-dot" title="${totalItems} evento(s)/tarea(s)"></div>`;
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

 ------------------------------ FIN NUEVO COSAS ALE ------------------------------ */


initHome();