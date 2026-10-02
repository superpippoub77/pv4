/**
 * LoginManager - Accesso con account veri (come SpikeCut)
 * Registrazione, accesso, recupero password via email e sessione ricordata,
 * tramite le API in cloud/ (token JWT conservato nel browser).
 * Separato dalla logica principale di SchemaEditor.
 */
class LoginManager {
    constructor(options = {}) {
        this.currentUser = null; // nome utente (stringa), come prima
        this.user = null;        // { id, username, email, isAdmin }
        this.offline = false;    // entrato senza server (libreria non disponibile)
        this.onLoginSuccess = options.onLoginSuccess || (() => { });
        this.onLogoutSuccess = options.onLogoutSuccess || (() => { });
        this.mainContainerId = options.mainContainerId || 'container';
        this.pendingResetToken = null;
        window.loginManager = this;

        this.init();
    }

    createLogin() {
        const container = document.createElement("div");
        container.id = "login";
        container.className = "login-modal";
        container.innerHTML = `
                <!-- Login Modal - VolleyProW4 Edition -->
                <div class="volley-bg"></div>
                <div class="volley-ball"></div>

                <div class="login-content">
                    <h2 class="login-title" data-i18n="local_login_title">
                        Benvenuto in <span class="highlight">VolleyPro<span class="w4">W4</span></span>
                    </h2>
                    <h3 class="login-subtitle" data-i18n="local_login_subtitle">
                        Editor Professionale per Allenatori di Pallavolo
                    </h3>

                    <div class="login-checking" id="loginChecking">Verifica dell'accesso…</div>

                    <form id="loginForm" class="login-view" data-view="login" style="display:none;">
                        <div class="login-field">
                            <label for="username">Nome utente o email</label>
                            <input type="text" id="username" name="username" autocomplete="username" required>
                        </div>
                        <div class="login-field">
                            <label for="password">Password</label>
                            <div class="login-pw"><input type="password" id="password" name="password" autocomplete="current-password" required><button type="button" class="login-eye" data-target="password" title="Mostra/nascondi password">👁</button></div>
                        </div>
                        <label class="login-check"><input type="checkbox" id="loginRemember" checked> Ricordami su questo dispositivo</label>
                        <div class="login-error" id="loginError"></div>
                        <button type="submit" class="login-button">Accedi</button>
                        <div class="login-links">
                            <a href="#" data-goto="forgot">Password dimenticata?</a><br>
                            Non hai un account? <a href="#" data-goto="register">Registrati</a>
                        </div>
                    </form>

                    <form id="registerForm" class="login-view" data-view="register" style="display:none;">
                        <div class="login-field"><label for="regUsername">Nome utente</label><input type="text" id="regUsername" autocomplete="username" required></div>
                        <div class="login-field"><label for="regEmail">Email</label><input type="email" id="regEmail" autocomplete="email" required></div>
                        <div class="login-field">
                            <label for="regPassword">Password (almeno 6 caratteri)</label>
                            <div class="login-pw"><input type="password" id="regPassword" autocomplete="new-password" required><button type="button" class="login-eye" data-target="regPassword" title="Mostra/nascondi password">👁</button></div>
                        </div>
                        <div class="login-error" id="registerError"></div>
                        <button type="submit" class="login-button">Crea account</button>
                        <div class="login-links">Hai già un account? <a href="#" data-goto="login">Accedi</a></div>
                    </form>

                    <form id="forgotForm" class="login-view" data-view="forgot" style="display:none;">
                        <p class="login-info">Inserisci l'email del tuo account: se registrata, riceverai un link per reimpostare la password.</p>
                        <div class="login-field"><label for="forgotEmail">Email</label><input type="email" id="forgotEmail" autocomplete="email" required></div>
                        <div class="login-error" id="forgotError"></div>
                        <div class="login-ok" id="forgotSuccess"></div>
                        <button type="submit" class="login-button">Invia link di recupero</button>
                        <div class="login-links"><a href="#" data-goto="login">Torna all'accesso</a></div>
                    </form>

                    <form id="resetForm" class="login-view" data-view="reset" style="display:none;">
                        <p class="login-info">Scegli la nuova password per il tuo account.</p>
                        <div class="login-field"><label for="resetPassword">Nuova password (almeno 6 caratteri)</label><input type="password" id="resetPassword" autocomplete="new-password" required></div>
                        <div class="login-field"><label for="resetPasswordConfirm">Conferma password</label><input type="password" id="resetPasswordConfirm" autocomplete="new-password" required></div>
                        <div class="login-error" id="resetError"></div>
                        <button type="submit" class="login-button">Imposta nuova password</button>
                    </form>

                    <div class="login-offline" id="loginOffline" style="display:none;">
                        <p>Il server degli account non risponde. Puoi usare l'editor senza account: la libreria online resterà disattivata.</p>
                        <button type="button" class="login-button login-button-ghost" id="loginOfflineBtn">Continua senza account</button>
                    </div>
                </div>
            `;
        document.body.prepend(container);
    }

    // ============================================================
    // AVVIO
    // ============================================================
    async init() {
        this.createLogin();
        this.setupEventListeners();

        // Link "reimposta password" ricevuto via email
        const params = new URLSearchParams(location.search);
        if (params.get('reset')) {
            this.pendingResetToken = params.get('reset');
            this.hideApp();
            this.showLoginModal('reset');
            return;
        }

        // Sessione ricordata: il token salvato è ancora valido?
        if (CloudApi.getToken()) {
            this.hideLoginModal();
            try {
                const data = await CloudApi.get('me.php');
                if (data.user) {
                    this.enter(data.user);
                    return;
                }
                CloudApi.setToken(null);
            } catch (err) {
                if (err.offline) {
                    // Server irraggiungibile: si entra con l'ultimo utente, senza libreria
                    const cached = CloudApi.getCachedUser();
                    if (cached) {
                        this.enter(cached, { offline: true });
                        return;
                    }
                }
            }
        }

        this.hideApp();
        this.showLoginModal('login');
    }

    /** Entra nell'app con l'utente indicato */
    enter(user, opts = {}) {
        this.user = user;
        this.currentUser = user.username;
        this.offline = !!opts.offline;
        CloudApi.setCachedUser(user);
        this.hideLoginModal();
        this.showApp();
        this.showUserInfo(user.username);
        window.dispatchEvent(new CustomEvent('pv4:user', { detail: user }));
        this.onLoginSuccess(user.username);
    }

    // ============================================================
    // EVENTI
    // ============================================================
    setupEventListeners() {
        const root = document.getElementById('login');
        root.querySelectorAll('[data-goto]').forEach(a => {
            a.addEventListener('click', (e) => { e.preventDefault(); this.showLoginModal(a.dataset.goto); });
        });
        root.querySelectorAll('.login-eye').forEach(btn => {
            btn.addEventListener('click', () => {
                const inp = document.getElementById(btn.dataset.target);
                const showing = inp.type === 'text';
                inp.type = showing ? 'password' : 'text';
                btn.textContent = showing ? '👁' : '🙈';
            });
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });
        document.getElementById('registerForm').addEventListener('submit', (e) => { e.preventDefault(); this.handleRegister(); });
        document.getElementById('forgotForm').addEventListener('submit', (e) => { e.preventDefault(); this.handleForgot(); });
        document.getElementById('resetForm').addEventListener('submit', (e) => { e.preventDefault(); this.handleReset(); });
        document.getElementById('loginOfflineBtn').addEventListener('click', () => {
            const cached = CloudApi.getCachedUser();
            this.enter(cached || { id: null, username: 'ospite', email: '', isAdmin: false }, { offline: true });
        });

        // Accesso scaduto mentre si lavora: si resta nell'editor, la libreria chiede di accedere di nuovo
        window.addEventListener('pv4:auth-expired', () => {
            if (this.user) this.offline = true;
        });

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) logoutButton.addEventListener('click', () => this.handleLogout());
    }

    showError(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('login-ok');
        el.textContent = message;
        el.style.display = message ? 'block' : 'none';
    }

    /** Mostra un errore; se il server non risponde propone di continuare senza account */
    showServerError(id, err) {
        this.showError(id, err.message);
        document.getElementById('loginOffline').style.display = err.offline ? '' : 'none';
    }

    async handleLogin() {
        const identifier = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('loginRemember').checked;
        this.showError('loginError', '');
        if (!identifier || !password) {
            this.showError('loginError', 'Inserisci nome utente (o email) e password.');
            return;
        }
        try {
            const data = await CloudApi.post('login.php', { identifier, password, remember });
            CloudApi.setToken(data.token);
            document.getElementById('password').value = '';
            this.enter(data.user);
        } catch (err) {
            this.showServerError('loginError', err);
            document.getElementById('password').focus();
        }
    }

    async handleRegister() {
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        this.showError('registerError', '');
        try {
            const data = await CloudApi.post('register.php', { username, email, password });
            CloudApi.setToken(data.token);
            document.getElementById('regPassword').value = '';
            this.enter(data.user);
        } catch (err) {
            this.showServerError('registerError', err);
        }
    }

    async handleForgot() {
        const email = document.getElementById('forgotEmail').value.trim();
        this.showError('forgotError', '');
        const ok = document.getElementById('forgotSuccess');
        ok.style.display = 'none';
        try {
            const data = await CloudApi.post('forgot_password.php', { email });
            ok.textContent = data.message;
            ok.style.display = 'block';
        } catch (err) {
            this.showServerError('forgotError', err);
        }
    }

    async handleReset() {
        const pw1 = document.getElementById('resetPassword').value;
        const pw2 = document.getElementById('resetPasswordConfirm').value;
        this.showError('resetError', '');
        if (pw1.length < 6) { this.showError('resetError', 'La password deve avere almeno 6 caratteri.'); return; }
        if (pw1 !== pw2) { this.showError('resetError', 'Le due password non coincidono.'); return; }
        try {
            await CloudApi.post('reset_password.php', { token: this.pendingResetToken, password: pw1 });
            this.pendingResetToken = null;
            history.replaceState(null, '', location.pathname);
            this.showLoginModal('login');
            this.showError('loginError', '');
            const info = document.getElementById('loginError');
            info.textContent = 'Password reimpostata: accedi con la nuova password.';
            info.style.display = 'block';
            info.classList.add('login-ok');
        } catch (err) {
            this.showServerError('resetError', err);
        }
    }

    /**
     * Gestisce il logout
     */
    async handleLogout() {
        if (!confirm('Sei sicuro di voler uscire?')) return;

        try { if (!this.offline) await CloudApi.post('logout.php', {}); } catch (err) { /* si esce comunque */ }
        CloudApi.setToken(null);
        CloudApi.setCachedUser(null);
        this.user = null;
        this.currentUser = null;
        this.offline = false;
        window.dispatchEvent(new CustomEvent('pv4:user', { detail: null }));

        this.hideApp();
        this.showLoginModal('login');

        const userInfo = document.getElementById('userInfo');
        if (userInfo) userInfo.style.display = 'none';

        this.onLogoutSuccess();
    }

    // ============================================================
    // VISUALIZZAZIONE
    // ============================================================
    showLoginModal(view = 'login') {
        const modal = document.getElementById('login');
        if (!modal) return;
        modal.style.display = 'flex';
        document.getElementById('loginChecking').style.display = 'none';
        modal.querySelectorAll('.login-view').forEach(f => { f.style.display = f.dataset.view === view ? '' : 'none'; });
        const first = modal.querySelector(`.login-view[data-view="${view}"] input`);
        if (first) setTimeout(() => first.focus(), 30);
    }

    hideLoginModal() {
        const modal = document.getElementById('login');
        if (modal) modal.style.display = 'none';
    }

    showUserInfo(username) {
        const userInfo = document.getElementById('userInfo');
        const currentUsername = document.getElementById('currentUsername');
        if (currentUsername) currentUsername.textContent = username;
        if (userInfo) userInfo.style.display = 'flex';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    /** Collegato al server (libreria disponibile) */
    isOnline() {
        return !!this.user && !this.offline && !!CloudApi.getToken();
    }

    reset() {
        this.currentUser = null;
        this.user = null;
        CloudApi.setToken(null);
    }

    isAdmin() {
        return !!(this.user && this.user.isAdmin);
    }

    getUserInfo() {
        return {
            username: this.currentUser,
            email: this.user ? this.user.email : '',
            isAdmin: this.isAdmin(),
            loginTime: new Date()
        };
    }

    hideApp() {
        const app = document.getElementById(this.mainContainerId);
        if (app) app.classList.add('hidden');
    }

    showApp() {
        const app = document.getElementById(this.mainContainerId);
        if (app) app.classList.remove('hidden');
    }
}
