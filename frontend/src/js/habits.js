function initHome() {
    if (document.readyState === 'complete') {
        initTextContent();
        initModal();
        loadUserHabit().then();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initTextContent();
            initModal();
            loadUserHabit().then();
        });
    }
}

function initTextContent() {
    document.getElementById("TitleHabitsTasks").textContent = "Habits"
}

function initModal() {
    let openModalButton = document.getElementById('add-button');
    let modal = document.getElementById('AddHabitModal');
    let closeHabitButton = document.getElementById('closeHabitButton')
    let saveHabitButton = document.getElementById('saveHabit');

    openModalButton.addEventListener('click', () => {modal.style.display = 'flex'; console.log("test")});
    closeHabitButton.addEventListener('click', () => {modal.style.display = 'none'; clearInputs()});
    saveHabitButton.addEventListener('click', () => {saveHabit();});
}

function clearInputs() {
    document.getElementById('NewHabitTitle').value = '';
    document.getElementById('HabitDescription').value = '';
}

function reloadUserHabits() {
    document.getElementById("user-content").innerHTML = '';
    loadUserHabit().then();
}

function saveHabit() {

    const title = document.getElementById("NewHabitTitle").value.trim().toString();
    const description = document.getElementById("HabitDescription").value.trim().toString();
    const dueDate = document.getElementById("HabitFrequency").value;

    if (!title  || !description) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const habits = JSON.parse(localStorage.getItem("UserHabits")) || [];
    const newHabit = { title, description, dueDate };
    habits.push(newHabit);
    localStorage.setItem("UserHabits", JSON.stringify(habits));
    document.getElementById('AddHabitModal').style.display = 'none';
    clearInputs();
    reloadUserHabits();


}

async function loadUserHabit() {

    let userHabits = localStorage.getItem('UserHabits') ;
    userHabits = JSON.parse(userHabits);
    for (const habit of userHabits) {
        await addTemplate("user-content", "../src/templates/habitsItem.html", habit)

    }
}


async function addTemplate(id, url, item) {
    try {
        const response = await fetch(url);
        if (!response.ok) new Error(`Fail loading ${url}`);

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