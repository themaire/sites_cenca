export interface Selector {
  name: string;
  title: string;
  values: [string];
  libelles?: Record<string, string>; // libellé affiché pour chaque valeur (ex. responsable : code → nom complet)
}
