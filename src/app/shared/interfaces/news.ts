// Ceci est un fichier d'interfaces

/** Compteur d'une réaction sur une actualité. `mine` = l'utilisateur connecté (JWT) a choisi cette réaction */
export interface NewsReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

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
  // Champs « réseau social », calculés par le backend pour l'utilisateur du JWT.
  // Absents tant que le backend n'est pas à jour : le front masque alors ces fonctionnalités.
  reactions?: NewsReaction[];
  nb_commentaires?: number;
  lu?: boolean;
}

export interface NewsComment {
  id: number;
  news_id: number;
  cd_salarie: string;
  nom: string;
  prenom: string;
  initiales?: string;
  contenu: string;
  date_creation: string;
}
