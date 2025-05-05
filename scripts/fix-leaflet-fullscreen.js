const fs = require('fs');
const path = require('path');

const cssFilePath = path.resolve(__dirname, '../node_modules/leaflet.fullscreen/Control.FullScreen.css');
const oldPath = "url('icon-fullscreen.svg')";
const newPath = "url('/assets/icons/icon-fullscreen.svg')";

fs.readFile(cssFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier CSS:', err);
    return;
  }

  const updatedData = data.replace(oldPath, newPath);

  fs.writeFile(cssFilePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Erreur lors de l\'écriture du fichier CSS:', err);
    } else {
      console.log('Chemin du fichier SVG mis à jour avec succès.');
    }
  });
});