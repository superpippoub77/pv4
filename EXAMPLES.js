/**
 * ESEMPI DI UTILIZZO - PV4 Backend PHP con JWT
 * 
 * Questo file contiene esempi pratici di come usare
 * il nuovo backend PHP con autenticazione JWT
 */

// ============================================
// 1. INIZIALIZZAZIONE
// ============================================

// Creare istanze dei client
const apiClient = new APIClient('/api');
const loginManager = new LoginManager(apiClient);

// ============================================
// 2. LOGIN / LOGOUT
// ============================================

// Effettuare login
async function login() {
    try {
        const result = await loginManager.login('admin', '1234');
        console.log('Login riuscito:', result);
        // Output: { token: "eyJhbGc...", username: "admin" }
        
        // Il token è automaticamente salvato in localStorage
        console.log('Token salvato:', apiClient.token);
    } catch (error) {
        console.error('Login fallito:', error.message);
    }
}

// Logout
function logout() {
    loginManager.logout();
    console.log('Logout completato');
    // Token rimosso da localStorage e memoria
}

// Controllare se l'utente è loggato
if (loginManager.isLoggedIn()) {
    const user = loginManager.getCurrentUser();
    console.log('Utente loggato:', user.username);
}

// ============================================
// 3. GESTIONE UTENTI
// ============================================

// Ottenere lista di tutti gli utenti
async function getAllUsers() {
    try {
        const data = await apiClient.getUsers();
        console.log('Utenti:', data.users);
        
        // Output:
        // {
        //   users: [
        //     { id: 1, username: "admin", expiration: "2025-12-31" }
        //   ]
        // }
    } catch (error) {
        console.error('Errore:', error.message);
    }
}

// Ottenere un singolo utente
async function getUserInfo(username) {
    try {
        const user = await apiClient.getUser(username);
        console.log('Info utente:', user);
        // Output: { id: 1, username: "admin", expiration: "2025-12-31" }
    } catch (error) {
        console.error('Utente non trovato:', error.message);
    }
}

// Creare un nuovo utente
async function createNewUser() {
    try {
        const result = await apiClient.createUser(
            'coach1',           // username
            'password123',      // password
            'salt-abc123',      // salt (opzionale)
            '2025-12-31'        // expiration
        );
        console.log('Utente creato:', result);
        // Output: { id: 2, username: "coach1" }
    } catch (error) {
        console.error('Errore creazione utente:', error.message);
    }
}

// ============================================
// 4. GESTIONE CONFIGURAZIONE
// ============================================

// Ottenere la configurazione dell'app
async function getAppConfig() {
    try {
        const config = await apiClient.getConfig('app_config');
        console.log('Configurazione:', config);
    } catch (error) {
        console.error('Errore lettura config:', error.message);
    }
}

// Salvare una configurazione personalizzata
async function saveCustomConfig() {
    try {
        const customConfig = {
            autoSave: { frequency: 15000 },
            sports: {
                volleyball: [
                    { value: "P1", label: "P1 - Alzatore" },
                    { value: "L1", label: "L1 - Libero" }
                ]
            }
        };
        
        const result = await apiClient.setConfig('app_config', customConfig);
        console.log('Configurazione salvata:', result);
    } catch (error) {
        console.error('Errore salvataggio config:', error.message);
    }
}

// Salvare configurazione con chiave personalizzata
async function saveSportConfig() {
    try {
        const sportConfig = {
            default: 'volleyball',
            sports: ['volleyball', 'basketball', 'tennis']
        };
        
        const result = await apiClient.setConfig('sport_config', sportConfig);
        console.log('Sport config salvata:', result);
    } catch (error) {
        console.error('Errore:', error.message);
    }
}

// ============================================
// 5. GESTIONE ESERCIZI
// ============================================

// Ottenere lista di tutti gli esercizi
async function getAllExercises() {
    try {
        const data = await apiClient.getExercises();
        console.log('Esercizi totali:', data.exercises.length);
        
        data.exercises.forEach(exercise => {
            console.log(`${exercise.name} (${exercise.category})`);
        });
    } catch (error) {
        console.error('Errore:', error.message);
    }
}

// Ottenere un singolo esercizio
async function getExerciseDetails(exerciseId) {
    try {
        const exercise = await apiClient.getExercise(exerciseId);
        console.log('Esercizio:', exercise.name);
        console.log('Categoria:', exercise.category);
        console.log('Dati:', exercise.data);
    } catch (error) {
        console.error('Esercizio non trovato:', error.message);
    }
}

// Creare un nuovo esercizio
async function createNewExercise() {
    try {
        const exerciseData = {
            techniques: ['technique1', 'technique2'],
            difficulty: 'intermedio',
            duration: 300,
            description: 'Descrizione tecnica'
        };
        
        const result = await apiClient.createExercise(
            'Ricezione vs Attacco',          // name
            'ricezione',                     // category
            'volleyball',                    // sport
            'Esercizio di ricezione difensiva', // description
            exerciseData                     // data
        );
        
        console.log('Esercizio creato:', result);
        // Output: { id: 5, name: "Ricezione vs Attacco" }
    } catch (error) {
        console.error('Errore creazione esercizio:', error.message);
    }
}

// ============================================
// 6. EVENT HANDLING
// ============================================

// Ascoltare evento di login
window.addEventListener('user:login', (event) => {
    console.log('Utente loggato:', event.detail.username);
    // Aggiornare UI quando l'utente accede
    document.body.classList.add('logged-in');
});

// Ascoltare evento di logout
window.addEventListener('user:logout', () => {
    console.log('Utente disconnesso');
    // Aggiornare UI quando l'utente esce
    document.body.classList.remove('logged-in');
});

// Ascoltare sessione scaduta
window.addEventListener('auth:logout', () => {
    console.warn('Sessione scaduta - effettua nuovo login');
    // Reindirizzare a login se necessario
});

// ============================================
// 7. GESTIONE ERRORI
// ============================================

// Esempio completo con gestione errori
async function completeExample() {
    try {
        // 1. Login
        await loginManager.login('admin', '1234');
        console.log('✓ Login completato');
        
        // 2. Carica utenti
        const usersData = await apiClient.getUsers();
        console.log(`✓ Caricati ${usersData.users.length} utenti`);
        
        // 3. Carica config
        const config = await apiClient.getConfig('app_config');
        console.log('✓ Configurazione caricata');
        
        // 4. Carica esercizi
        const exercisesData = await apiClient.getExercises();
        console.log(`✓ Caricati ${exercisesData.exercises.length} esercizi`);
        
        // Tutto ok!
        console.log('✓ Tutte le operazioni completate');
        
    } catch (error) {
        if (error.message.includes('Sessione scaduta')) {
            console.error('Devi effettuare di nuovo il login');
            // Reindirizza a pagina login
        } else if (error.message.includes('401')) {
            console.error('Non autorizzato');
            loginManager.logout();
        } else {
            console.error('Errore generico:', error.message);
        }
    }
}

// ============================================
// 8. MONITORAGGIO STATO
// ============================================

// Controllare stato di autenticazione
function checkAuthStatus() {
    if (apiClient.isAuthenticated()) {
        console.log('✓ Autenticato');
        console.log('Token:', apiClient.token.substring(0, 20) + '...');
    } else {
        console.log('✗ Non autenticato');
    }
}

// Controllare se token sta per scadere
function checkTokenExpiration() {
    // Il token scade dopo 24 ore
    const expirationTime = 24 * 60 * 60 * 1000; // 24 ore in ms
    const createdTime = new Date(localStorage.getItem('auth_token_time') || Date.now());
    const now = new Date();
    const remainingTime = expirationTime - (now - createdTime);
    
    if (remainingTime < 60 * 60 * 1000) { // Meno di 1 ora
        console.warn('Token in scadenza tra meno di 1 ora');
    }
}

// ============================================
// 9. UTILIZZO PRATICO IN UN COMPONENTE
// ============================================

class TrainingComponent {
    constructor() {
        this.api = new APIClient('/api');
        this.exercises = [];
        this.config = null;
    }

    async init() {
        try {
            // Carica dati iniziali
            const [exercisesData, config] = await Promise.all([
                this.api.getExercises(),
                this.api.getConfig('app_config')
            ]);
            
            this.exercises = exercisesData.exercises;
            this.config = config;
            
            console.log('Componente inizializzato');
            return true;
        } catch (error) {
            console.error('Errore inizializzazione:', error);
            return false;
        }
    }

    async addExercise(name, category, data) {
        try {
            const result = await this.api.createExercise(
                name,
                category,
                'volleyball',
                '',
                data
            );
            
            // Aggiorna lista locale
            this.exercises.push(result);
            return result;
        } catch (error) {
            console.error('Errore aggiunta esercizio:', error);
            throw error;
        }
    }

    getExercisesByCategory(category) {
        return this.exercises.filter(e => e.category === category);
    }
}

// Uso
const training = new TrainingComponent();
await training.init();
const ricezioneExercises = training.getExercisesByCategory('ricezione');

// ============================================
// EXPORT PER USO GLOBALE
// ============================================

window.ExamplesExport = {
    // Login
    login,
    logout,
    
    // Users
    getAllUsers,
    getUserInfo,
    createNewUser,
    
    // Config
    getAppConfig,
    saveCustomConfig,
    saveSportConfig,
    
    // Exercises
    getAllExercises,
    getExerciseDetails,
    createNewExercise,
    
    // Utilities
    checkAuthStatus,
    checkTokenExpiration,
    completeExample,
    
    // Components
    TrainingComponent
};

// Usa da console: ExamplesExport.login()
