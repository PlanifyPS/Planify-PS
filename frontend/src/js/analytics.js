

function loadTemplate(id, url) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fail loading ${url}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById(id).innerHTML = html;
        })
        .catch(error => console.error(error));
}
function load(){
    loadTemplate("analytics-sidebar-container", "../templates/sidebar.html");
}
