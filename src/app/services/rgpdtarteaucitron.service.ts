import { Injectable } from '@angular/core';
import * as tarteaucitron from 'tarteaucitronjs';

@Injectable({
  providedIn: 'root',
})
export class RGPDtarteaucitronService {
  constructor() {
    this.init();
  }

  private init() {
    tarteaucitron.init({
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
    // console.log(this.init);
  }

  addService(serviceName: string, config: any) {
    tarteaucitron.services[serviceName] = config;
    tarteaucitron.job.push(serviceName);
  }
}
