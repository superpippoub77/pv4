/**
 * LoginManager - Gestione del sistema di autenticazione
 * Separato dalla logica principale di SchemaEditor
 */
class LoginManager {
    constructor(options = {}) {
        this.users = [];
        this.currentUser = null;
        this.onLoginSuccess = options.onLoginSuccess || (() => { });
        this.onLogoutSuccess = options.onLogoutSuccess || (() => { });
        this.userDataUrl = options.userDataUrl || 'data/users.json';

        this.init();
    }

    /**
     * Inizializza il sistema di login
     */
    async init() {
        await this.loadUsers();
        this.setupEventListeners();

        // Controlla se c'è una sessione salvata
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            this.onLoginSuccess(savedUser);
        } else {
            this.showLoginModal();
        }
    }

    /**
     * Carica la lista degli utenti dal JSON
     */
    async loadUsers() {
        try {
            const response = await fetch(this.userDataUrl);
            if (!response.ok) {
                throw new Error(`Errore ${response.status}`);
            }
            const data = await response.json();
            this.users = data.users || [];
        } catch (error) {
            console.warn(`Impossibile caricare users.json: ${error.message}`);
            // Fallback con utenti di default
            this.users = [
                { username: 'admin', password: '1234' },
                { username: 'coach', password: '1234' }
            ];
        }
    }

    /**
     * Imposta gli event listener per il form di login
     */
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const logoutButton = document.getElementById('logoutButton');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });

            // Permetti di fare login premendo Enter
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            if (usernameInput) {
                usernameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        passwordInput.focus();
                    }
                });
            }

            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });
            }
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    /**
     * Mostra il modal di login
     */
    showLoginModal() {
        const modal = document.getElementById('login');
        if (modal) {
            modal.style.display = 'flex';
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.focus();
            }
        }
    }

    /**
     * Nasconde il modal di login
     */
    hideLoginModal() {
        const modal = document.getElementById('login');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Gestisce il processo di login
     */
    handleLogin() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorDiv = document.getElementById('loginError');

        if (!usernameInput || !passwordInput) {
            console.error('Elementi del form non trovati');
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Validazione base
        if (!username || !password) {
            this.showError('Inserisci username e password', errorDiv);
            return;
        }

        // Verifica credenziali
        const user = this.users.find(u =>
            u.username === username && u.password === password
        );

        if (user) {
            this.currentUser = username;
            sessionStorage.setItem('currentUser', username);

            // Nascondi errore
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }

            // Reset form
            usernameInput.value = '';
            passwordInput.value = '';

            this.hideLoginModal();
            this.showUserInfo(username);
            this.onLoginSuccess(username);
        } else {
            this.showError('Username o password non validi', errorDiv);
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    /**
     * Gestisce il logout
     */
    handleLogout() {
        if (!confirm('Sei sicuro di voler uscire?')) {
            return;
        }

        this.currentUser = null;
        sessionStorage.removeItem('currentUser');

        // Nascondi info utente
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.style.display = 'none';
        }

        this.showLoginModal();
        this.onLogoutSuccess();
    }

    /**
     * Mostra il messaggio di errore
     */
    showError(message, errorElement) {
        if (!errorElement) return;

        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Mostra le informazioni dell'utente loggato
     */
    showUserInfo(username) {
        const userInfo = document.getElementById('userInfo');
        const currentUsername = document.getElementById('currentUsername');

        if (currentUsername) {
            currentUsername.textContent = username;
        }

        if (userInfo) {
            userInfo.style.display = 'flex';
        }
    }

    /**
     * Ritorna l'utente corrente
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verifica se un utente è loggato
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Resetta lo stato di login
     */
    reset() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
    }

    // Verificare permessi utente
    isAdmin() {
        return this.currentUser === 'admin';
    }

    // Cambiare password (opzionale)
    changePassword(oldPassword, newPassword) {
        const user = this.users.find(u => u.username === this.currentUser);
        if (!user) return false;

        if (user.password !== oldPassword) {
            return false; // Password vecchia non corretta
        }

        user.password = newPassword;
        // Qui salveresti i dati su server
        return true;
    }

    // Ottenere info utente estese
    getUserInfo() {
        return {
            username: this.currentUser,
            isAdmin: this.isAdmin(),
            loginTime: new Date(),
            sessionId: sessionStorage.getItem('currentUser')
        };
    }
}