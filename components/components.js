class TeamManagementDialog extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <div id="teamDialog" class="team-dialog">
            <div class="team-dialog-header" id="teamDialogHeader">
                <h3>👥 Gestione Squadra</h3>
                <button class="team-dialog-close" id="closeTeamDialog">&times;</button>
            </div>

            <div class="team-dialog-body">
                <!-- Add Player Form -->
                <div class="team-form-section">
                    <h4>➕ Aggiungi Giocatore</h4>
                    <div class="team-form-row">
                        <label>Ruolo:</label>
                        <label>Numero:</label>
                        <label>Nome Completo:</label>
                        <label></label>
                    </div>

                    <div class="team-form-row">
                        <select id="newPlayerRole">
                            <option value="P1">P1 - Alzatore</option>
                            <option value="L1">L1 - Libero</option>
                            <option value="S1">S1 - Banda</option>
                            <option value="O">O - Opposto</option>
                            <option value="C1">C1 - Centro</option>
                            <option value="All">All - Allenatore</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>

                        <input type="number" id="newPlayerNumber" min="1" max="99" placeholder="N°">
                        <input type="text" id="newPlayerName" placeholder="Nome e Cognome">
                        <button id="addPlayerBtn">➕ Aggiungi</button>
                    </div>
                </div>

                <!-- Import from Text -->
                <div class="team-form-section">
                    <h4>📝 Importa da Testo</h4>
                    <p class="import-text-help">
                        Formato: Ruolo.Numero.Nome, Ruolo.Numero.Nome, ...<br>
                        <small>Esempio: P1.4.Mario Rossi, S1.10.Luigi Bianchi, L1.1.Paolo Verdi</small>
                    </p>
                    <div class="import-text-container">
                        <textarea id="playersImportText" 
                            rows="4" 
                            class="import-text-area"
                            placeholder="P1.4.Mario Rossi, S1.10.Luigi Bianchi, L1.1.Paolo Verdi"></textarea>
                        <button id="importPlayersFromTextBtn" class="btn-import-text">📥 Importa da Testo</button>
                    </div>
                </div>

                <!-- Players List -->
                <div class="team-form-section">
                    <h4>📋 Rosa Giocatori</h4>
                    <div class="team-list" id="teamPlayersList"></div>
                </div>

                <div class="team-actions">
                    <input type="file" id="importTeamFile" accept=".json" style="display: none;">
                    <button class="btn-import" id="importTeamBtn">📥 Importa</button>
                    <button class="btn-export" id="exportTeamBtn">📤 Esporta</button>
                    <button class="btn-clear" id="clearTeamBtn">🗑️ Cancella Tutto</button>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define("team-management-dialog", TeamManagementDialog);
