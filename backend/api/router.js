class Router {
    constructor() {
        this.routes = {
            '/register': { view: 'register.html', title: 'Registro', script: 'register.js', },
            '/home': { view: 'home.html', title: 'Inicio', script: 'home.js', },
            '/setting': { view: 'setting.html', title: 'Configuración', script: 'setting.js', },
            '/habits': { view: 'habits.html', title: 'Mis Hábitos', script: 'habits.js' },
            '/challenges': {
                view: 'challenges.html',
                title: 'Desafíos Semanales',
                script: 'challenges.js',
            },
            '/analytics': { view: 'analytics.html', title: 'Analíticas', script: 'analytics.js' },
            '/forums': { view: 'foro.html', title: 'Foros', script: 'foro.js' }
        };
        this.basePath = '../../frontend/src';
        this.currentScript = null;
        this.currentStyle = null;
        this.init();
    }

    async init() {
        try {
            await this.loadComponents();
            this.setupEvents();
            await this.handleRoute();
        } catch (error) {
            this.showError(error);
        }
    }

    async loadComponents() {
        await Promise.all([
            this.loadFile('templates/sidebar.html', 'sidebar-container'),
            this.loadFile('templates/header.html', 'main-header')
        ]);
    }

    async loadFile(path, targetId) {
        const fullPath = `${this.basePath}/${path}`;

        const response = await fetch(fullPath);
        if (!response.ok) throw new Error(`Error loading ${path}`);

        const html = await response.text();
        document.getElementById(targetId).innerHTML = html;
    }

    async handleRoute() {
        const path = window.location.hash.slice(1) || '/home';
        const route = this.routes[path];

        if (route) {
            document.title = `Planify - ${route.title}`;
            document.getElementById('app').innerHTML = '';
            await this.loadView(route);
            await this.loadAssets(route);

            if (path !== '/register') {
                await this.loadComponents();
            }
        } else {
            this.showError(new Error('Página no encontrada'));
        }
    }

    async loadView(route) {
        try {
            await this.loadFile(`views/${route.view}`, 'app');
        } catch (error) {
            throw error;
        }
    }

    async loadAssets(route) {
        if (this.currentScript) {
            this.currentScript.remove();
            this.currentScript = null;
        }
        if (this.currentStyle) {
            this.currentStyle.remove();
            this.currentStyle = null;
        }

        if (route.styles) {
            this.currentStyle = document.createElement('link');
            this.currentStyle.rel = 'stylesheet';
            this.currentStyle.href = `${this.basePath}/css/${route.styles}`;
            document.head.appendChild(this.currentStyle);
        }

        if (route.script) {
            return new Promise((resolve) => {
                this.currentScript = document.createElement('script');
                this.currentScript.src = `${this.basePath}/js/${route.script}`;
                this.currentScript.type = 'module';
                this.currentScript.onload = () => {
                    resolve();
                };
                this.currentScript.onerror = (err) => {
                    resolve();
                };
                document.body.appendChild(this.currentScript);
            });
        }
        return Promise.resolve();
    }

    setupEvents() {
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });
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