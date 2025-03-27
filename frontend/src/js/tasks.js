function initHome() {
    if (document.readyState === 'complete') {
        initTextContent();
        initModal();
        loadUserTasks().then();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initTextContent();
            initModal();
            loadUserTasks().then();
        });
    }
}

function initTextContent() {
    document.getElementById("TitleHabitsTasks").textContent = "Tasks"
    document.getElementById("add-button").textContent = "Add Tasks"
    document.getElementById("addNewTitle").textContent = "Add New Task"
}

function initModal() {
    let openModalButton = document.getElementById('add-button');
    let modal = document.getElementById('AddTaskModal');
    let closeTaskButton = document.getElementById('closeTaskButton')
    let saveTaskButton = document.getElementById('saveTask');
    
    openModalButton.addEventListener('click', () => {modal.style.display = 'flex';});
    closeTaskButton.addEventListener('click', () => {modal.style.display = 'none'; clearInputs()});
    saveTaskButton.addEventListener('click', () => {saveHabit();});
}

function clearInputs() {
    document.getElementById('NewTaskTitle').value = '';
    document.getElementById('TaskDescription').value = '';
}

function reloadUserTasks() {
     document.getElementById("user-content").innerHTML = '';
     loadUserTasks().then();
}

function saveHabit() {
    
    const title = document.getElementById("NewTaskTitle").value.trim().toString();
    const description = document.getElementById("TaskDescription").value.trim().toString();
    const dueDate = document.getElementById("TaskDueDate").value;

    if (!title  || !description) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const tasks = JSON.parse(localStorage.getItem("UserTasks")) || [];
    const newTask = { title, description, dueDate };
    tasks.push(newTask);
    localStorage.setItem("UserTasks", JSON.stringify(tasks));
    document.getElementById('AddTaskModal').style.display = 'none';
    clearInputs();
    reloadUserTasks();
    

}

async function loadUserTasks() {

    let userTasks = localStorage.getItem('UserTasks');
    userTasks = JSON.parse(userTasks);
    console.log(userTasks);
    for (const task of userTasks) {
        await addTemplate("user-content", "../src/templates/habitsItem.html", task)
        
    }
}


async function addTemplate(id, url, item) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fail loading ${url}`);

        const container = document.getElementById(id);
        const newElement = document.createElement("div");
        newElement.innerHTML = await response.text();
        newElement.querySelector(".habits-task-title").textContent = item.title;
        container.appendChild(newElement);

    } catch (error) {
        console.log(error);
    }
}
initHome();