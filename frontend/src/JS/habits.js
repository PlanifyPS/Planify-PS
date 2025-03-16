function loadTemplate(id, url) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fail loading ${url}`);
            }
            return response.text();
        })
        .then(html => {
            const container = document.getElementById(id);
            const newElement = document.createElement('div'); 
            newElement.innerHTML = html; 
            container.appendChild(newElement);
        })
        .catch(error => console.error(error));
}

function loadHabits(){
    for (let i = 0; i < 100; i++) {
        loadTemplate("user-habits", "templates/habitsItem.html");
    }
}