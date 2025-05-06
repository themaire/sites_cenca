import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appRoutingProviders } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    ...appRoutingProviders,
    // Ajoutez d'autres providers ici si nécessaire
  ],
}).catch((err) => console.error(err));
