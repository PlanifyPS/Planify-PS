import ProgressBar from 'https://cdn.jsdelivr.net/npm/progressbar.js/+esm';

document.addEventListener("DOMContentLoaded", function () {
    let container = document.getElementById("progress-circle");

    const bar = new ProgressBar.Circle(container, {
        strokeWidth: 6,
        easing: "easeInOut",
        duration: 1400,
        color: "#FFEA82",
        trailColor: "#eee",
        trailWidth: 1,
        svgStyle: null
    });

    bar.animate(1.0);
});