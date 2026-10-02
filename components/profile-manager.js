/**
 * Profile Manager - Profilo dell'utente collegato
 * I dati stanno nell'account sul server (cloud/profile.php), come login e libreria.
 */
class ProfileManager {
  constructor() {
    this.profile = null;
  }

  /**
   * Carica il profilo dal server
   */
  async loadProfile() {
    const data = await CloudApi.get('profile.php');
    this.profile = data.profile || {};
    return { profile: this.profile };
  }

  /**
   * Aggiorna il profilo utente
   */
  async updateProfile(data) {
    const result = await CloudApi.post('profile.php', data);
    this.profile = result.profile || {};
    window.dispatchEvent(new CustomEvent('profile:updated', { detail: this.profile }));
    return this.profile;
  }

  /**
   * Ottieni il nome completo
   */
  getFullName() {
    return `${this.profile?.first_name || ''} ${this.profile?.last_name || ''}`.trim();
  }

  escape(s) {
    return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /**
   * Crea l'HTML del profilo
   */
  createProfileHTML() {
    const p = this.profile || {};
    const e = (v) => this.escape(v);
    const field = 'width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;';
    const label = 'display: block; font-weight: bold; margin-bottom: 5px;';
    const role = p.isAdmin
      ? '🛠 <b>Amministratore</b> — trovi «Amministrazione» nel menu 👤.'
      : 'Utente. <span style="color:#888;">L\'amministratore è il primo account registrato (oppure quelli indicati in ADMIN_USERS in cloud/config.php).</span>';

    return `
      <div style="padding: 20px; max-width: 600px;">
        <h3>👤 ${e(p.username)}</h3>
        <p style="margin: 4px 0 0; font-size: 13px;">${role}</p>

        <form id="profileForm" style="display: grid; gap: 15px; margin-top: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label for="firstName" style="${label}">Nome:</label>
              <input type="text" id="firstName" value="${e(p.first_name)}" style="${field}">
            </div>
            <div>
              <label for="lastName" style="${label}">Cognome:</label>
              <input type="text" id="lastName" value="${e(p.last_name)}" style="${field}">
            </div>
          </div>

          <div>
            <label for="email" style="${label}">📧 Email (anche per accedere e recuperare la password):</label>
            <input type="email" id="email" value="${e(p.email)}" style="${field}">
          </div>

          <div>
            <label for="phone" style="${label}">📱 Telefono:</label>
            <input type="tel" id="phone" value="${e(p.phone)}" style="${field}">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label for="position" style="${label}">Ruolo:</label>
              <input type="text" id="position" value="${e(p.position)}" placeholder="es: Allenatore, Vice allenatore" style="${field}">
            </div>
            <div>
              <label for="team" style="${label}">🏐 Squadra:</label>
              <input type="text" id="team" value="${e(p.team)}" placeholder="es: Under 16 femminile" style="${field}">
            </div>
          </div>

          <div>
            <label for="bio" style="${label}">Bio:</label>
            <textarea id="bio" rows="4" style="${field} font-family: inherit;">${e(p.bio)}</textarea>
          </div>

          <div id="profileMessage" style="display: none; padding: 10px; border-radius: 4px; margin-bottom: 10px;"></div>

          <button type="submit" style="background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            💾 Salva Profilo
          </button>
        </form>
      </div>
    `;
  }

  showError(message) {
    if (!window.createWindow) return;
    window.createWindow({
      title: 'Profilo',
      contentHTML: `<p style="padding: 20px;">${this.escape(message)}</p>`,
      size: 'sm'
    });
  }

  /**
   * Mostra il dialog del profilo
   */
  async showProfileDialog() {
    const lm = window.loginManager;
    if (!lm || !lm.isOnline()) {
      this.showError('Il profilo si trova nel tuo account sul server: sei entrato senza account o il server non risponde. Esci e accedi di nuovo quando sei collegato.');
      return;
    }
    try {
      await this.loadProfile(); // sempre aggiornato (l'account può essere cambiato)
    } catch (error) {
      this.showError('Impossibile caricare il profilo: ' + error.message);
      return;
    }

    // Una finestra già aperta mostrerebbe dati vecchi: la ricreo
    document.getElementById('profileDialog')?.remove();
    document.querySelector('.overlay-for-profileDialog')?.remove();

    window.createWindow({
      title: '👤 Profilo Utente',
      id: 'profileDialog',
      contentHTML: this.createProfileHTML(),
      size: 'md',
      modal: true
    });
    setTimeout(() => {
      document.getElementById('profileForm')?.addEventListener('submit', (e) => this.handleProfileSubmit(e));
    }, 100);
  }

  /**
   * Gestisce il submit del form profilo
   */
  async handleProfileSubmit(e) {
    e.preventDefault();

    const data = {
      first_name: document.getElementById('firstName').value,
      last_name: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      position: document.getElementById('position').value,
      team: document.getElementById('team').value,
      bio: document.getElementById('bio').value
    };

    const message = document.getElementById('profileMessage');
    try {
      await this.updateProfile(data);
      if (window.loginManager && window.loginManager.user) window.loginManager.user.email = this.profile.email;
      message.textContent = '✅ Profilo salvato con successo!';
      message.style.background = '#efe';
      message.style.color = '#0a0';
      message.style.display = 'block';
      setTimeout(() => { message.style.display = 'none'; }, 3000);
    } catch (error) {
      message.textContent = '❌ Errore: ' + error.message;
      message.style.background = '#fee';
      message.style.color = '#c00';
      message.style.display = 'block';
    }
  }
}

// Esporta globalmente
window.ProfileManager = ProfileManager;
