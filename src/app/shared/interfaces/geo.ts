// Ceci est un fichier d'interfaces

export interface Commune {
    nom: string;
    insee: string;
    population: number | null;
    codeposte: string;
}

export interface Communes {
  nom: string;
  insee: string;
}