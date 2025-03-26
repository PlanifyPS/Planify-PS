if (!localStorage.getItem('points')) {
    localStorage.setItem('points', '0');
}

function updatePoints() {
    const points = localStorage.getItem('points');
    document.getElementById('points').innerText = `${points}pts`;
}

function incrementPoints() {
    let points = parseInt(localStorage.getItem('points')) || 0;
    points += 1;
    localStorage.setItem('points', points.toString());
    updatePoints();
}

document.addEventListener('DOMContentLoaded', function() {
    updatePoints();
    document.querySelectorAll('.complete-task-button').forEach(button => {
        button.addEventListener('click', function() {

            document.dispatchEvent(new CustomEvent('taskCompleted'));
        });
    });
});

document.addEventListener('taskCompleted', incrementPoints);