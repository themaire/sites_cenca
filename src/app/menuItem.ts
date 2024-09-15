export interface MenuItem {
  id?: number;
  name: string;
  class_color?: string;
  parent?: number;
  route?: string;
  short?: string;
  children?: MenuItem[]; // Optionnel : sous-menu
  route?: string;
}
