class Router {
    constructor() {
        this.routes = {
            '/register': {
                view: 'register.html',
                title: 'Registro',
                scripts: ['register.js', 'authFirebase.js']
            },
            '/home': {
                view: 'home.html',
                title: 'Inicio',
                scripts: ['home.js', 'points.js', 'authFirebase.js']
            },
            '/setting': {
                view: 'setting.html',
                title: 'Configuración',
                scripts: ['setting.js', 'points.js', 'authFirebase.js']
            },
            '/habits': {
                view: 'habits.html',
                title: 'Mis Hábitos',
                scripts: ['habits.js', 'points.js', 'authFirebase.js']
            },
            '/tasks': {
                view: 'habits.html',
                title: 'Mis Tareas',
                scripts: ['tasks.js', 'points.js', 'authFirebase.js']
            },
            '/challenges': {
                view: 'challenges.html',
                title: 'Desafíos Semanales',
                scripts: ['challenges.js', 'points.js', 'authFirebase.js']
            },
            '/analytics': {
                view: 'analytics.html',
                title: 'Analíticas',
                scripts: ['analytics.js', 'points.js', 'authFirebase.js']
            },
            '/forums': {
                view: 'foro.html',
                title: 'Foros',
                scripts: ['foro.js', 'points.js', 'authFirebase.js']
            }
        };
        this.basePath = '../../frontend/src';
        this.loadedScripts = new Map();
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
        const path = window.location.hash.slice(1) || '/register';
        const route = this.routes[path];

        if (!route) {
            this.showError(new Error('Página no encontrada'));
            return;
        }

        document.title = `Planify - ${route.title}`;
        document.getElementById('app').innerHTML = '';

        if (path === '/register') {
            document.body.classList.add('full-screen');
        } else {
            document.body.classList.remove('full-screen');
        }

        await this.loadView(route);

        if (path !== '/register') {
            await this.loadComponents();
        }

        await this.loadScripts(route.scripts);

        if (route.scripts.includes('points.js') && window.initPoints) {
            window.initPoints();
        }

        await this.loadScripts(route.scripts);
        if (window.setupTaskButton) {
            window.setupTaskButton();
        }
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
        this.cleanupUnusedScripts(scriptNames);

        for (const scriptName of scriptNames) {
            if (!this.loadedScripts.has(scriptName)) {
                await this.loadScript(scriptName);
            }

            const module = this.loadedScripts.get(scriptName);
            if (module && typeof module.init === 'function') {
                module.init();
            }
        }
    }


    async loadScript(scriptName) {
        try {
            const module = await import(`${this.basePath}/js/${scriptName}?t=${Date.now()}`);
            this.loadedScripts.set(scriptName, module);
        } catch (error) {
            console.error(`Error loading script ${scriptName}:`, error);
        }
    }


    cleanupUnusedScripts(neededScripts) {
        this.loadedScripts.forEach((_, scriptName) => {
            if (!neededScripts.includes(scriptName)) {
                this.loadedScripts.delete(scriptName);
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