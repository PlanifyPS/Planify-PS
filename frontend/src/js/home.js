const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function initHome() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'complete') {
        initCalendar();
    } else {
        document.addEventListener('DOMContentLoaded', initCalendar);
    }
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
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
        </div>
        <div class="days">
    `;

    // Ajustar para que la semana empiece en lunes
    let startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Días vacíos al inicio
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += `<div class="day empty"></div>`;
    }

    // Días del mes
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
        console.error('No se encontró el contenedor del calendario');
        return;
    }

    // Generar calendario inicial
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

        if (dayEvents.length > 0) {
            day.classList.add('has-events');
            eventsContainer.innerHTML = `<div class="event-dot" title="${dayEvents.length} evento(s)"></div>`;
        }
    });
}

function setupEventListeners() {
    // Navegación entre meses
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

        // Selección de día
        if (e.target.classList.contains('day') && !e.target.classList.contains('empty')) {
            const date = e.target.getAttribute('data-date');
            updateTaskList(date);
        }
    });
}

function updateTaskList(dateString) {
    const events = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
    const dayEvents = events[dateString] || [];
    const taskList = document.querySelector('.task-list');

    if (!taskList) return;

    taskList.innerHTML = dayEvents.length > 0
        ? dayEvents.map(event => `
            <div class="task-item">
                <div class="task-icon">📆</div>
                <span>${event.name}</span>
                <span>${event.time}</span>
            </div>
        `).join('')
        : `<div class="task-item">
            <div class="task-icon">ℹ️</div>
            <span>No hay eventos</span>
            <span></span>
          </div>`;
}

// Iniciar cuando se carga la página
initHome();