/**
 * Adresses (hôte:port, comme `window.location.host`) du serveur de préproduction.
 * La prod (branche main) et la préprod (branche dev) sont construites avec ce même fichier :
 * c'est l'adresse du site ouvert qui les distingue, pas un réglage commité, pour qu'une
 * fusion de dev dans main ne rende jamais visible en prod une fonctionnalité en test.
 */
const HOTES_PREPROD: string[] = [
    // https://si-10.cen-champagne-ardenne.org:444/ (la prod est sur le port 443 par défaut)
    'si-10.cen-champagne-ardenne.org:444',
];

/** Vrai si le site est servi par le serveur de préproduction. */
function estPreprod(): boolean {
    return HOTES_PREPROD.includes(window.location.host);
}

export const environment = {
    windows: false,
    production: true,

    /** Fonctionnalités activables (true = visible). */
    fonctionnalites: {
        /** Plans de gestion (sinon page « travaux en cours »). */
        plansGestion: true,
        /** Assistant IA Sonneur : préproduction uniquement, masqué en prod. */
        get sonneur(): boolean {
            return estPreprod();
        },
    },

    apiUrl: 'https://si-10.cen-champagne-ardenne.org:8889/',
    apiLocalUrl: 'http://localhost:8889/',
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