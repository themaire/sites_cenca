        showButton = false;

Cette propriété booléenne détermine si le bouton doit être affiché ou non. Au départ, il est caché.

        @HostListener("window:scroll", []):

@HostListener: Ce décorateur permet d'écouter des événements au niveau du composant. Ici, on écoute l'événement window:scroll, qui se déclenche chaque fois que l'utilisateur fait défiler la page.

        onWindowScroll(): void:

Cette fonction est appelée à chaque fois que l'événement window:scroll est déclenché.

        this.showButton = window.pageYOffset >= 200;:

window.pageYOffset donne la position verticale actuelle de la page par rapport au haut.
Si cette position est supérieure ou égale à 200 pixels (tu peux ajuster cette valeur selon tes besoins), cela signifie que l'utilisateur a suffisamment scrollé et on affiche le bouton en mettant showButton à true.

        scrollToTop():

Cette fonction est appelée lorsque l'utilisateur clique sur le bouton.

        window.scrollTo({ top: 0, behavior: 'smooth' }); :

top: 0 : Déplace la page vers le haut (position verticale 0).
behavior: 'smooth' : Effectue un défilement doux et animé vers le haut.

## Composant back-to-top.component.html:

    <button (click)="scrollToTop()">:

Le bouton déclenche la fonction scrollToTop() lorsqu'on clique dessus.

    *ngIf="showButton":

Affiche le bouton uniquement si showButton est vrai (c'est-à-dire si l'utilisateur a suffisamment scrollé).
