import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss'],
})
export class BackToTopComponent {
  // isVisible: boolean = false;

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   console.log('Scroll position:' + window.scrollY.toString()); // Affiche la position verticale
  //   this.isVisible = window.scrollY > 300; // Affiche le bouton après avoir défilé de 300px
  // }

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      // console.log('je suis cliqué');
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
