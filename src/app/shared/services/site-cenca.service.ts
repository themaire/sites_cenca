import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SiteCencaCollection, SiteCencaFeature } from '../interfaces/site-geojson';

@Injectable({
  providedIn: 'root'
})
export class SiteCencaService {
  private activeUrl: string = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Construit l'URL pour l'API WFS Lizmap
   * @param couche Le nom de la couche
   * @param bbox La bbox optionnelle
   * @returns L'URL complète
   */
  private apiWFSLizmapUrl(couche: string, bbox?: string): string {
    const baseUrl = `${this.activeUrl}api-geo/lizmap/layer/${couche}`;
    return bbox ? `${baseUrl}?bbox=${bbox}` : baseUrl;
  }

  /**
   * Récupère tous les sites CENCA
   * @param couche Le nom de la couche (par défaut 'cenca_autres')
   * @param bbox La bbox optionnelle pour filtrer géographiquement
   * @returns Observable de la collection de sites
   */
  getSitesCenca$(couche: string = 'cenca_autres', bbox?: string): Observable<SiteCencaCollection> {
    const url = this.apiWFSLizmapUrl(couche, bbox);
    
    // Log pour débogage
    console.log(`🔗 URL appelée pour ${couche}:`, url);
    if (bbox) {
      console.log(`📦 Bbox demandée: ${bbox}`);
    }
    
    return this.http.get<SiteCencaCollection>(url).pipe(
      tap((response) => {
        console.log(
          `Sites CENCA récupérés (couche: ${couche}):`,
          response.features?.length || 0,
          'sites'
        );
        
        // Vérification si le filtrage bbox fonctionne
        if (bbox && response.features?.length > 0) {
          console.log(`🔍 Premiers sites reçus:`, 
            response.features.slice(0, 3).map(f => ({
              nom: f.properties.nomsite,
              bbox: f.bbox
            }))
          );
        }
      }),
      catchError((error) => {
        console.error(
          `Erreur lors de la récupération des sites CENCA (couche: ${couche})`,
          error
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupère un site CENCA spécifique par son ID
   * @param siteId L'ID du site
   * @param couche Le nom de la couche
   * @returns Observable du site ou null si non trouvé
   */
  getSiteCencaById$(siteId: string, couche: string = 'cenca_autres'): Observable<SiteCencaFeature | null> {
    return this.getSitesCenca$(couche).pipe(
      map((collection: SiteCencaCollection) => {
        const site = collection.features.find((feature: SiteCencaFeature) => feature.properties.idsite === siteId);
        if (!site) {
          console.warn(`Site avec l'ID ${siteId} non trouvé`);
        }
        return site || null;
      }),
      catchError((error) => {
        console.error(`Erreur lors de la récupération du site ${siteId}`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Filtre les sites par type de gestion
   * @param sites La collection de sites
   * @param typeGestion Le type de gestion ('1', '2', '3', etc.)
   * @returns Les sites filtrés
   */
  filterSitesByGestion(sites: SiteCencaCollection, typeGestion: string): SiteCencaFeature[] {
    return sites.features.filter((site: SiteCencaFeature) => site.properties.gestion === typeGestion);
  }

  /**
   * Filtre les sites par milieu naturel
   * @param sites La collection de sites
   * @param milieuNaturel Le type de milieu naturel
   * @returns Les sites filtrés
   */
  filterSitesByMilieu(sites: SiteCencaCollection, milieuNaturel: string): SiteCencaFeature[] {
    return sites.features.filter((site: SiteCencaFeature) => 
      site.properties.milieunat.toLowerCase().includes(milieuNaturel.toLowerCase())
    );
  }

  /**
   * Filtre les sites par référent
   * @param sites La collection de sites
   * @param referent Le nom du référent
   * @returns Les sites filtrés
   */
  filterSitesByReferent(sites: SiteCencaCollection, referent: string): SiteCencaFeature[] {
    return sites.features.filter((site: SiteCencaFeature) => 
      site.properties.referent.toLowerCase().includes(referent.toLowerCase())
    );
  }

  /**
   * Filtre les sites qui sont des zones humides
   * @param sites La collection de sites
   * @returns Les sites qui sont des zones humides
   */
  filterSitesZonesHumides(sites: SiteCencaCollection): SiteCencaFeature[] {
    return sites.features.filter((site: SiteCencaFeature) => 
      site.properties.zonehumide.toLowerCase() === 'oui'
    );
  }

  /**
   * Calcule la surface totale des sites (si disponible)
   * @param sites La collection de sites
   * @returns La surface totale en hectares
   */
  calculateTotalSurface(sites: SiteCencaCollection): number {
    return sites.features.reduce((total: number, site: SiteCencaFeature) => {
      return total + (site.properties.surface || 0);
    }, 0);
  }

  /**
   * Groupe les sites par type de gestion
   * @param sites La collection de sites
   * @returns Un objet avec les sites groupés par type de gestion
   */
  groupSitesByGestion(sites: SiteCencaCollection): Record<string, SiteCencaFeature[]> {
    return sites.features.reduce((groups: Record<string, SiteCencaFeature[]>, site: SiteCencaFeature) => {
      const gestion = site.properties.gestiontxt || 'Non défini';
      if (!groups[gestion]) {
        groups[gestion] = [];
      }
      groups[gestion].push(site);
      return groups;
    }, {} as Record<string, SiteCencaFeature[]>);
  }

  /**
   * Obtient la liste des référents uniques
   * @param sites La collection de sites
   * @returns La liste des référents
   */
  getUniqueReferents(sites: SiteCencaCollection): string[] {
    const referents = sites.features.map((site: SiteCencaFeature) => site.properties.referent);
    return [...new Set(referents)].filter((referent: string) => referent && referent.trim() !== '');
  }

  /**
   * Obtient la liste des milieux naturels uniques
   * @param sites La collection de sites
   * @returns La liste des milieux naturels
   */
  getUniqueMilieuxNaturels(sites: SiteCencaCollection): string[] {
    const milieux = sites.features.map((site: SiteCencaFeature) => site.properties.milieunat);
    return [...new Set(milieux)].filter((milieu: string) => milieu && milieu.trim() !== '');
  }

  /**
   * Filtre les sites selon une bbox (filtrage côté client)
   * @param sites La collection de sites
   * @param bbox La bbox au format "west,south,east,north"
   * @returns Les sites dans la bbox
   */
  filterSitesByBbox(sites: SiteCencaCollection, bbox: string): SiteCencaCollection {
    const [west, south, east, north] = bbox.split(',').map(parseFloat);
    
    const filteredFeatures = sites.features.filter((site: SiteCencaFeature) => {
      if (!site.bbox || site.bbox.length !== 4) return false;
      
      const [siteWest, siteSouth, siteEast, siteNorth] = site.bbox;
      
      // Vérifier si la bbox du site intersecte avec la bbox demandée
      return !(siteEast < west || siteWest > east || siteNorth < south || siteSouth > north);
    });

    return {
      ...sites,
      features: filteredFeatures,
      bbox: [west, south, east, north]
    };
  }

  /**
   * Cache pour éviter les rechargements inutiles
   */
  private sitesCencaCache = new Map<string, SiteCencaCollection>();

  /**
   * Récupère les sites CENCA avec filtrage intelligent (API + client)
   * @param couche Le nom de la couche
   * @param bbox La bbox optionnelle
   * @returns Observable des sites filtrés
   */
  getSitesCencaOptimized$(couche: string = 'cenca_autres', bbox?: string): Observable<SiteCencaCollection> {
    const cacheKey = `${couche}_all`;
    
    // Si on a déjà tous les sites en cache et qu'on veut filtrer par bbox
    if (bbox && this.sitesCencaCache.has(cacheKey)) {
      console.log(`📦 Utilisation du cache pour ${couche} avec filtrage bbox`);
      const cachedSites = this.sitesCencaCache.get(cacheKey)!;
      const filteredSites = this.filterSitesByBbox(cachedSites, bbox);
      console.log(`🔍 Sites filtrés: ${filteredSites.features.length}/${cachedSites.features.length}`);
      return of(filteredSites);
    }

    // Sinon, récupérer depuis l'API
    return this.getSitesCenca$(couche, bbox).pipe(
      tap((response) => {
        // Si on récupère sans bbox, mettre en cache
        if (!bbox) {
          this.sitesCencaCache.set(cacheKey, response);
          console.log(`💾 Sites ${couche} mis en cache (${response.features.length} sites)`);
        }
      })
    );
  }
}
