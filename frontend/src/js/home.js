import { auth, db } from '../../../backend/utils/firebase_config.js';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, where, getDoc } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';


const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];

function initHome() {
    if (document.readyState === 'complete') {
        initCalendar();
        setupEventDialogListeners();
        loadUserHabits();

        const chartBars = document.querySelectorAll('.chart-bar');
        chartBars.forEach(bar => {
            bar.setAttribute('data-value', '0');
        });

        loadHabitsProgressChart();

        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        updateTaskList(formattedDate);
        initNotificationToast();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initCalendar();
            setupEventDialogListeners();
            loadUserHabits();

            const chartBars = document.querySelectorAll('.chart-bar');
            chartBars.forEach(bar => {
                bar.setAttribute('data-value', '0');
            });

            loadHabitsProgressChart();

            const today = new Date();
            const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            updateTaskList(formattedDate);
            initNotificationToast();
        });
    }
}

async function loadUserHabits() {
    const habitsGrid = document.querySelector('.habits-grid');

    habitsGrid.innerHTML = '<p>Loading habits...</p>';

    onAuthStateChanged(auth, async (user) => {

        try {
            const userDoc = doc(db, 'Users', user.uid);
            const userSnap = await getDoc(userDoc);

            if (!userSnap.exists()) {
                habitsGrid.innerHTML = `
                    <div class="no-habits-message">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No habits found. Add some habits to get started!</p>
                    </div>
                `;
                return;
            }

            const userData = userSnap.data();
            const habits = userData.habits || {};

            if (Object.keys(habits).length === 0) {
                habitsGrid.innerHTML = `
                    <div class="no-habits-message">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No habits found. Add some habits to get started!</p>
                    </div>
                `;
                return;
            }

            habitsGrid.innerHTML = '';

            Object.entries(habits).forEach(([habitId, habitData]) => {
                const habitCard = createHabitCard(habitId, habitData);
                habitsGrid.appendChild(habitCard);
            });
        } catch (error) {
            console.error('Error loading habits:', error);
            habitsGrid.innerHTML = '<p>Error loading habits. Please try again later.</p>';
        }
    });
}

function createHabitCard(habitId, habitData) {
    const iconClass = getHabitIcon(habitData.category);
    const isCompleted = habitData.completed === true;

    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;


    const habitCard = document.createElement('div');
    habitCard.className = 'habit-card';
    habitCard.setAttribute('data-habit-id', habitId);

    habitCard.innerHTML = `
        <div class="habit-header">
            <span>${habitData.title}</span>
        </div>
        <div class="habit-image ${isCompleted ? 'completed' : ''}">
            <i class="${iconClass} habit-icon-large"></i>
            <span class="habit-label">${habitData.frequency || 'Daily'}</span>
            ${isCompleted ? '<div class="completed-badge"><i class="fas fa-check"></i></div>' : ''}
        </div>
        <div class="habit-details">
            <div class="habit-description">${habitData.description || 'No description'}</div>
            <div class="habit-category">${habitData.category || 'Other'}</div>
            <div class="habit-status">
                Status: ${isCompleted ? '<span class="status-completed">Completed today</span>' : '<span class="status-pending">Pending</span>'}
            </div>
        </div>
    `;

    return habitCard;
}

function getHabitIcon(category) {
    const iconMap = {
        'wellness': 'fas fa-heart',
        'fitness': 'fas fa-dumbbell',
        'education': 'fas fa-book',
        'other': 'fas fa-star',
        'social': 'fas fa-users',
        'career': 'fas fa-briefcase'
    };


    return iconMap[category?.toLowerCase()] || 'fas fa-check-circle';
}

function getLastNDates(n) {
    const arr = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        arr.push(d);
    }
    return arr;
}

function groupSum(records, keyFn) {
    return records.reduce((acc, r) => {
        const k = keyFn(r);
        acc[k] = (acc[k] || 0) + 1;
        return acc;
    }, {});
}

function loadHabitsProgressChart() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            const chartBars = document.querySelectorAll('.chart-bar');
            chartBars.forEach(bar => {
                bar.style.height = '0%';
                bar.setAttribute('data-value', '0');
            });
            return;
        }

        try {
            const snaps = await getDocs(collection(db, 'Users', user.uid, 'habitsHistory'));
            const dates = snaps.docs.map(d =>
                new Date(d.data().timestamp.seconds * 1000)
            );

            const last7Dates = getLastNDates(7);
            const grouped = groupSum(dates, d => d.toISOString().slice(0, 10));
            const dailyCounts = last7Dates.map(d =>
                grouped[d.toISOString().slice(0, 10)] || 0
            );

            const maxExpectedHabits = 10;
            const percentages = dailyCounts.map(count =>
                Math.min(Math.round((count / maxExpectedHabits) * 100), 100)
            );

            const dayLabels = last7Dates.map(d =>
                d.toLocaleDateString('en-US', { weekday: 'short' })
            );

            updateHomeChart(percentages, dayLabels, dailyCounts);
        } catch (error) {
            console.error('Error loading habits progress chart:', error);
            const chartBars = document.querySelectorAll('.chart-bar');
            chartBars.forEach(bar => {
                bar.style.height = '0%';
                bar.setAttribute('data-value', '0');
            });
        }
    });
}

function updateHomeChart(percentages, dayLabels, counts) {
    const chartBars = document.querySelectorAll('.chart-bar');
    const chartLabels = document.querySelectorAll('.chart-label');

    chartBars.forEach((bar, index) => {
        if (index < percentages.length) {
            const percentage = percentages[index];
            const count = counts[index];

            bar.style.height = `${percentage}%`;
            bar.setAttribute('data-value', `${count}`);
        } else {
            bar.style.height = '0%';
            bar.setAttribute('data-value', '0');
        }
    });

    chartLabels.forEach((label, index) => {
        if (index < dayLabels.length) {
            label.textContent = dayLabels[index];
        }
    });
}

async function getEventsFromFirebase(userId, date = null) {
    try {
        let eventsQuery;

        if (date) {
            eventsQuery = query(
                collection(db, 'Users', userId, 'events'),
                where('date', '==', date)
            );
        } else {
            eventsQuery = collection(db, 'Users', userId, 'events');
        }

        const querySnapshot = await getDocs(eventsQuery);

        const events = {};
        querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            const eventDate = eventData.date;

            if (!events[eventDate]) {
                events[eventDate] = [];
            }

            events[eventDate].push({
                id: doc.id,
                name: eventData.name,
                time: eventData.time || ''
            });
        });

        return events;
    } catch (error) {
        console.error('Error getting events from Firebase:', error);
        return {};
    }
}

async function addEventToFirebase(userId, date, name, time) {
    try {
        const eventRef = await addDoc(collection(db, 'Users', userId, 'events'), {
            date: date,
            name: name,
            time: time || '',
            createdAt: new Date()
        });

        return eventRef.id;
    } catch (error) {
        console.error('Error adding event to Firebase:', error);
        return null;
    }
}

async function updateEventInFirebase(userId, eventId, name, time) {
    try {
        const eventRef = doc(db, 'Users', userId, 'events', eventId);
        await updateDoc(eventRef, {
            name: name,
            time: time || '',
            updatedAt: new Date()
        });

        return true;
    } catch (error) {
        console.error('Error updating event in Firebase:', error);
        return false;
    }
}

async function deleteEventFromFirebase(userId, eventId) {
    try {
        await deleteDoc(doc(db, 'Users', userId, 'events', eventId));
        return true;
    } catch (error) {
        console.error('Error deleting event from Firebase:', error);
        return false;
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

        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                alert('You must be logged in to edit events');
                return;
            }

            const eventId = editEventId.value;
            const name = editEventName.value;
            const time = editEventTime.value;
            const date = editEventDate.value;

            const success = await updateEventInFirebase(user.uid, eventId, name, time);

            if (success) {
                await displayEvents();
                await updateTaskList(date);
                editDialog.style.display = 'none';
                home.classList.remove('modal-open');
            } else {
                alert('Failed to update event. Please try again.');
            }
        });
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

        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                alert('You must be logged in to add events');
                return;
            }

            const date = eventDate.value;
            const name = eventName.value;
            const time = eventTime.value;

            const eventId = await addEventToFirebase(user.uid, date, name, time);

            if (eventId) {
                await displayEvents();
                await updateTaskList(date);
                eventDialog.style.display = 'none';
                home.classList.remove('modal-open');
            } else {
                alert('Failed to add event. Please try again.');
            }
        });
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

        // Only process if this is an event (not a task)
        if (taskItem.querySelector('.task-icon').textContent !== '📆') {
            return;
        }

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

        editBtn.addEventListener('click', async () => {
            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    alert('You must be logged in to edit events');
                    return;
                }

                // Find the event in Firebase
                const events = await getEventsFromFirebase(user.uid, dateString);
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
        });

        deleteBtn.addEventListener('click', async () => {
            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    alert('You must be logged in to delete events');
                    return;
                }

                // Find the event in Firebase
                const events = await getEventsFromFirebase(user.uid, dateString);
                const dateEvents = events[dateString] || [];

                const eventToDelete = dateEvents.find(event =>
                    event.name === eventName && event.time === eventTime
                );

                if (eventToDelete) {
                    const success = await deleteEventFromFirebase(user.uid, eventToDelete.id);

                    if (success) {
                        await displayEvents();
                        await updateTaskList(dateString);
                    } else {
                        alert('Failed to delete event. Please try again.');
                    }
                }
            });
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

async function displayEvents() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // Clear all events if not logged in
            const days = document.querySelectorAll('.day:not(.empty)');
            days.forEach(day => {
                const eventsContainer = day.querySelector('.day-events');
                eventsContainer.innerHTML = '';
                day.classList.remove('has-events');
            });
            return;
        }

        try {
            const events = await getEventsFromFirebase(user.uid);
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
        } catch (error) {
            console.error('Error displaying events:', error);
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
    onAuthStateChanged(auth, async (user) => {
        try {
            const events = await getEventsFromFirebase(user.uid, dateString);
            let dayEvents = events[dateString] || [];

            document.querySelector('.day.selected')?.classList.remove('selected');
            const selectedDay = document.querySelector(`.day[data-date="${dateString}"]`);
            selectedDay?.classList.add('selected');

            const taskList = document.querySelector('.task-list');
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
        } catch (error) {
            console.error('Error updating task list:', error);

            const taskList = document.querySelector('.task-list');
            if (!taskList) return;

            taskList.innerHTML = `<div class="task-item">
                <div class="task-icon">ℹ️</div>
                <span>There are no events</span>
                <span></span>
            </div>`;
        }
    });
}




async function initNotificationToast() {
    const toast = document.getElementById('notification-toast');
    const closeBtn = document.getElementById('close-toast-button');
    if (toast && closeBtn) {
        toast.classList.remove('hidden');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('hidden');
        });
    }
}

initHome();