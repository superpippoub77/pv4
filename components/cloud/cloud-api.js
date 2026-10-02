/**
 * Accesso al server (cartella cloud/): account utente e libreria esercizi.
 * Stesso funzionamento di SpikeCut: dopo l'accesso il server rilascia un
 * token JWT che il browser conserva e ripresenta ad ogni richiesta
 * (header "Authorization: Bearer …").
 */
const CLOUD_API_BASE = 'cloud/';
const AUTH_TOKEN_KEY = 'pv4-jwt';
const AUTH_USER_KEY = 'pv4-user'; // ultimo utente collegato (solo per l'uso senza connessione)

const CloudApi = {
    getToken() {
        try { return localStorage.getItem(AUTH_TOKEN_KEY); } catch (err) { return null; }
    },
    setToken(token) {
        try {
            if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
            else localStorage.removeItem(AUTH_TOKEN_KEY);
        } catch (err) { /* best-effort */ }
    },
    getCachedUser() {
        try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch (err) { return null; }
    },
    setCachedUser(user) {
        try {
            if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
            else localStorage.removeItem(AUTH_USER_KEY);
        } catch (err) { /* best-effort */ }
    },

    /**
     * Chiamata all'API. Errore con .offline = true se il server non risponde
     * (pagina aperta senza PHP, nessuna connessione…).
     */
    async fetch(path, opts) {
        opts = Object.assign({}, opts || {});
        const token = this.getToken();
        opts.headers = Object.assign({}, opts.headers || {}, token ? { 'Authorization': 'Bearer ' + token } : {});
        let res;
        try {
            res = await fetch(CLOUD_API_BASE + path, opts);
        } catch (err) {
            const e = new Error('Impossibile contattare il server: controlla la connessione.');
            e.offline = true;
            throw e;
        }
        let data = null;
        try { data = await res.json(); } catch (e) { /* risposta non JSON */ }
        if (!data) {
            const e = new Error('Il server non risponde correttamente (manca la cartella "cloud/" con le pagine PHP?).');
            e.offline = true;
            throw e;
        }
        if (res.status === 401 && token && path !== 'login.php' && path !== 'logout.php') {
            // accesso scaduto o revocato
            this.setToken(null);
            window.dispatchEvent(new CustomEvent('pv4:auth-expired'));
        }
        if (!res.ok || data.ok === false) {
            const e = new Error(data.error ? data.error : ('Errore del server (' + res.status + ').'));
            e.status = res.status;
            throw e;
        }
        return data;
    },

    post(path, body) {
        return this.fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    },

    get(path) {
        return this.fetch(path, { method: 'GET' });
    }
};

window.CloudApi = CloudApi;
