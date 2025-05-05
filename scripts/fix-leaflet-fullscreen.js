const fs = require('fs');
const path = require('path');

const cssFilePath = path.resolve(__dirname, '../node_modules/leaflet.fullscreen/Control.FullScreen.css');
console.log('Chemin du fichier CSS :', cssFilePath);

const oldPath = "background-image: url('icon-fullscreen.svg');";
const newPath = "background-image: url('../images/leaflet/icon-fullscreen.svg');";
const assetsPath = path.resolve(__dirname, '../assets/styles/Control.FullScreen.css');
console.log('New path:', newPath);

/**
 * Fonction principale pour mettre à jour le fichier CSS
 * @returns {void}
 */
function main(oldPath, newPath) {
    try {
        // Lire le contenu du fichier de manière synchrone
        const fileContent = fs.readFileSync(cssFilePath, 'utf8');
        console.log('Contenu original du fichier CSS :\n', fileContent);

        // Remplacer l'ancien chemin par le nouveau
        const updatedData = fileContent.replace(oldPath, newPath);

        // Écrire les modifications dans le fichier
        fs.writeFileSync(cssFilePath, updatedData, 'utf8');
        console.log('Chemin du fichier SVG mis à jour avec succès.');
        console.log('Contenu du fichier CSS mis à jour :\n', updatedData);
        fs.copyFileSync(cssFilePath, assetsPath);
    } catch (err) {
        console.error('Erreur lors de la mise à jour du fichier CSS :', err);
    }
}

// Exécuter la fonction principale
main(oldPath, newPath);