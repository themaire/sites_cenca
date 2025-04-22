import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-documentation',
  template: `
    <iframe
      src="../assets/documentation/index.html"
      style="width: 100%; height: 100vh; border: none;"
    ></iframe>
  `,
})
export class DocumentationComponent {}