document.getElementById("TitleHabitsTasks").textContent = "Tasks"
document.getElementById("add-button").textContent = "Add Tasks"
document.getElementById("addNewTitle").textContent = "Add New Task"

document.getElementById('add-button').addEventListener('click', function() {
    document.getElementById('AddTaskModal').style.display = 'flex';

    document.getElementById('closeTaskButton').addEventListener('click', function() {
        document.getElementById('AddTaskModal').style.display = 'none';
    });

    document.getElementById('saveTask').addEventListener('click', function() {
        const title = document.getElementById("NewTaskTitle").value.trim();
        const description = document.getElementById("TaskDescription").value.trim();

        if (!title  || !description) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const Task = JSON.parse(localStorage.getItem("UserTasks")) || [];
        const newTask = { title, description };
        Task.push(newTask);
        localStorage.setItem("UserTasks", JSON.stringify(Task));
        document.getElementById('AddTaskModal').style.display = 'none';
    });

});