class Router {
    constructor() {
        this.routes = {}; // Almacenará las rutas y sus vistas
        this.init();
    }

    addRoute(path, view) {
        this.routes[path] = view;
    }

    async loadView(view) {
        const response = await fetch(view);
        const html = await response.text();
        const appContainer = document.getElementById("app");
        appContainer.innerHTML = html;

        // Esperar a que la vista se haya cargado antes de ejecutar scripts
        this.handleScripts();
    }

    async loadSidebar() {
        const response = await fetch("../../frontend/src/templates/sidebar.html");
        const html = await response.text();
        document.getElementById("sidebar-container").innerHTML = html;
    }

    async loadHeader() {
        const response = await fetch("../../frontend/src/templates/header.html");
        const html = await response.text();
        document.getElementById("main-header").innerHTML = html;
    }

    handleRoute() {
        const path = window.location.hash.slice(1) || "/home";
        const view = this.routes[path];

        if (view) {
            this.loadView(view);
        } else {
            document.getElementById("app").innerHTML = "<h1>404 - Página no encontrada</h1>";
        }
    }

    handleScripts() {
        const currentPath = window.location.hash.slice(1);

        // Si estamos en la página de desafíos, cargamos el JS de desafíos
        if (currentPath === "/challenges") {
            this.loadChallengeScript();
        }
    }

    loadChallengeScript() {
        const scriptId = "challenge-script";

        // Si el script ya está cargado, lo eliminamos para recargarlo
        let oldScript = document.getElementById(scriptId);
        if (oldScript) {
            oldScript.remove();
        }

        // Crear un nuevo script y adjuntarlo al body
        let newScript = document.createElement("script");
        newScript.id = scriptId;
        newScript.src = "../../frontend/src/js/challenges.js";
        newScript.defer = true;

        document.body.appendChild(newScript);
    }

    init() {
        this.addRoute("/home", "../../frontend/src/views/home.html");
        this.addRoute("/register", "../../frontend/src/views/register.html");
        this.addRoute("/setting", "../../frontend/src/views/setting.html");
        this.addRoute("/habits", "../../frontend/src/views/habits.html");
        this.addRoute("/challenges", "../../frontend/src/views/challenges.html");

        this.loadSidebar();
        this.loadHeader();

        window.addEventListener("hashchange", () => this.handleRoute());

        this.handleRoute();
    }
}

new Router();
