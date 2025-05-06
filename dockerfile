# Utiliser l'image Apache comme base
FROM httpd:latest

# Copier les fichiers buildés d'Angular dans le répertoire public d'Apache
COPY ./dist/site_cenca/browser/ /usr/local/apache2/htdocs/

RUN chmod -R 755 /usr/local/apache2/htdocs

# Ajouter un fichier de configuration Apache pour gérer les routes Angular
COPY ./apache.conf /usr/local/apache2/conf/httpd.conf

# Expose le port 80
EXPOSE 80
