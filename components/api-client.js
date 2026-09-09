/**
 * API Client con JWT Authentication
 */
class APIClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Effettua login e salva il token JWT
   */
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login fallito');
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('auth_token', this.token);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout - rimuove il token
   */
  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Verifica se l'utente è autenticato
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Richiesta generica con autenticazione
   */
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Token scaduto o non valido
        this.logout();
        window.dispatchEvent(new Event('auth:logout'));
        throw new Error('Sessione scaduta');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  // ===== USERS API =====
  async getUsers() {
    return this.request('/users.php');
  }

  async getUser(username) {
    return this.request(`/users.php/${username}`);
  }

  async createUser(username, password, salt, expiration) {
    return this.request('/users.php', {
      method: 'POST',
      body: JSON.stringify({ username, password, salt, expiration })
    });
  }

  // ===== CONFIG API =====
  async getConfig(key = 'app_config') {
    return this.request(`/config.php?key=${encodeURIComponent(key)}`);
  }

  async setConfig(key, value) {
    return this.request('/config.php', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    });
  }

  // ===== EXERCISES API =====
  async getExercises() {
    return this.request('/exercises.php');
  }

  async getExercise(id) {
    return this.request(`/exercises.php/${id}`);
  }

  async createExercise(name, category, sport, description, data) {
    return this.request('/exercises.php', {
      method: 'POST',
      body: JSON.stringify({ name, category, sport, description, data })
    });
  }
}

// Esporta il client globalmente
window.APIClient = APIClient;
