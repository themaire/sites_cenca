## HTML :

Le bouton a un événement (click) lié à une méthode scrollToElement() dans le composant TypeScript. Lorsque vous cliquez sur le bouton, il défile en douceur vers la section avec l'ID correspondant (id="top").

## TypeScript :

La méthode scrollToElement() utilise document.getElementById() pour récupérer l'élément cible, puis utilise scrollIntoView() pour faire défiler la page en douceur vers cet élément. Vous pouvez spécifier l'option { behavior: 'smooth' } pour un défilement fluide ou { behavior: 'auto' } pour un defilement immédiat et sans animation.
