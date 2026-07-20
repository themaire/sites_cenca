// Ceci est un fichier d'interfaces

export interface News {
  id: number;
  titre: string;
  resume: string;
  date_publication: string;
  lien?: string;
  image_url?: string;
  contenu?: string;
  publie?: boolean;
  ordre?: number;
}
