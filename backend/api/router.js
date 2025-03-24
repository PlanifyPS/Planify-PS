class Router {
    constructor() {
        this.routes = {}; // Almacenará las rutas y sus vistas
        this.init();
    }

    // Método para agregar una ruta
    addRoute(path, view) {
        this.routes[path] = view;
    }

    // Método para cargar una vista
    async loadView(view) {
        const response = await fetch(view);
        const html = await response.text();
        document.getElementById('app').innerHTML = html;
    }

    // Método para cargar el sidebar
    async loadSidebar() {
        const response = await fetch('../../frontend/src/templates/sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-container').innerHTML = html;
    }

    async loadHeader() {
        const response = await fetch('../../frontend/src/templates/header.html');
        const html = await response.text();
        document.getElementById('main-header').innerHTML = html;  // Asegúrate que coincide con el ID del HTML
    }

    handleRoute() {
        const path = window.location.hash.slice(1) || '/home'; // Obtener el hash sin el "#"
        const view = this.routes[path]; // Obtener la vista correspondiente

        if (view) {
            this.loadView(view); // Cargar la vista
        } else {
            document.getElementById('app').innerHTML = '<h1>404 - Página no encontrada</h1>';
        }
    }

    // Método para inicializar el router
    init() {
        // Definir las rutas y sus vistas
        this.addRoute('/home', '../../frontend/src/views/home.html');
        this.addRoute('/register', '../../frontend/src/views/register.html');
        this.addRoute('/setting', '../../frontend/src/views/setting.html');
        this.addRoute('/habits', '../../frontend/src/views/habits.html');
        this.addRoute('/challenges', '../../frontend/src/views/challenges.html');

        // Cargar el sidebar
        this.loadSidebar();
        this.loadHeader();

        // Escuchar cambios en el hash
        window.addEventListener('hashchange', () => this.handleRoute());

        // Manejar la ruta inicial al cargar la página
        this.handleRoute();
    }
}

// Inicializar el router
new Router();