import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class RGPDtarteaucitronService {
  private tarteaucitron: any;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.tarteaucitron = (window as any).tarteaucitron;
  }

  public init() {
    const checkTarteaucitron = () => {
      if (this.tarteaucitron) {
        this.tarteaucitron.init({
          privacyUrl: '', // URL de la politique de confidentialité
          hashtag: '#tarteaucitron', // L'ID du div où le bandeau sera affiché
          cookieName: 'tarteaucitron', // Nom du cookie
          orientation: 'bottom', // Position du bandeau
          showAlertSmall: true, // Affiche la petite bannière
          cookieslist: true, // Affiche la liste des cookies
          adblocker: false,
          AcceptAllCta: true,
          highPrivacy: false,
          handleBrowserDNTRequest: false,
          removeCredit: true,
          moreInfoLink: true,
          useExternalCss: false,
          readmoreLink: '', // Lien vers la page d'information sur les cookies
        });
      } else {
        console.error('tarteaucitron is not loaded');
      }
    };

    // Attendre que le script soit chargé
    setTimeout(checkTarteaucitron, 1000);
  }

  addService(serviceName: string, config: any) {
    if (this.tarteaucitron) {
      this.tarteaucitron.services[serviceName] = config;
      this.tarteaucitron.job.push(serviceName);
    } else {
      console.error('tarteaucitron is not loaded');
    }
  }

  // Méthode pour créer un cookie
  setCookie(name: string, value: string, days: number) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }

  // Méthode pour lire un cookie
  getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Méthode pour supprimer un cookie
  deleteCookie(name: string) {
    document.cookie = `${name}=; Max-Age=-99999999;`;
  }
}
