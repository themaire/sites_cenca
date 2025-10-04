#!/usr/bin/env bash
set -euo pipefail

# Chargement des secrets (export access_jey="...") depuis /root/secret_zerossl.sh si présent
if [ -f /root/secret_zerossl.sh ]; then
  # shellcheck disable=SC1091
  . /root/secret_zerossl.sh
fi

# Variables
# IMPORTANT: access_jey doit venir de /root/secret_zerossl.sh ou de l'env
access_jey="${access_jey:-}"
DOMAIN="si-10.cen-champagne-ardenne.org"                  # Votre domaine
CERT_DIR="/etc/ssl/certs/si-10.cen-champagne-ardenne.org" # Répertoire certs
CERT_ID_FILE="$CERT_DIR/cert_id"                          # Stockage de l'ID

# Garde-fous
command -v curl >/dev/null 2>&1 || { echo "curl manquant"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq manquant"; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo "openssl manquant"; exit 1; }

if [ -z "$access_jey" ]; then
  echo "Variable 'access_jey' absente. Définissez-la dans /root/secret_zerossl.sh (export access_jey=\"...\")"
  exit 1
fi

# Créer le répertoire pour les certificats si nécessaire
mkdir -p "$CERT_DIR"

usage() {
  cat <<'EOF'
Usage: manage_zerossl.sh <commande>

Commandes:
  create        Crée un nouveau certificat et lance la vérification de domaine
  renew         Renouvelle si le certificat expire bientôt (< 30 jours)
  verify        Lance uniquement la vérification de domaine (utilise cert_id sauvegardé)
  get           Récupère les métadonnées du certificat (status, dates...) via "Get certificate"
  download      Télécharge le certificat (ZIP) et extrait les fichiers
  help          Affiche cette aide

Notes:
- Définissez 'access_jey' via /root/secret_zerossl.sh (voir exemple plus bas).
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
  # Remplacez "votre_csr_ici" si vous avez un CSR (format PEM, une seule ligne \n -> \n)
  # Sinon, voyez pour générer un CSR/clé privée en amont.
  response="$(curl -s -X POST "https://api.zerossl.com/certificates" \
    -H "Content-Type: application/json" \
    -d '{
      "access_key": "'"$access_jey"'",
      "certificate": {
        "common_name": "'"$DOMAIN"'",
        "validity": 90,
        "csr": "votre_csr_ici"
      }
    }')"

  if echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
    echo "Certificat créé avec succès."
    CERT_ID="$(echo "$response" | jq -r '.id')"
    echo "$CERT_ID" > "$CERT_ID_FILE"
    echo "CERT_ID: $CERT_ID"

    # Ces champs peuvent être null si CSR fourni
    cert="$(echo "$response" | jq -r '.certificate // empty')"
    privkey="$(echo "$response" | jq -r '.private_key // empty')"
    chain="$(echo "$response" | jq -r '.certificate_chain // empty')"

    [ -n "$cert" ] && [ "$cert" != "null" ] && printf '%s\n' "$cert" > "$CERT_DIR/cert.pem"
    [ -n "$privkey" ] && [ "$privkey" != "null" ] && printf '%s\n' "$privkey" > "$CERT_DIR/privkey.pem"
    [ -n "$chain" ] && [ "$chain" != "null" ] && printf '%s\n' "$chain" > "$CERT_DIR/chain.pem"
  else
    echo "Erreur lors de la création du certificat:"
    echo "$response" | jq .
    exit 1
  fi
}

# Fonction pour vérifier le domaine
verify_domain() {
  load_cert_id
  verification_response="$(curl -s -X POST "https://api.zerossl.com/certificates/$CERT_ID/verify" \
    -H "Content-Type: application/json" \
    -d '{ "access_key": "'"$access_jey"'" }')"

  if echo "$verification_response" | jq -e '.success == true' >/dev/null 2>&1; then
    echo "Domaine vérifié avec succès."
  else
    echo "Erreur lors de la vérification du domaine:"
    echo "$verification_response" | jq .
    exit 1
  fi
}

# Fonction "Get certificate" (métadonnées/status)
get_certificate() {
  load_cert_id
  get_resp="$(curl -s -G "https://api.zerossl.com/certificates/$CERT_ID" \
    --data-urlencode "access_key=$access_jey")"

  # Affiche le status et quelques champs utiles
  echo "Informations du certificat:"
  echo "$get_resp" | jq '{id, status, common_name: .certificate.common_name, created: .created, expires: .expires, validation: .validation}'
}

# Fonction pour télécharger le certificat (ZIP) et extraire
download_certificate() {
  load_cert_id

  zip_path="$CERT_DIR/${DOMAIN}_${CERT_ID}.zip"
  echo "Téléchargement du certificat (ZIP) vers: $zip_path"
  curl -f -sS -G "https://api.zerossl.com/certificates/$CERT_ID/download" \
    --data-urlencode "access_key=$access_jey" \
    -o "$zip_path"

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
    verify_domain
    ;;
  get)
    get_certificate
    ;;
  download)
    download_certificate
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