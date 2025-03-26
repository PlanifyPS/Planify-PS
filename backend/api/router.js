class Router {
    constructor() {
        this.routes = {
            '/register': {
                view: 'register.html',
                title: 'Registro',
                scripts: ['register.js'] // Solo register.js
            },
            '/home': {
                view: 'home.html',
                title: 'Inicio',
                scripts: ['home.js', 'points.js'] // Script principal + points.js
            },
            '/setting': {
                view: 'setting.html',
                title: 'Configuración',
                scripts: ['setting.js', 'points.js']
            },
            '/habits': {
                view: 'habits.html',
                title: 'Mis Hábitos',
                scripts: ['habits.js', 'points.js']
            },
            '/challenges': {
                view: 'challenges.html',
                title: 'Desafíos Semanales',
                scripts: ['challenges.js', 'points.js']
            },
            '/analytics': {
                view: 'analytics.html',
                title: 'Analíticas',
                scripts: ['analytics.js', 'points.js']
            },
            '/forums': {
                view: 'foro.html',
                title: 'Foros',
                scripts: ['foro.js', 'points.js']
            }
        };
        this.basePath = '../../frontend/src';
        this.loadedScripts = new Map(); // Para manejar múltiples scripts
        this.currentStyle = null;
        this.init();
    }

    async init() {
        try {
            this.setupEvents();
            await this.handleRoute();
        } catch (error) {
            this.showError(error);
        }
    }

    async handleRoute() {
        const path = window.location.hash.slice(1) || '/home';
        const route = this.routes[path];

        if (!route) {
            this.showError(new Error('Página no encontrada'));
            return;
        }

        document.title = `Planify - ${route.title}`;

        // Limpiar el contenido anterior
        document.getElementById('app').innerHTML = '';

        // Cargar la vista primero
        await this.loadView(route);

        // Cargar componentes comunes (excepto en register)
        if (path !== '/register') {
            await this.loadComponents();
        }

        // Cargar todos los scripts necesarios
        await this.loadScripts(route.scripts);
    }

    async loadComponents() {
        try {
            await Promise.all([
                this.loadFile('templates/sidebar.html', 'sidebar-container'),
                this.loadFile('templates/header.html', 'main-header')
            ]);
        } catch (error) {
            console.error('Error loading components:', error);
        }
    }

    async loadView(route) {
        try {
            await this.loadFile(`views/${route.view}`, 'app');
        } catch (error) {
            throw new Error(`Error loading view: ${route.view}`);
        }
    }

    async loadFile(path, targetId) {
        const fullPath = `${this.basePath}/${path}`;
        const response = await fetch(fullPath);
        if (!response.ok) throw new Error(`Error loading ${path}`);
        document.getElementById(targetId).innerHTML = await response.text();
    }

    async loadScripts(scriptNames) {
        // Limpiar solo los scripts que no se van a usar nuevamente
        this.cleanupUnusedScripts(scriptNames);

        // Cargar cada script secuencialmente
        for (const scriptName of scriptNames) {
            // Si ya está cargado, no lo cargamos de nuevo
            if (!this.loadedScripts.has(scriptName)) {
                await this.loadScript(scriptName);
            }
        }
    }

    async loadScript(scriptName) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = `${this.basePath}/js/${scriptName}`;
            script.type = 'module';

            script.onload = () => {
                this.loadedScripts.set(scriptName, script);
                resolve();
            };

            script.onerror = (err) => {
                console.error(`Error loading script ${scriptName}:`, err);
                resolve();
            };

            document.body.appendChild(script);
        });
    }

    cleanupUnusedScripts(neededScripts) {
        // Eliminar scripts que no se necesitan en esta ruta
        Array.from(this.loadedScripts.keys()).forEach(loadedScript => {
            if (!neededScripts.includes(loadedScript)) {
                const scriptElement = this.loadedScripts.get(loadedScript);
                if (scriptElement && scriptElement.parentNode) {
                    scriptElement.parentNode.removeChild(scriptElement);
                }
                this.loadedScripts.delete(loadedScript);
            }
        });
    }

    setupEvents() {
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    showError(error) {
        document.getElementById('app').innerHTML = `
            <div class="error">
                <h2>Error al cargar la página</h2>
                <p>${error.message}</p>
                <a href="#/home">Volver al inicio</a>
            </div>
        `;
    }
}

new Router();