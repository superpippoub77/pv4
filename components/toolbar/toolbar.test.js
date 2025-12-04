// ========================================
// ESEMPIO COMPLETO CON DATA-I18N
// ========================================

// Storage mock
const storage = {
    data: {},
    get(key) { return this.data[key]; },
    set(key, value) { this.data[key] = value; }
};

const editor = {};

// ========================================
// CONFIGURAZIONE TOOLBAR CON DATA-I18N
// ========================================
const toolbarConfig = [
    {
        align: "up",
        legend: "toolbar.file",  // ← Chiave i18n per la legenda
        items: [
            {
                type: "button",
                id: "btn-new",
                text: "Nuovo",
                i18n: "toolbar.file.new",  // ← Chiave i18n principale
                title: "Crea un nuovo file",
                titleI18n: "toolbar.file.new.tooltip",  // ← Chiave i18n per tooltip
                onClick: (ed) => console.log("Nuovo file")
            },
            {
                type: "button",
                id: "btn-open",
                text: "Apri",
                i18n: "toolbar.file.open",
                title: "Apri un file esistente",
                titleI18n: "toolbar.file.open.tooltip",
                onClick: (ed) => console.log("Apri file")
            },
            {
                type: "button",
                id: "btn-save",
                text: "Salva",
                i18n: "toolbar.file.save",
                title: "Salva il file corrente",
                titleI18n: "toolbar.file.save.tooltip",
                onClick: (ed) => console.log("Salva file")
            }
        ]
    },
    {
        align: "up",
        legend: "toolbar.edit",
        items: [
            {
                type: "button",
                id: "btn-undo",
                text: "Annulla",
                i18n: "toolbar.edit.undo",
                title: "Annulla ultima operazione",
                titleI18n: "toolbar.edit.undo.tooltip",
                onClick: (ed) => console.log("Undo")
            },
            {
                type: "button",
                id: "btn-redo",
                text: "Ripeti",
                i18n: "toolbar.edit.redo",
                title: "Ripeti operazione annullata",
                titleI18n: "toolbar.edit.redo.tooltip",
                onClick: (ed) => console.log("Redo")
            }
        ]
    },
    {
        align: "up",
        legend: "toolbar.format",
        items: [
            {
                type: "label",
                text: "Dimensione:",
                i18n: "toolbar.format.size.label"
            },
            {
                type: "select",
                id: "sel-size",
                i18n: "toolbar.format.size",
                title: "Seleziona dimensione font",
                titleI18n: "toolbar.format.size.tooltip",
                options: [
                    ["12", "Piccolo", "toolbar.format.size.small"],      // [value, text, i18nKey]
                    ["16", "Normale", "toolbar.format.size.normal"],
                    ["20", "Grande", "toolbar.format.size.large"],
                    ["24", "Molto grande", "toolbar.format.size.xlarge"]
                ]
            }
        ]
    },
    {
        align: "up",
        legend: "toolbar.search",
        items: [
            {
                type: "input",
                id: "inp-search",
                placeholder: "Cerca...",
                placeholderI18n: "toolbar.search.placeholder",  // ← i18n per placeholder
                i18n: "toolbar.search.input",
                title: "Cerca nel documento",
                titleI18n: "toolbar.search.tooltip"
            },
            {
                type: "button",
                id: "btn-search",
                text: "Trova",
                i18n: "toolbar.search.find",
                onClick: () => console.log("Cerca")
            }
        ]
    },
    {
        align: "up",
        legend: "toolbar.import",
        items: [
            {
                type: "file",
                id: "file-import",
                accept: ".txt,.json",
                i18n: "toolbar.import.file",  // ← i18n per aria-label
                title: "Importa file",
                titleI18n: "toolbar.import.file.tooltip"
            }
        ]
    },
    {
        align: "up",
        legend: "toolbar.info",
        items: [
            {
                type: "div",
                id: "div-info",
                class: "info-box",
                html: "<strong>Info:</strong> Pronto",
                htmlI18n: "toolbar.info.content",  // ← i18n per contenuto HTML
                i18n: "toolbar.info.box"
            }
        ]
    }
];

// ========================================
// DIZIONARIO I18N DI ESEMPIO
// ========================================
const translations = {
    it: {
        "toolbar.file": "File",
        "toolbar.file.new": "Nuovo",
        "toolbar.file.new.tooltip": "Crea un nuovo file",
        "toolbar.file.open": "Apri",
        "toolbar.file.open.tooltip": "Apri un file esistente",
        "toolbar.file.save": "Salva",
        "toolbar.file.save.tooltip": "Salva il file corrente",
        
        "toolbar.edit": "Modifica",
        "toolbar.edit.undo": "Annulla",
        "toolbar.edit.undo.tooltip": "Annulla ultima operazione",
        "toolbar.edit.redo": "Ripeti",
        "toolbar.edit.redo.tooltip": "Ripeti operazione annullata",
        
        "toolbar.format": "Formato",
        "toolbar.format.size.label": "Dimensione:",
        "toolbar.format.size": "Dimensione carattere",
        "toolbar.format.size.tooltip": "Seleziona dimensione font",
        "toolbar.format.size.small": "Piccolo",
        "toolbar.format.size.normal": "Normale",
        "toolbar.format.size.large": "Grande",
        "toolbar.format.size.xlarge": "Molto grande",
        
        "toolbar.search": "Ricerca",
        "toolbar.search.placeholder": "Cerca...",
        "toolbar.search.input": "Campo di ricerca",
        "toolbar.search.tooltip": "Cerca nel documento",
        "toolbar.search.find": "Trova",
        
        "toolbar.import": "Importa",
        "toolbar.import.file": "Importa file",
        "toolbar.import.file.tooltip": "Importa file",
        
        "toolbar.info": "Informazioni",
        "toolbar.info.box": "Casella informazioni",
        "toolbar.info.content": "<strong>Info:</strong> Pronto"
    },
    en: {
        "toolbar.file": "File",
        "toolbar.file.new": "New",
        "toolbar.file.new.tooltip": "Create a new file",
        "toolbar.file.open": "Open",
        "toolbar.file.open.tooltip": "Open an existing file",
        "toolbar.file.save": "Save",
        "toolbar.file.save.tooltip": "Save current file",
        
        "toolbar.edit": "Edit",
        "toolbar.edit.undo": "Undo",
        "toolbar.edit.undo.tooltip": "Undo last operation",
        "toolbar.edit.redo": "Redo",
        "toolbar.edit.redo.tooltip": "Redo undone operation",
        
        "toolbar.format": "Format",
        "toolbar.format.size.label": "Size:",
        "toolbar.format.size": "Font size",
        "toolbar.format.size.tooltip": "Select font size",
        "toolbar.format.size.small": "Small",
        "toolbar.format.size.normal": "Normal",
        "toolbar.format.size.large": "Large",
        "toolbar.format.size.xlarge": "Extra large",
        
        "toolbar.search": "Search",
        "toolbar.search.placeholder": "Search...",
        "toolbar.search.input": "Search field",
        "toolbar.search.tooltip": "Search in document",
        "toolbar.search.find": "Find",
        
        "toolbar.import": "Import",
        "toolbar.import.file": "Import file",
        "toolbar.import.file.tooltip": "Import file",
        
        "toolbar.info": "Info",
        "toolbar.info.box": "Info box",
        "toolbar.info.content": "<strong>Info:</strong> Ready"
    }
};

// ========================================
// FUNZIONE DI TRADUZIONE SEMPLICE
// ========================================
function translateElement(element, lang) {
    const currentLang = translations[lang] || translations['it'];
    
    // Traduci data-i18n (testo principale)
    const i18nKey = element.getAttribute('data-i18n');
    if (i18nKey && currentLang[i18nKey]) {
        if (element.tagName === 'OPTION') {
            element.textContent = currentLang[i18nKey];
        } else if (element.tagName === 'INPUT' && element.type !== 'file') {
            // Per input non file, non cambiare il textContent
        } else {
            element.textContent = currentLang[i18nKey];
        }
    }
    
    // Traduci data-i18n-placeholder
    const placeholderKey = element.getAttribute('data-i18n-placeholder');
    if (placeholderKey && currentLang[placeholderKey]) {
        element.placeholder = currentLang[placeholderKey];
    }
    
    // Traduci data-i18n-title (tooltip)
    const titleKey = element.getAttribute('data-i18n-title');
    if (titleKey && currentLang[titleKey]) {
        element.title = currentLang[titleKey];
    }
    
    // Traduci data-i18n-html (contenuto HTML)
    const htmlKey = element.getAttribute('data-i18n-html');
    if (htmlKey && currentLang[htmlKey]) {
        element.innerHTML = currentLang[htmlKey];
    }
}

function translateAll(lang) {
    const elements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-html]');
    elements.forEach(el => translateElement(el, lang));
    console.log(`Traduzione applicata: ${lang}`);
}

// ========================================
// INIZIALIZZAZIONE
// ========================================
const toolbar = new ToolbarDialogManager(editor, storage, "up", "toolbar", "top");

toolbar.init().then(() => {
    console.log("Toolbar inizializzata!");
    
    // Applica traduzione iniziale
    translateAll('it');
    
    // Crea controlli
    createControls();
});

// ========================================
// CONTROLLI UI
// ========================================
function createControls() {
    const controls = document.createElement("div");
    controls.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border: 2px solid #3498db;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        min-width: 200px;
    `;
    
    controls.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Controlli Toolbar</h4>
        
        <div style="margin-bottom: 15px;">
            <strong>Posizione:</strong>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px;">
                <button onclick="changePosition('top')" style="padding: 6px; font-size: 11px;">⬆️ Top</button>
                <button onclick="changePosition('bottom')" style="padding: 6px; font-size: 11px;">⬇️ Bottom</button>
                <button onclick="changePosition('left')" style="padding: 6px; font-size: 11px;">⬅️ Left</button>
                <button onclick="changePosition('right')" style="padding: 6px; font-size: 11px;">➡️ Right</button>
            </div>
        </div>
        
        <div>
            <strong>Lingua:</strong>
            <div style="display: flex; gap: 5px; margin-top: 5px;">
                <button onclick="changeLanguage('it')" style="padding: 6px; flex: 1; font-size: 11px;">🇮🇹 IT</button>
                <button onclick="changeLanguage('en')" style="padding: 6px; flex: 1; font-size: 11px;">🇬🇧 EN</button>
            </div>
        </div>
        
        <p style="margin: 10px 0 0 0; font-size: 10px; color: #7f8c8d;">
            💡 Doppio click sulla maniglia per minimizzare
        </p>
    `;
    
    document.body.appendChild(controls);
}

window.changePosition = function(position) {
    toolbar.setPosition(position);
};

window.changeLanguage = function(lang) {
    translateAll(lang);
};

// ========================================
// RIEPILOGO ATTRIBUTI DATA-I18N
// ========================================
/*

ATTRIBUTI DISPONIBILI PER OGNI TIPO:

1. LEGEND (fieldset):
   - data-i18n="key"  →  Testo della legenda

2. LABEL:
   - data-i18n="key"  →  Testo del label

3. BUTTON:
   - data-i18n="key"        →  Testo del pulsante
   - data-i18n-title="key"  →  Tooltip (title)

4. SELECT:
   - data-i18n="key"        →  Label accessibilità
   - data-i18n-title="key"  →  Tooltip (title)
   OPTION:
   - data-i18n="key"        →  Testo dell'opzione

5. INPUT:
   - data-i18n="key"              →  Aria-label
   - data-i18n-placeholder="key"  →  Placeholder
   - data-i18n-title="key"        →  Tooltip (title)

6. FILE:
   - data-i18n="key"        →  Aria-label
   - data-i18n-title="key"  →  Tooltip (title)

7. DIV:
   - data-i18n="key"       →  Label generico
   - data-i18n-html="key"  →  Contenuto HTML traducibile

ESEMPIO DI CONFIGURAZIONE ITEM:
{
    type: "button",
    id: "my-btn",
    text: "Testo default",           // Mostrato se i18n non disponibile
    i18n: "my.translation.key",      // Chiave principale
    title: "Tooltip default",
    titleI18n: "my.tooltip.key"      // Chiave per tooltip
}

*/