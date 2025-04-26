class Router {
    constructor() {
        this.globalScripts = [
            'points.js',
            'authFirebase.js',
            'header.js'
        ];

        this.routes = {
            '/register': {
                view: 'register.html',
                title: 'Register',
                scripts: ['register.js']
            },
            '/home': {
                view: 'home.html',
                title: 'Home',
                scripts: ['home.js']
            },
            '/setting': {
                view: 'setting.html',
                title: 'Settings',
                scripts: ['setting.js', 'profile.js']
            },
            '/habits': {
                view: 'habits.html',
                title: 'My Habits',
                scripts: ['habits.js',]
            },
            '/tasks': {
                view: 'habits.html',
                title: 'My Tasks',
                scripts: ['tasks.js']
            },
            '/challenges': {
                view: 'challenges.html',
                title: 'Weekly Challenges',
                scripts: ['challenges.js']
            },
            '/analytics': {
                view: 'analytics.html',
                title: 'Analytics',
                scripts: ['analytics.js']
            },
            '/forums': {
                view: 'foro.html',
                title: 'Forums',
                scripts: ['foro.js']
            },
            '/groups': {
                view: 'groups.html',
                title: 'Groups',
                scripts: ['groups.js']
            },
            '/groupChallenge': {
                view: 'groupChallenge.html',
                title: 'GroupChallenge',
                scripts: ['groupChallenge.js']
            },
            '/group-information': {
                view: 'groupInformation.html',
                title: 'Group Information',
                scripts: ['groupInformation.js']
            }
        };

        this.basePath = '../../frontend/src';
        this.loadedScripts = new Map();
        this.init();
    }

    async init() {
        this.setupEvents();
        await this.handleRoute();
    }

    async handleRoute() {
        const hash = window.location.hash || '#/register';
        const [path] = hash.slice(1).split('?');
        const route = this.routes[path];
        if (!route) {
            return this.showError(new Error('Página no encontrada'));
        }

        document.title = `Planify – ${route.title}`;
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

        const scriptsToLoad = [
            ...this.globalScripts,
            ...route.scripts.filter(s => !this.globalScripts.includes(s))
        ];

        await this.loadScripts(scriptsToLoad);
        if (scriptsToLoad.includes('points.js') && window.initPoints) {
            window.initPoints();
        }
        if (scriptsToLoad.includes('authFirebase.js') && window.initAuth) {
            window.initAuth();
        }
        if (scriptsToLoad.includes('header.js') && window.initHeader) {
            window.initHeader();
        }
        if (scriptsToLoad.includes('points.js') && window.setupTaskButton) {
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
