|
|_projet.component
| |
| |___onSubmit()
|      |   Si modification
|      |___this.formService.putBdd('projets'...) -> Observable
           |
|      |    !! -- Utilise updateTable() de site.service.ts
|      |
|      |
|      |   Sinon si création
|      |___this.formService.putBdd('projets'...) -> Observable
          |
|          !! -- Utilise insertTable() de site.service.ts
|
|        Booléens d'état du formulaire mis à jour en consequence
|
|_operation.component
| |
| |___onSubmit()
|      |   Si nouvelle opération
|      |___this.projetService.insertOperation(this.form.value) -> Observable
|      |   Utilisation du return de l'observable pour mettre à jour les booléens
|      |
|      |   Sinon edition d'une opération
|      |___A VOIR -> Observable
|      |   Utilisation du return de l'observable pour mettre à jour les booléens




|
|_projet.component
  |
  |___fetchOperations(uuid_ope VIDE) / Pour avoir la liste des opérations avec ...
       |
       |___research.getOperation(subroute) / subroute en mode lite
           |
           |___operation est remplit !!! Maintenant on peut ...
               |
               |__cliquer sur une application
                  |
                  |__makeOperationForm({ operation REMPLI}) / else if ( operation !== undefined )
                    |
                    |__