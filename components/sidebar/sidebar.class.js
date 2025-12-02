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
        this.position = position === "right" ? "right" : "left"; // default left

        this.container = document.querySelector(containerSelector);
        if (!this.container) throw new Error("Sidebar container not found");

        // Build
        this.build();

        // Base init
        this.initAccordion();
        this.initEvents();

        // Open / close
        this.initSidebarToggle();

        // Resize
        this.initSidebarResize();
    }

    build() {
        // Sidebar handle
        const handleHTML = `<div class="sidebar-handle" id="sidebarHandle"></div>`;

        // Categorie
        const categoriesHTML = this.config
            .map(cat => this.renderCategory(cat))
            .join("");

        this.container.innerHTML = handleHTML + categoriesHTML;
        this.conta

        // Aggiungi pulsante toggle se non esiste
        if (!document.getElementById("sidebarSwitch")) {
            const btn = document.createElement("button");
            btn.id = "sidebarSwitch";
            btn.className = "sidebar-switch";
            btn.textContent = this.position === "right" ? "▶" : "◀";
            document.body.appendChild(btn);

            btn.style.position = "absolute";
            btn.style.top = "50%";
            btn.style.transform = "translateY(-50%)";
            btn.style.zIndex = 1000;

            // Posizione iniziale a destra o sinistra della sidebar
            if (this.position === "right") {
                btn.style.left = (this.container.offsetLeft + this.container.offsetWidth) + "px";
            } else {
                btn.style.left = this.container.offsetWidth + "px";
            }

            this.sidebarSwitch = btn;
        }
    }

    renderCategory(cat) {
        return `
        <div class="component-category">
            <h3 class="accordion-header ${cat.active ? "active" : ""}">${cat.title}</h3>
            <div class="accordion-content ${cat.active ? "active" : ""}">
                <div class="component-grid">
                    ${cat.items.map(i => this.renderItem(i)).join("")}
                </div>
            </div>
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
            item.spriteCols ? `data-sprite-cols="${item.spriteCols}"` : "",
            item.spriteRows ? `data-sprite-rows="${item.spriteRows}"` : "",
            item.spriteFrame ? `data-sprite-frame="${item.spriteFrame}"` : "",
            item.special ? `data-special="${item.special}"` : ""
        ].join(" ");

        let iconHTML = "🏃";
        if (item.icon) iconHTML = `<i class="${item.icon}"></i>`;
        if (item.src) iconHTML = `<img src="${item.src}" style="width:20px;height:20px;">`;

        if (item.spriteSheet)
            iconHTML = `
            <div class="sprite-preview" style="
                width:${item.width}px; height:${item.height}px;
                background-image:url('${item.spriteSheet}');
                background-size:${item.spriteCols * item.width}px ${item.spriteRows * item.height}px;
                background-position:-${item.spriteFrame * item.width}px 0;
            "></div>`;

        return `
            <div class="${classes.join(" ")}" ${attributes}>
                <div class="component-icon">${iconHTML}</div>
                <div data-i18n="${item.label}">${item.text || ""}</div>
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

    initSidebarToggle() {
        this.sidebar = this.container;
        this.sidebarHandle = document.getElementById("sidebarHandle");

        this.sidebarSwitch.onclick = e => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleSidebar();
            return false;
        };

        this.sidebarHandle.ondblclick = () => {
            this.toggleSidebar();
        };
    }

    toggleSidebar() {
        const isHidden = this.sidebar.classList.contains("hidden");

        if (isHidden) {
            this.sidebar.classList.remove("hidden");
            this.sidebarSwitch.textContent = this.position === "right" ? "▶" : "◀";
            this.sidebar.style.width = this.savedWidth ? this.savedWidth + "px" : "280px";
        } else {
            this.savedWidth = this.sidebar.offsetWidth;
            this.sidebar.classList.add("hidden");
            this.sidebarSwitch.textContent = this.position === "right" ? "◀" : "▶";
        }

        // Posiziona pulsante fuori dalla sidebar
        if (this.position === "right") {
            this.sidebarSwitch.style.left = isHidden ? (this.sidebar.offsetLeft + this.sidebar.offsetWidth) + "px" : "auto";
            this.sidebarSwitch.style.right = isHidden ? "auto" : "0px";
        } else {
            this.sidebarSwitch.style.left = isHidden ? this.sidebar.offsetWidth + "px" : "0px";
        }
    }

    initSidebarResize() {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        this.sidebarHandle.addEventListener("mousedown", e => {
            if (this.sidebar.classList.contains("hidden")) return;
            e.preventDefault();
            isResizing = true;
            startX = e.clientX;
            startWidth = this.sidebar.offsetWidth;
            document.body.classList.add("resizing-sidebar");
        });

        document.addEventListener("mousemove", e => {
            if (!isResizing) return;

            let dx = e.clientX - startX;
            if (this.position === "right") dx = -dx; // inverso per right

            const newWidth = startWidth + dx;
            const min = 150;
            const max = window.innerWidth / 2;

            if (newWidth >= min && newWidth <= max) {
                this.sidebar.style.width = newWidth + "px";
                this.savedWidth = newWidth;

                // Mantieni pulsante fuori sidebar
                if (this.position === "right") {
                    this.sidebarSwitch.style.left = this.sidebar.offsetLeft + this.sidebar.offsetWidth + "px";
                } else {
                    this.sidebarSwitch.style.left = newWidth + "px";
                }
            }
        });

        document.addEventListener("mouseup", () => {
            if (!isResizing) return;
            isResizing = false;
            document.body.classList.remove("resizing-sidebar");
        });
    }

}
