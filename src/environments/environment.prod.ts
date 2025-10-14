export const environment = {
    windows: false,
    production: true,
    
    apiUrl: 'https://si-10.cen-champagne-ardenne.org:8889/',
    apiLocalUrl: 'http://localhost:8889/',
    get apiBaseUrl() {
        // Si la propriété windows est à true, on utilise apiLocalUrl, sinon apiUrl
        return this.windows ? this.apiLocalUrl : this.apiUrl;
    },

    get pathSep() {
        // Si la propriété windows est à true, on utilise '\\', sinon '/'
        return this.windows ? '\\' : '/';
    }
  };