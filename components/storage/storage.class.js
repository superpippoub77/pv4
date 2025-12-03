class Storage {
    constructor(namespace = "", backend = localStorage) {
        this.ns = namespace ? namespace + ":" : "";
        this.backend = backend;
    }

    set(key, value, ttl = null) {
        const entry = {
            value,
            expires: ttl ? Date.now() + ttl : null
        };
        this.backend.setItem(this.ns + key, JSON.stringify(entry));
    }

    get(key, defaultValue = null) {
        const raw = this.backend.getItem(this.ns + key);
        if (!raw) return defaultValue;

        const entry = JSON.parse(raw);
        if (entry.expires && Date.now() > entry.expires) {
            this.remove(key); // scaduto
            return defaultValue;
        }
        return entry.value;
    }

    remove(key) {
        this.backend.removeItem(this.ns + key);
    }

    clear() {
        Object.keys(this.backend).forEach(k => {
            if (k.startsWith(this.ns)) this.backend.removeItem(k);
        });
    }
}
