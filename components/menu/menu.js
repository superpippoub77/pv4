function buildMenu(menuData) {
    return new Promise(resolve => {
        const menu  = document.getElementById("menu");
        const menuBar = document.createElement("div");
        menuBar.className = "menu-bar";
        menuBar.style.display = "none";

        menuData.forEach(menu => {
            const item = document.createElement("div");
            item.className = "menu-item" + (menu.meta && menu.meta.align === "right" ? " right" : "");

            const label = document.createElement("span");
            label.className = "menu-label";
            label.textContent = menu.label;
            item.appendChild(label);

            const dropdown = document.createElement("div");
            dropdown.className = "menu-dropdown";

            menu.items.forEach(entry => {

                if (entry.separator) {
                    const sep = document.createElement("div");
                    sep.className = "menu-dropdown-separator";
                    dropdown.appendChild(sep);
                    return;
                }

                const row = document.createElement("div");
                row.className = "menu-dropdown-item";

                if (entry.html) {
                    row.innerHTML = entry.html;
                    dropdown.appendChild(row);
                    return;
                }

                row.dataset.action = entry.action;

                if (entry.checkbox) {
                    row.classList.add("checkbox");
                    row.innerHTML = `<input type="checkbox" id="${entry.checkbox}"> ${entry.icon} ${entry.label}`;
                } else {
                    row.innerHTML = `${entry.icon} ${entry.label}`;
                }

                if (entry.shortcut) {
                    const sc = document.createElement("span");
                    sc.className = "shortcut";
                    sc.textContent = entry.shortcut;
                    row.appendChild(sc);
                }

                dropdown.appendChild(row);
            });

            item.appendChild(dropdown);
            menuBar.appendChild(item);
        });

        menu.appendChild(menuBar);
        resolve();
    });

}
