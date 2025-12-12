class Sidebar {
    /**
     * @param {Object} schemaEditor - riferimento all'editor
     * @param {Array} sidebarConfig - configurazione delle categorie/items
     * @param {string} containerSelector - selettore del container
     * @param {string} position - 'left' o 'right'
     */
    constructor(schemaEditor, sidebarConfig, containerSelector = "#sidebar", position = "left") {
        this.schemaEditor = schemaEditor;
        this.config = sidebarConfig;
        this.position = position === "right" ? "right" : "left";
        this.controlCallbacks = new Map();

        this.container = document.querySelector(containerSelector);
        if (!this.container) throw new Error("Sidebar container not found");

        // Genera un suffisso unico per questa sidebar
        this.idSuffix = this.container.id || Math.random().toString(36).substr(2, 6);

        // Build
        this.build();

        // Inizializza custom components
        this.config.forEach(cat => {
            if (cat.controlType === "custom" && cat.init) {
                cat.init(this.schemaEditor);
            }
        });

        // Init
        this.initAccordion();
        this.initEvents();
        this.initControlEvents();

        // Toggle e resize
        this.initSidebarToggle();
        this.initSidebarResize();
    }

    build() {
        // Handle
        const handleId = `sidebarHandle_${this.idSuffix}`;
        const handle = document.createElement("div");
        handle.id = handleId;
        handle.className = this.position === "right" ? "right-sidebar-handle" : "sidebar-handle";
        this.container.appendChild(handle);
        this.sidebarHandle = handle;

        // Categorie
        const categoriesHTML = this.config.map(cat => this.renderCategory(cat)).join("");
        this.container.insertAdjacentHTML("beforeend", categoriesHTML);

        // Pulsante toggle
        const switchId = `sidebarSwitch_${this.idSuffix}`;
        const toggleBtn = document.createElement("button");
        toggleBtn.id = switchId;
        toggleBtn.className = this.position === "right" ? "right-sidebar-switch" : "sidebar-switch";
        toggleBtn.textContent = this.position === "right" ? "▶" : "◀";
        document.body.appendChild(toggleBtn);
        this.sidebarSwitch = toggleBtn;

        // Posizione iniziale toggle
        if (this.position === "right") {
            this.sidebarSwitch.style.right = this.container.offsetWidth + "px";
        } else {
            this.sidebarSwitch.style.left = this.container.offsetWidth + "px";
        }
    }


    updateSidebarSwitchPosition() {
        if (this.position === "right") {
            this.sidebarSwitch.style.right = this.container.offsetWidth + "px";
        } else {
            this.sidebarSwitch.style.left = this.container.offsetWidth + "px";
        }
    }

    renderCategory(cat) {
        const controlType = cat.controlType || "grid";

        if (controlType !== "accordion") {
            return `
                <div class="component-category no-accordion" data-control-type="${controlType}">
                    <div class="category-title">
                        <span class="title-small" data-i18n="${cat.i18ncategory || ""}">${cat.category}</span>
                        <span class="category-big" data-i18n="${cat.i18ntitle || ""}">${cat.title}</span>
                    </div>
                    <div class="category-content">
                        ${this.renderCategoryContent(cat, controlType)}
                    </div>
                </div>`;
        }

        return `
            <div class="component-category" data-control-type="${controlType}">
                <h3 class="accordion-header ${cat.active ? "active" : ""}">
                    <div class="accordion-title">
                        <span class="title-small" data-i18n="${cat.i18ncategory || ""}">${cat.category}</span>
                        <span class="category-big" data-i18n="${cat.i18ntitle || ""}">${cat.title}</span>
                    </div>
                </h3>
                <div class="accordion-content ${cat.active ? "active" : ""}">
                    ${this.renderCategoryContent(cat, controlType)}
                </div>
            </div>`;
    }

    renderCategoryContent(cat, controlType) {
        switch (controlType) {
            case "buttons":
                return `<div class="control-buttons">${cat.items.map(i => this.renderControl(i)).join("")}</div>`;
            case "controls":
            case "accordion":
                return `<div class="control-container">${cat.items.map(i => this.renderControl(i)).join("")}</div>`;
            case "custom":
                return cat.render(this.schemaEditor);
            default:
                return `<div class="component-grid">${cat.items.map(i => this.renderItem(i)).join("")}</div>`;
        }
    }

    renderControl(item) {
        if (!item.controlType) return this.renderItem(item);

        switch (item.controlType) {
            case "button": return this.renderButton(item);
            case "search":
            case "input": return this.renderInput(item);
            case "select": return this.renderSelect(item);
            case "textarea": return this.renderTextarea(item);
            default: return "";
        }
    }

    renderButton(item) {
        const icon = item.icon ? `<span class="btn-icon">${item.icon}</span>` : "";
        const className = item.className || "btn-default";
        if (item.onClick) this.controlCallbacks.set(item.id, item.onClick);

        return `
            <button 
                id="${item.id}" 
                class="sidebar-button ${className}" 
                data-control-type="button"
                data-i18n="${item.label || ""}"
            >
                ${icon}<span>${item.text || ""}</span>
            </button>`;
    }

    renderInput(item) {
        const type = item.type || "text";
        const isSearch = item.controlType === "search";
        const icon = isSearch ? '<span class="input-icon">🔍</span>' : '';
        if (item.onInput) this.controlCallbacks.set(item.id, item.onInput);

        return `
            <div class="control-group">
                ${item.label ? `<label for="${item.id}" data-i18n="${item.label}"></label>` : ""}
                <div class="input-wrapper ${isSearch ? 'search-wrapper' : ''}">
                    ${icon}
                    <input 
                        type="${type}" 
                        id="${item.id}" 
                        class="sidebar-input ${isSearch ? 'search-input' : ''}"
                        placeholder="${item.placeholder || ""}"
                        data-control-type="${item.controlType}"
                    />
                </div>
            </div>`;
    }

    renderSelect(item) {
        if (item.onChange) this.controlCallbacks.set(item.id, item.onChange);

        const optionsHTML = (item.options || []).map(opt =>
            `<option value="${opt.value}">${opt.text}</option>`
        ).join("");

        return `
            <div class="control-group">
                ${item.label ? `<label for="${item.id}" data-i18n="${item.label}"></label>` : ""}
                <select id="${item.id}" class="sidebar-select" data-control-type="select">
                    ${optionsHTML}
                </select>
            </div>`;
    }

    renderTextarea(item) {
        if (item.onInput) this.controlCallbacks.set(item.id, item.onInput);
        const rows = item.rows || 3;

        return `
            <div class="control-group">
                ${item.label ? `<label for="${item.id}" data-i18n="${item.label}"></label>` : ""}
                <textarea 
                    id="${item.id}" 
                    class="sidebar-textarea"
                    rows="${rows}"
                    placeholder="${item.placeholder || ""}"
                    data-control-type="textarea"
                ></textarea>
            </div>`;
    }

    renderItem(item) {
        const classes = ["component-item"];
        if (item.color) classes.push(item.color);

        const attributes = [
            item.id ? `id="${item.id}"` : "",
            `data-type="${item.type || ""}"`,
            item.text ? `data-text="${item.text}"` : "",
            item.color ? `data-color="${item.color}"` : "",
            item.icon ? `data-icon="${item.icon}"` : "",
            item.src ? `data-src="${item.src}"` : "",
            item.spriteSheet ? `data-sprite-sheet="${item.spriteSheet}"` : "",
            item.cols ? `data-sprite-cols="${item.cols}"` : "",
            item.rows ? `data-sprite-rows="${item.rows}"` : "",
            item.frame !== undefined ? `data-sprite-frame="${item.frame}"` : "",
            item.special ? `data-special="${item.special}"` : ""
        ].filter(Boolean).join(" ");

        let iconHTML = item.iconHTML || (item.src ? `<img src="${item.src}" style="width:20px;height:20px;">` : (item.icon ? `<i class="${item.icon}"></i>` : "🃏"));
        if (item.spriteSheet) {
            iconHTML = `
                <div class="sprite-preview" style="
                    width:${item.width}px; height:${item.height}px;
                    background-image:url('${item.spriteSheet}');
                    background-size:${item.cols * item.width}px ${item.rows * item.height}px;
                    background-position:-${(item.frame || 0) * item.width}px 0;
                "></div>`;
        }

        return `
            <div class="${classes.join(" ")}" ${attributes}>
                <div class="component-icon">${iconHTML}</div>
                <div class="component-text" data-i18n="${item.label}">${item.text || ""}</div>
            </div>`;
    }

    initAccordion() {
        this.container.querySelectorAll(".accordion-header").forEach(header => {
            header.addEventListener("click", () => {
                header.classList.toggle("active");
                header.nextElementSibling.classList.toggle("active");
            });
        });
    }

    initEvents() {
        this.container.addEventListener("click", e => {
            const item = e.target.closest(".component-item");
            if (!item) return;

            if (item.dataset.special === "arrowMode") {
                this.schemaEditor.toggleArrowMode();
                return;
            }

            this.schemaEditor.addComponent({
                type: item.dataset.type,
                text: item.dataset.text || "",
                color: item.dataset.color || "",
                icon: item.dataset.icon || "",
                src: item.dataset.src || "",
                sprite: item.dataset.spriteSheet
                    ? {
                        sheet: item.dataset.spriteSheet,
                        cols: +item.dataset.spriteCols,
                        rows: +item.dataset.spriteRows,
                        frame: +item.dataset.spriteFrame
                    }
                    : null
            });
        });
    }

    initControlEvents() {
        // Button
        this.container.addEventListener("click", e => {
            const button = e.target.closest("[data-control-type='button']");
            if (!button) return;
            const callback = this.controlCallbacks.get(button.id);
            if (callback) callback(e);
        });

        // Input/Search/Textarea
        this.container.addEventListener("input", e => {
            const input = e.target;
            if (!["input", "search", "textarea"].includes(input.dataset.controlType)) return;
            const callback = this.controlCallbacks.get(input.id);
            if (callback) callback(input.value, e);
        });

        // Select
        this.container.addEventListener("change", e => {
            const select = e.target;
            if (select.dataset.controlType !== "select") return;
            const callback = this.controlCallbacks.get(select.id);
            if (callback) callback(select.value, e);
        });
    }

    initSidebarToggle() {
        this.sidebar = this.container;

        this.sidebarSwitch.onclick = e => {
            e.stopPropagation(); e.preventDefault();
            this.toggleSidebar();
            return false;
        };
        this.sidebarHandle.ondblclick = () => this.toggleSidebar();
    }

    toggleSidebar() {
        const isHidden = this.sidebar.classList.contains("hidden");
        if (isHidden) {
            this.sidebar.classList.remove("hidden");
            this.sidebar.style.width = this.savedWidth ? this.savedWidth + "px" : "280px";
            this.sidebarSwitch.textContent = this.position === "right" ? "▶" : "◀";
        } else {
            this.savedWidth = this.sidebar.offsetWidth;
            this.sidebar.classList.add("hidden");
            this.sidebarSwitch.textContent = this.position === "right" ? "◀" : "▶";
        }

        if (this.position === "right") {
            this.sidebarSwitch.style.right = isHidden ? this.sidebar.offsetWidth + "px" : "0px";
        } else {
            this.sidebarSwitch.style.left = isHidden ? this.sidebar.offsetWidth + "px" : "0px";
        }
    }

    initSidebarResize() {
        let isResizing = false, startX = 0, startWidth = 0;

        this.sidebarHandle.addEventListener("mousedown", e => {
            if (this.sidebar.classList.contains("hidden")) return;
            e.preventDefault();
            isResizing = true; startX = e.clientX; startWidth = this.sidebar.offsetWidth;
            document.body.classList.add("resizing-sidebar");
        });

        document.addEventListener("mousemove", e => {
            if (!isResizing) return;
            let dx = e.clientX - startX;
            if (this.position === "right") dx = -dx;

            const newWidth = startWidth + dx;
            const min = 150, max = window.innerWidth / 2;
            if (newWidth >= min && newWidth <= max) {
                this.sidebar.style.width = newWidth + "px"; this.savedWidth = newWidth;
                this.updateSidebarSwitchPosition();
            }
        });

        document.addEventListener("mouseup", () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.classList.remove("resizing-sidebar");
        });
    }

    getControlValue(controlId) {
        const control = document.getElementById(controlId);
        if (!control) return null;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(control.tagName)) return control.value;
        return null;
    }

    setControlValue(controlId, value) {
        const control = document.getElementById(controlId);
        if (!control) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(control.tagName)) control.value = value;
    }
}
