import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appRoutingProviders } from './app/app.routes';

<<<<<<< HEAD
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
=======
bootstrapApplication(AppComponent, {
  providers: [
    ...appRoutingProviders,
    // Ajoutez d'autres providers ici si nécessaire
  ],
}).catch((err) => console.error(err));
>>>>>>> fba3e2efd5277127ecf921b53751d17ff2c14e1c
