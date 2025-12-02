class ToolbarDialogManager {
    constructor(schemaEditor) {
        this.editor = schemaEditor;
        this.toolbar = null; // riferimento alla div toolbar
    }

    init() {
        this.createToolbar();
    }

    createToolbar() {
        return new Promise((resolve, reject) => {
            try {
                // Se non esiste, creiamo la div toolbar e la appendiamo al body
                this.toolbar = document.getElementById("toolbar");
                if (!this.toolbar) {
                    this.toolbar = document.createElement("div");
                    this.toolbar.id = "toolbar";
                    this.toolbar.className = "toolbar";
                    document.body.prepend(this.toolbar);
                }

                // Creazione dei gruppi di toolbar
                toolbarConfig.forEach(group => {
                    const fs = document.createElement("fieldset");
                    fs.className = "toolbar-group";
                    fs.style.margin = "0 10px";

                    const legend = document.createElement("legend");
                    legend.setAttribute("data-i18n", group.legend);
                    legend.textContent = group.legend;
                    fs.appendChild(legend);

                    group.items.forEach(item => {
                        let el;

                        switch (item.type) {
                            case "label":
                                el = document.createElement("label");
                                el.setAttribute("data-i18n", item.text);
                                el.textContent = item.text;
                                break;

                            case "button":
                                el = document.createElement("button");
                                el.id = item.id;
                                el.setAttribute("data-i18n", item.i18n);
                                el.textContent = item.text;
                                el.addEventListener("click", () => {
                                    if (item.onClick) item.onClick(this.editor);
                                });
                                break;

                            case "select":
                                el = document.createElement("select");
                                el.id = item.id;
                                item.options.forEach(([value, i18n]) => {
                                    const opt = document.createElement("option");
                                    opt.value = value;
                                    opt.setAttribute("data-i18n", i18n);
                                    opt.textContent = i18n;
                                    el.appendChild(opt);
                                });
                                break;

                            case "input":
                                el = document.createElement("input");
                                el.id = item.id;
                                el.placeholder = item.placeholder;
                                if (item.i18nPlaceholder)
                                    el.setAttribute("data-i18n-placeholder", item.i18nPlaceholder);
                                break;

                            case "file":
                                el = document.createElement("input");
                                el.type = "file";
                                el.id = item.id;
                                el.accept = item.accept;
                                if (item.style) el.style = item.style;
                                break;

                            case "div":
                                el = document.createElement("div");
                                el.id = item.id;
                                if (item.class) el.className = item.class;
                                if (item.style) el.style = item.style;
                                el.innerHTML = item.html;
                                break;
                        }

                        fs.appendChild(el);
                    });

                    this.toolbar.appendChild(fs);
                });

                resolve();
            } catch (err) {
                console.error("Errore nella creazione della toolbar:", err);
                reject(err);
            }
        });
    }

    show() {
        if (this.toolbar) this.toolbar.style.display = "flex";
    }

    hide() {
        if (this.toolbar) this.toolbar.style.display = "none";
    }
}
