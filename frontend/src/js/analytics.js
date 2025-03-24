import ProgressBar from 'https://cdn.jsdelivr.net/npm/progressbar.js/+esm';

/// REVISAR: LAS GRAFICAS SOLO CARGAN AL REFRESCAR LA PAGINA Y NO CUANDO SE ACCEDE A ELLA
document.addEventListener("DOMContentLoaded", function () {

    localStorage.setItem("habitsJson", JSON.stringify(0.8))
    localStorage.setItem("tasksJson", JSON.stringify(0.6))
    let habits = document.getElementById("habits-circle-progress");
    let tasks = document.getElementById("tasks-circle-progress");

    const habitsCircleBar = new ProgressBar.Circle(habits, {
        strokeWidth: 15,
        easing: "easeInOut",
        duration: 1600,
        color: "#FFEA82",
        trailColor: "#0077B4",
        trailWidth: 1,
        svgStyle: null,
        text:{
            value: '0%',
            className: 'circle-progress-text',
        }

    });
    const CircleBar = new ProgressBar.Circle(tasks, {
        strokeWidth: 15,
        easing: "easeInOut",
        duration: 1600,
        color: "#FFEA82",
        trailColor: "#0077B4",
        trailWidth: 1,
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
        CircleBar.animate(localStorage.getItem("tasksJson"), {
            step: function(state, bar) {
                bar.setText(Math.round(bar.value() * 100) + '%');
            }
        })
});
