class Router {
    constructor() {
        alert("Router inicializado"); // Depuración
        this.routes = {
            '/home': 'home.html',
            '/register': 'register.html',
            '/setting': 'setting.html',
            '/habits': 'habits.html',
            '/challenges': 'challenges.html',
            '/analytics': 'analytics.html'
        };
        this.basePath = '../../frontend/src';
        this.init();
    }

    async init() {
        alert("Iniciando router"); // Depuración
        await this.loadComponents();
        this.setupEvents();
        this.handleRoute();
    }

    async loadComponents() {
        try {
            alert("Cargando sidebar y header"); // Depuración
            await Promise.all([
                this.loadFile('templates/sidebar.html', 'sidebar-container'),
                this.loadFile('templates/header.html', 'main-header')
            ]);
        } catch (error) {
            alert(`Error cargando componentes: ${error.message}`); // Depuración
            console.error(error);
        }
    }

    async loadFile(path, targetId) {
        const fullPath = `${this.basePath}/${path}`;
        alert(`Intentando cargar: ${fullPath}`); // Depuración

        const response = await fetch(fullPath);
        if (!response.ok) throw new Error(`Error loading ${path}`);

        const html = await response.text();
        document.getElementById(targetId).innerHTML = html;
        alert(`${path} cargado correctamente`); // Depuración
    }

    async handleRoute() {
        const path = window.location.hash.slice(1) || '/home';
        alert(`Manejando ruta: ${path}`); // Depuracion

        if (this.routes[path]) {
            await this.loadView(this.routes[path]);
            this.loadScript(path);
        } else {
            alert(`Ruta no encontrada: ${path}`); // Depuración
            this.showError();
        }
    }

    async loadView(view) {
        try {
            alert(`Cargando vista: ${view}`); // Depuración
            await this.loadFile(`views/${view}`, 'app');
        } catch (error) {
            alert(`Error cargando vista: ${error.message}`); // Depuración
            this.showError();
        }
    }

    loadScript(path) {
        const scriptMap = {
            '/challenges': 'challenges.js',
            '/habits': 'habits.js',
            '/setting': 'setting.js',
            '/analytics': 'analytics.js'
        };

        if (scriptMap[path]) {
            alert(`Cargando script: ${scriptMap[path]}`); // Depuración
            const script = document.createElement('script');
            script.src = `${this.basePath}/js/${scriptMap[path]}`;
            script.type = 'module';
            script.onload = () => alert(`${scriptMap[path]} cargado correctamente`); // Depuración
            script.onerror = () => alert(`Error cargando ${scriptMap[path]}`); // Depuración
            document.body.appendChild(script);
        }
    }

    setupEvents() {
        window.addEventListener('hashchange', () => {
            alert('Cambio de hash detectado'); // Depuración
            this.handleRoute();
        });
    }

    showError() {
        document.getElementById('app').innerHTML = `
            <div class="error">
                <h2>Error al cargar la página</h2>
                <a href="#/home">Volver al inicio</a>
            </div>
        `;
    }
}

// Inicialización
new Router();