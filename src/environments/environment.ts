export const environment = {
    windows: false,
    production: false,

    apiUrl: 'http://192.168.1.50:8887/',
    apiLocalUrl: 'http://localhost:8887/',
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