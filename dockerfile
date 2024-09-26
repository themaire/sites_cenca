# Utiliser l'image Apache comme base
FROM httpd:latest

# Copier les fichiers buildés d'Angular dans le répertoire public d'Apache
COPY ./dist/site_cenca/browser/ /usr/local/apache2/htdocs/

# Expose le port 80
EXPOSE 80
