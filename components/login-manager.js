/**
 * Login Manager con JWT
 */
class LoginManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.currentUser = null;
    this.restoreSession();
  }

  /**
   * Effettua il login
   */
  async login(username, password) {
    try {
      const result = await this.api.login(username, password);
      this.currentUser = { username: result.username };
      this.notifyLogin();
      return result;
    } catch (error) {
      this.currentUser = null;
      throw error;
    }
  }

  /**
   * Effettua il logout
   */
  logout() {
    this.api.logout();
    this.currentUser = null;
    this.notifyLogout();
  }

  /**
   * Ripristina la sessione da localStorage se disponibile
   */
  restoreSession() {
    if (this.api.isAuthenticated()) {
      const username = localStorage.getItem('username');
      if (username) {
        this.currentUser = { username };
        this.notifyLogin();
      }
    }
  }

  /**
   * Verifica se l'utente è loggato
   */
  isLoggedIn() {
    return !!this.currentUser;
  }

  /**
   * Notifica il login (dispone un evento personalizzato)
   */
  notifyLogin() {
    if (this.currentUser) {
      localStorage.setItem('username', this.currentUser.username);
      window.dispatchEvent(new CustomEvent('user:login', { detail: this.currentUser }));
    }
  }

  /**
   * Notifica il logout
   */
  notifyLogout() {
    localStorage.removeItem('username');
    window.dispatchEvent(new Event('user:logout'));
  }

  /**
   * Ottiene l'utente corrente
   */
  getCurrentUser() {
    return this.currentUser;
  }
}

// Esporta globalmente
window.LoginManager = LoginManager;
