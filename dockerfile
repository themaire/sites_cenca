# Utiliser l'image Apache comme base
FROM httpd:latest

# Mettre à jour les paquets et appliquer les correctifs de sécurité
RUN apt-get update && apt-get upgrade -y && apt-get clean

# Copier les fichiers buildés d'Angular dans le répertoire public d'Apache
COPY ./dist/site_cenca/browser/ /usr/local/apache2/htdocs/

RUN chmod -R 755 /usr/local/apache2/htdocs

# Ajouter un fichier de configuration Apache pour gérer les routes Angular
COPY ./apache.conf /usr/local/apache2/conf/httpd.conf

# Créer le répertoire pour les certificats SSL
RUN mkdir -p /etc/ssl/certs

# Exposer les ports 80 et 443
EXPOSE 80 443
