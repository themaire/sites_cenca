export interface MenuItem {
  name: string;
  class_color?: string;
  children?: MenuItem[]; // Optionnel : sous-menu
  route?: string;
}
