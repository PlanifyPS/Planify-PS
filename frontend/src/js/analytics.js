import ProgressBar from 'https://cdn.jsdelivr.net/npm/progressbar.js/+esm';

function initHome() {
    if (document.readyState === 'complete') {
        loadAnalytics();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            loadAnalytics();
        });
    }
}

function loadAnalytics() {
    loadCircleProgressBars();
    loadProgressBarCharts();

    // Responsive handling with debounce
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            loadProgressBarCharts();
        }, 200); // 200ms for faster response
    });
}

function loadCircleProgressBars() {
    localStorage.setItem("habitsJson", JSON.stringify(0.8));
    localStorage.setItem("tasksJson", JSON.stringify(0.6));
    const habits = document.getElementById("habits-circle-progress");
    const tasks = document.getElementById("tasks-circle-progress");

    const habitsCircleBar = new ProgressBar.Circle(habits, {
        strokeWidth: 12,
        easing: "easeInOut",
        duration: 1000,
        color: "#0077B6",
        svgStyle: null,
        text:{
            value: '0%',
            className: 'circle-progress-text',
        }
    });

    const tasksCircleBar = new ProgressBar.Circle(tasks, {
        strokeWidth: 12,
        easing: "easeInOut",
        duration: 1000,
        color: "#0077B6",
        svgStyle: null,
        text:{
            value: '0%',
            className: 'circle-progress-text',
        }
    });

    habitsCircleBar.animate(localStorage.getItem("habitsJson"), {
        step: function(state, bar) {
            bar.setText(Math.round(bar.value() * 100) + '%');
        }
    });

    tasksCircleBar.animate(localStorage.getItem("tasksJson"), {
        step: function(state, bar) {
            bar.setText(Math.round(bar.value() * 100) + '%');
        }
    });
}

function loadProgressBarCharts() {
    // Sample data
    const habitsData = [
        { day: 'Lun', value: 0.4 },
        { day: 'Mar', value: 0.3 },
        { day: 'Mié', value: 0.5 },
        { day: 'Jue', value: 0.2 },
        { day: 'Vie', value: 0.6 },
        { day: 'Sáb', value: 0.4 },
        { day: 'Dom', value: 0.3 }
    ];

    const tasksData = [
        { day: 'Lun', value: 0.7 },
        { day: 'Mar', value: 0.5 },
        { day: 'Mié', value: 0.4 },
        { day: 'Jue', value: 0.8 },
        { day: 'Vie', value: 0.6 },
        { day: 'Sáb', value: 0.3 },
        { day: 'Dom', value: 0.2 }
    ];

    createBarChart('habits-BarChart', habitsData, 'Hábitos');
    createBarChart('tasks-BarChart', tasksData, 'Tareas');
}

function createBarChart(containerId, data, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const barsContainer = document.createElement('div');
    barsContainer.className = 'bars-container';
    container.appendChild(barsContainer);

    const daysLabelsContainer = document.createElement('div');
    daysLabelsContainer.className = 'days-labels-container';
    container.appendChild(daysLabelsContainer);

    data.forEach(item => {
        const barWrapper = document.createElement('div');
        barWrapper.className = 'bar-wrapper';
        barsContainer.appendChild(barWrapper);

        const valueLabel = document.createElement('div');
        valueLabel.className = 'value-label';
        valueLabel.textContent = Math.round(item.value * 10);
        barWrapper.appendChild(valueLabel);

        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';
        barWrapper.appendChild(barContainer);

        const bar = new ProgressBar.Line(barContainer, {
            strokeWidth: 10,
            easing: 'easeInOut',
            duration: 1000,
            color: '#0077B6',
            trailColor: '#E5F8FC',
            trailWidth: 8,
            svgStyle: { width: '100%', height: '100%' },
            vertical: true
        });

        bar.animate(item.value);

        const dayLabel = document.createElement('div');
        dayLabel.className = 'day-label';
        dayLabel.textContent = item.day;
        daysLabelsContainer.appendChild(dayLabel);
    });

    const yAxisLabel = document.createElement('div');
    yAxisLabel.className = 'y-axis-label';
    yAxisLabel.textContent = label + ' completados';
    container.appendChild(yAxisLabel);
}

initHome();