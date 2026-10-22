export const environment = {
    windows: false,
    production: false,

    /** Fonctionnalités activables (true = visible). En local, tout est visible. */
    fonctionnalites: {
        /** Plans de gestion (sinon page « travaux en cours »). */
        plansGestion: true,
        /** Assistant IA Sonneur (en prod : préproduction uniquement, voir environment.prod.ts). */
        sonneur: true as boolean,
    },

    apiUrl: 'http://192.168.1.50:8887/',
    apiLocalUrl: 'http://192.168.1.50:8887/',
    get apiBaseUrl() {
        // Si la propriété windows est à true, on utilise apiLocalUrl, sinon apiUrl
        return this.windows ? this.apiLocalUrl : this.apiUrl;
    },

    get pathSep() {
        // Si la propriété windows est à true, on utilise '\\', sinon '/'
        return this.windows ? '\\' : '/';
    },

    apiBaseDir : "/mnt/storage_data/app"
};