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

function addEvent(date, eventName, time) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');

    if (!events[date]) {
        events[date] = [];
    }

    events[date].push({
        name: eventName,
        time: time
    });

    localStorage.setItem('calendarEvents', JSON.stringify(events));
    displayEvents();
}

function displayEvents() {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    const days = document.querySelectorAll('.day:not(.empty)');

    days.forEach(day => {
        const date = day.getAttribute('data-date');
        const dayEvents = events[date] || [];
        const eventsContainer = day.querySelector('.day-events');

        eventsContainer.innerHTML = '';

        if (dayEvents.length > 0) {
            day.classList.add('has-events');
            if (dayEvents.length === 1) {
                eventsContainer.innerHTML = `<div class="event-dot" title="${dayEvents[0].name} - ${dayEvents[0].time}"></div>`;
            } else {
                eventsContainer.innerHTML = `<div class="event-count">+${dayEvents.length}</div>`;
            }
        }
    });

    updateTaskList();
}

function updateTaskList() {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    const taskList = document.querySelector('.task-list');
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

    const todaysEvents = events[dateString] || [];

    taskList.innerHTML = '';

    todaysEvents.forEach(event => {
        taskList.innerHTML += `
      <div class="task-item">
        <div class="task-icon">📆</div>
        <span>${event.name}</span>
        <span>${event.time}</span>
      </div>
    `;
    });

    if (todaysEvents.length === 0) {
        taskList.innerHTML = `
      <div class="task-item">
        <div class="task-icon">ℹ️</div>
        <span>No hay tareas para hoy</span>
        <span></span>
      </div>
    `;
    }
}

function initCalendar() {
    const today = new Date();
    const calendarContainer = document.getElementById('calendar-container');

    calendarContainer.innerHTML = createCalendar(today.getFullYear(), today.getMonth());

    document.addEventListener('click', function(e) {
        const target = e.target;

        if (target.id === 'prev-month' || target.id === 'next-month') {
            const currentMonth = document.querySelector('.calendar-header h3').textContent.split(' ')[0];
            const monthIndex = monthNames.indexOf(currentMonth);
            const currentYear = parseInt(document.querySelector('.calendar-header h3').textContent.split(' ')[1]);

            let newMonth, newYear;

            if (target.id === 'prev-month') {
                newMonth = monthIndex === 0 ? 11 : monthIndex - 1;
                newYear = monthIndex === 0 ? currentYear - 1 : currentYear;
            } else {
                newMonth = monthIndex === 11 ? 0 : monthIndex + 1;
                newYear = monthIndex === 11 ? currentYear + 1 : currentYear;
            }

            calendarContainer.innerHTML = createCalendar(newYear, newMonth);
            displayEvents();
        }

        if (target.classList.contains('day') && !target.classList.contains('empty')) {
            const date = target.getAttribute('data-date');
            document.getElementById('event-date').value = date;
            document.getElementById('event-dialog').style.display = 'block';
        }

        if (target.classList.contains('close-btn')) {
            document.getElementById('event-dialog').style.display = 'none';
        }
    });

    document.querySelector('.event-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const date = document.getElementById('event-date').value;
        const name = document.getElementById('event-name').value;
        const time = document.getElementById('event-time').value;

        addEvent(date, name, time);
        document.getElementById('event-dialog').style.display = 'none';

        document.getElementById('event-name').value = '';
    });

    displayEvents();
}

document.addEventListener('DOMContentLoaded', initCalendar);