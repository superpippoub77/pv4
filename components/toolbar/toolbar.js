// =======================
// CREAZIONE TOOLBAR
// =======================
function createToolbar() {
    return new Promise(resolve => {
        const toolbar = document.getElementById("toolbar");

        toolbarConfig.forEach(group => {
            const fs = document.createElement("fieldset");
            fs.className = "toolbar-group";

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

            toolbar.appendChild(fs);
        });
        resolve();
    });
}