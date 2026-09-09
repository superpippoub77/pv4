/**
 * Profile Manager - Gestione profilo utente
 */
class ProfileManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.profile = null;
    this.teams = [];
  }

  /**
   * Carica il profilo e i team disponibili
   */
  async loadProfile() {
    try {
      const [profileData, teamsData] = await Promise.all([
        this.api.getProfile(),
        this.api.getTeams()
      ]);

      this.profile = profileData;
      this.teams = teamsData.teams || [];
      
      return {
        profile: this.profile,
        teams: this.teams
      };
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
      throw error;
    }
  }

  /**
   * Aggiorna il profilo utente
   */
  async updateProfile(data) {
    try {
      const result = await this.api.updateProfile(
        data.first_name || '',
        data.last_name || '',
        data.email || '',
        data.phone || '',
        data.team_id || null,
        data.position || '',
        data.bio || ''
      );

      this.profile = result;
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: this.profile }));
      
      return result;
    } catch (error) {
      console.error('Errore aggiornamento profilo:', error);
      throw error;
    }
  }

  /**
   * Ottieni il nome completo
   */
  getFullName() {
    return `${this.profile?.first_name || ''} ${this.profile?.last_name || ''}`.trim();
  }

  /**
   * Crea l'HTML del profilo
   */
  createProfileHTML() {
    const profile = this.profile || {};
    const teamOptions = this.teams.map(t => `<option value="${t.id}"${t.id == profile.team_id ? ' selected' : ''}>${t.name}</option>`).join('');

    return `
      <div style="padding: 20px; max-width: 600px;">
        <h3>👤 Profilo Utente</h3>
        
        <form id="profileForm" style="display: grid; gap: 15px; margin-top: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label for="firstName" style="display: block; font-weight: bold; margin-bottom: 5px;">Nome:</label>
              <input type="text" id="firstName" value="${profile.first_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label for="lastName" style="display: block; font-weight: bold; margin-bottom: 5px;">Cognome:</label>
              <input type="text" id="lastName" value="${profile.last_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>

          <div>
            <label for="email" style="display: block; font-weight: bold; margin-bottom: 5px;">📧 Email:</label>
            <input type="email" id="email" value="${profile.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>

          <div>
            <label for="phone" style="display: block; font-weight: bold; margin-bottom: 5px;">📱 Telefono:</label>
            <input type="tel" id="phone" value="${profile.phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label for="position" style="display: block; font-weight: bold; margin-bottom: 5px;">Ruolo:</label>
              <input type="text" id="position" value="${profile.position || ''}" placeholder="es: Palleggiatore" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label for="team" style="display: block; font-weight: bold; margin-bottom: 5px;">⚽ Squadra:</label>
              <select id="team" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">-- Seleziona squadra --</option>
                ${teamOptions}
              </select>
            </div>
          </div>

          <div>
            <label for="bio" style="display: block; font-weight: bold; margin-bottom: 5px;">Bio:</label>
            <textarea id="bio" rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: Arial;">${profile.bio || ''}</textarea>
          </div>

          <div id="profileMessage" style="display: none; padding: 10px; border-radius: 4px; margin-bottom: 10px;"></div>

          <button type="submit" style="background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            💾 Salva Profilo
          </button>
        </form>

        ${profile.team_name ? `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <h4 style="margin: 0 0 10px 0;">Squadra</h4>
            <p><strong>${profile.team_name}</strong></p>
            <p style="color: #666; font-size: 13px;">${profile.team_sport || 'Sport'}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Mostra il dialog del profilo
   */
  async showProfileDialog() {
    try {
      if (!this.profile) {
        await this.loadProfile();
      }

      const html = this.createProfileHTML();

      if (window.createWindow) {
        const dialog = window.createWindow({
          title: '👤 Profilo Utente',
          id: 'profileDialog',
          contentHTML: html,
          size: 'md',
          modal: true
        });

        // Aggiungi listener al form
        setTimeout(() => {
          const form = document.getElementById('profileForm');
          if (form) {
            form.addEventListener('submit', (e) => this.handleProfileSubmit(e));
          }
        }, 100);
      }
    } catch (error) {
      console.error('Errore apertura profilo:', error);
      if (window.createWindow) {
        window.createWindow({
          title: 'Errore',
          contentHTML: `<p style="padding: 20px; color: #c00;">Errore caricamento profilo: ${error.message}</p>`,
          size: 'sm'
        });
      }
    }
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
      team_id: document.getElementById('team').value || null,
      bio: document.getElementById('bio').value
    };

    try {
      await this.updateProfile(data);
      
      const message = document.getElementById('profileMessage');
      message.textContent = '✅ Profilo salvato con successo!';
      message.style.background = '#efe';
      message.style.color = '#0a0';
      message.style.display = 'block';
      
      setTimeout(() => {
        message.style.display = 'none';
      }, 3000);
    } catch (error) {
      const message = document.getElementById('profileMessage');
      message.textContent = '❌ Errore: ' + error.message;
      message.style.background = '#fee';
      message.style.color = '#c00';
      message.style.display = 'block';
    }
  }
}

// Esporta globalmente
window.ProfileManager = ProfileManager;
