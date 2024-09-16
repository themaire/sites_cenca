export interface MenuItem {
  id?: number;
  name: string;
  class_color?: string;
  parent?: number;
  route?: string;
  short?: string;
  url?: string;
  description?: string;
  picture?: string;
  accueil?: boolean;
  children?: MenuItem[]; // Optionnel : sous-menu
}
