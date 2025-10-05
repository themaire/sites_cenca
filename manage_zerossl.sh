#!/usr/bin/env bash
set -euo pipefail

# Chargement des secrets (export access_key="...") depuis /root/secret_zerossl.sh si présent
if [ -f /root/secret_zerossl.sh ]; then
  # shellcheck disable=SC1091
  . /root/secret_zerossl.sh
  echo "Access key trouvée : $access_key."
fi

# Variables
# IMPORTANT: access_key doit venir de /root/secret_zerossl.sh ou de l'env
access_key="${access_key:-}"
DOMAIN="si-10.cen-champagne-ardenne.org"                  # Votre domaine
CERT_DIR="/etc/ssl/certs/si-10.cen-champagne-ardenne.org" # Répertoire certs
CERT_ID_FILE="$CERT_DIR/cert_id"                          # Stockage de l'ID
CSR_FILE="$CERT_DIR/csr.pem"                              # Chemin du CSR
VALIDATION_METHOD="HTTP_CSR_HASH"   # Méthode de validation (HTTP_CSR_HASH|CNAME_CSR_HASH|EMAIL)
# Sinon methode par CNAME: CNAME_CSR_HASH
# VALIDATION_METHOD="CNAME_CSR_HASH"   # Méthode de validation ()


# Garde-fous pour verifier si les outils nécessaires sont présents
command -v curl >/dev/null 2>&1 || { echo "curl manquant"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq manquant"; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo "openssl manquant"; exit 1; }

if [ -z "$access_key" ]; then
  echo "Variable 'access_key' absente. Définissez-la dans /root/secret_zerossl.sh (export access_key=\"...\")"
  exit 1
fi

# Créer le répertoire pour les certificats si nécessaire
mkdir -p "$CERT_DIR"

usage() {
  cat <<'EOF'
Usage: manage_zerossl.sh <commande>

Important : générez d'abord un CSR (recommandé: vous gardez la clé privée)
Exemple:
  mkdir -p /etc/ssl/certs/votre_domaine

  openssl req -new -newkey rsa:2048 -nodes \
  -keyout /etc/ssl/certs/votre_domaine/privkey.pem \
  -out    /etc/ssl/certs/votre_domaine/csr.pem \
  -subj "/CN=votre_domaine"

Commandes:
  create        Crée un nouveau certificat et lance la vérification de domaine
  renew         Renouvelle si le certificat expire bientôt (< 30 jours)
  verify        Lance uniquement la vérification de domaine (utilise cert_id sauvegardé)
  get           Récupère les métadonnées du certificat (status, dates...) via "Get certificate"
  download      Télécharge le certificat (ZIP) et extrait les fichiers
  help          Affiche cette aide

Notes:
- Définissez 'access_key' via /root/secret_zerossl.sh (voir exemple plus bas).
- Si vous fournissez un CSR, ZeroSSL ne renverra PAS la clé privée: gardez votre clé locale.
- L'ID du certificat est mémorisé dans: cert_id
EOF
}

load_cert_id() {
  if [ -z "${CERT_ID:-}" ] && [ -f "$CERT_ID_FILE" ]; then
    CERT_ID="$(cat "$CERT_ID_FILE")"
  fi
  if [ -z "${CERT_ID:-}" ]; then
    echo "CERT_ID introuvable. Créez d'abord un certificat (commande: create)."
    exit 1
  fi
}

# Fonction pour créer le certificat
create_certificate() {
  # Lire le CSR local (recommandé: vous gardez la clé privée)
  if [ ! -f "$CSR_FILE" ]; then
    echo "CSR introuvable: $CSR_FILE"
    echo "Générez-le par exemple:"
    echo "openssl req -new -newkey rsa:2048 -nodes -keyout \"$CERT_DIR/privkey.pem\" -out \"$CSR_FILE\" -subj \"/CN=$DOMAIN\""
    exit 1
  fi

  # Appel ZeroSSL en form-encoded (pas JSON)
  response="$(curl -s -X POST "https://api.zerossl.com/certificates?access_key=$access_key" \
    --data-urlencode "certificate_domains=$DOMAIN" \
    --data-urlencode "certificate_validity_days=90" \
    --data-urlencode "certificate_csr@${CSR_FILE}")"

  # Succès si pas d'objet error et présence d'un id
  if echo "$response" | jq -e '(.error | not) and (.id != null)' >/dev/null 2>&1; then
    echo "Certificat créé avec succès."
    CERT_ID="$(echo "$response" | jq -r '.id')"
    echo "$CERT_ID" > "$CERT_ID_FILE"
    echo "CERT_ID: $CERT_ID"

    # Tip: affiche un résumé de validation pour savoir quoi déployer (HTTP/DNS)
    echo "Résumé validation:"
    echo "$response" | jq '.validation // empty'

    # Certains champs ne sont présents qu’après émission; on ne les force pas ici
  else
    echo "Erreur lors de la création du certificat:"
    echo "$response" | jq .
    exit 1
  fi
}

# Fonction pour vérifier le domaine
verify_domain() {
  load_cert_id
  
  verification_response="$(curl -s -X POST "https://api.zerossl.com/certificates/$CERT_ID/challenges?access_key=$access_key" \
  --data-urlencode "validation_method=$VALIDATION_METHOD")"
  sleep 1
  echo "$verification_response" | jq .

  if echo "$verification_response" | jq -e '(.error | not)' >/dev/null 2>&1; then
    echo "Vérification envoyée (méthode: $VALIDATION_METHOD)."
    # Affiche l’état pour suivre la progression
    echo "$verification_response" | jq '{id, status, validation}'
  else
    echo "Erreur lors de la vérification du domaine:"
    echo "$verification_response" | jq .
    exit 1
  fi

}

action_apache_container() {
    local action=$1
    case $action in
        start)
            echo "Démarrage du conteneur Apache..."
            docker run -d --name apache-container -p 80:80 -v "/root/make_cert/$validation_file_name:/usr/local/apache2/htdocs/.well-known/pki-validation/$validation_file_name" httpd
            ;;
        stop)
            echo "Arrêt du conteneur Apache..."
            docker stop apache-container
            sleep 1
            docker rm apache-container
            ;;
        *)
            echo "Usage: $0 {start|stop}"
            ;;
    esac
}

# Fonction "Get certificate" (métadonnées/status)
get_certificate() {
  load_cert_id
  get_resp="$(curl -s -G "https://api.zerossl.com/certificates/$CERT_ID" \
    --data-urlencode "access_key=$access_key")"

  echo $get_resp | jq .

  # Extraire le nom de fichier de la réponse
  validation_file_name=$(echo "$get_resp" | jq -r --arg domain "$DOMAIN" '.validation.other_methods[$domain].file_validation_url_http | split("/") | last')
  # Afficher le nom de fichier
  # echo "Nom de fichier de validation: $validation_file_name"

  # Extraire le contenu de file_validation_content
  validation_content=$(echo "$get_resp" | jq -r --arg domain "$DOMAIN" '.validation.other_methods[$domain].file_validation_content')

  # Vider le contenu du fichier
  verification_file_path="/root/make_cert/$validation_file_name"
  rm $verification_file_path && touch $verification_file_path

  # Écrire chaque élément dans le fichier sans les fioritures
  echo "$validation_content" | jq -r '.[]' >> "$verification_file_path"

  # Affiche le status et quelques champs utiles
  echo "Informations du certificat:"
  # echo "$get_resp" | jq '{id, status, common_name: .certificate.common_name, created: .created, expires: .expires, validation: .validation}'
}

# Fonction pour télécharger le certificat (ZIP) et extraire
download_certificate() {
  load_cert_id

  url="https://api.zerossl.com/certificates/$CERT_ID/download?access_key=$access_key"
  echo "URL du zip $url."

  zip_path="$CERT_DIR/${DOMAIN}_${CERT_ID}.zip"
  echo "Téléchargement du certificat (ZIP) vers: $zip_path"
  
  curl -f -sS -G $url -o "$zip_path"

  # Si le fichier ressemble à du texte, c'est probablement une erreur JSON
  if file -b --mime-type "$zip_path" 2>/dev/null | grep -qi 'text'; then
    echo "Réponse texte (erreur probable):"
    cat "$zip_path"
    exit 1
  fi

  if command -v unzip >/dev/null 2>&1; then
    echo "Extraction du ZIP dans $CERT_DIR"
    unzip -o -q "$zip_path" -d "$CERT_DIR"
    echo "Contenu extrait. Pensez à pointer Apache vers les bons fichiers (ex: certificate.crt, ca_bundle.crt)."
  else
    echo "unzip non disponible. Conservez le ZIP à cet emplacement et extrayez-le manuellement."
  fi
}

# Fonction pour renouveler le certificat
renew_certificate() {
  # Si aucun cert actuel, on force la création
  if [ ! -f "$CERT_DIR/cert.pem" ]; then
    echo "Aucun certificat existant trouvé. Création d'un nouveau certificat..."
    create_certificate
    verify_domain
    return
  fi

  expiration_raw="$(openssl x509 -in "$CERT_DIR/cert.pem" -noout -enddate 2>/dev/null | cut -d= -f2 || true)"
  if [ -z "$expiration_raw" ]; then
    echo "Impossible de lire la date d'expiration. Recréation du certificat..."
    create_certificate
    verify_domain
    return
  fi

  expiration_ts="$(date -d "$expiration_raw" +%s)"
  now_ts="$(date +%s)"

  if (( (expiration_ts - now_ts) < 2592000 )); then
    echo "Le certificat expire bientôt. Renouvellement en cours..."
    create_certificate
    verify_domain
  else
    echo "Le certificat est toujours valide (expiration: $expiration_raw)."
  fi
}

# ---------- Dispatch CLI ----------
if [ $# -lt 1 ]; then
  usage
  exit 1
fi

case "$1" in
  create)
    create_certificate
    verify_domain
    ;;
  renew)
    renew_certificate
    ;;
  verify)
    get_certificate
    verify_domain
    ;;
  get)
    get_certificate
    ;;
  download)
    download_certificate
    ;;
  ctstart)
    get_certificate
    action_apache_container start
    ;;
  ctstop)
    action_apache_container stop 
    ;;
help|-h|--help)
    usage
    ;;
  *)
    echo "Commande inconnue: $1"
    usage
    exit 1
    ;;
esac
