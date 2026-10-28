|
|_ngOnitit()
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