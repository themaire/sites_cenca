import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ComponentTrackerService {
  private components: string[] = [];

  addComponent(componentName: string) {
    this.components.push(componentName);
    console.log('Currently loaded components:', this.components);
  }

  removeComponent(componentName: string) {
    this.components = this.components.filter(c => c !== componentName);
    console.log('Currently loaded components:', this.components);
  }

  getLoadedComponents(): string[] {
    return this.components;
  }
}
