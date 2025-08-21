#!/bin/bash

# Variables de configuración
BASE_URL="http://localhost:8181"
USERNAME="admin"
PASSWORD="secret"

echo "=== 1. Login ==="
curl -c cookies.txt -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}"

echo -e "\n\n=== 2. Verificar sesión ==="
curl -b cookies.txt $BASE_URL/api/auth/me

echo -e "\n\n=== 3. Buscar libros ==="
curl -b cookies.txt "$BASE_URL/api/books/search?q=harry%20potter"

echo -e "\n\n=== 4. Ver historial de búsquedas ==="
curl -b cookies.txt $BASE_URL/api/books/last-search

echo -e "\n\n=== 5. Guardar libro ==="
BOOK_RESPONSE=$(curl -s -b cookies.txt -X POST $BASE_URL/api/books/my-library \
  -H "Content-Type: application/json" \
  -d '{
    "ol_key": "/works/OL45883W",
    "title": "Harry Potter Test",
    "author": "J.K. Rowling",
    "year": 1997,
    "review": "Libro de prueba",
    "rating": 4,
    "coverId": "8739161"
  }')

echo $BOOK_RESPONSE

# Extraer ID del libro guardado
BOOK_ID=$(echo $BOOK_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

echo -e "\n\n=== 6. Listar mi biblioteca ==="
curl -b cookies.txt $BASE_URL/api/books/my-library

if [ ! -z "$BOOK_ID" ]; then
  echo -e "\n\n=== 7. Obtener libro específico ==="
  curl -b cookies.txt $BASE_URL/api/books/my-library/$BOOK_ID

  echo -e "\n\n=== 8. Actualizar libro ==="
  curl -b cookies.txt -X PUT $BASE_URL/api/books/my-library/$BOOK_ID \
    -H "Content-Type: application/json" \
    -d '{
      "review": "Review actualizado desde curl",
      "rating": 5
    }'

  echo -e "\n\n=== 9. Ver portada ==="
  echo -e "omitido por datos fakes"
  # curl -b cookies.txt -I $BASE_URL/api/books/library/front-cover/$BOOK_ID

  echo -e "\n\n=== 10. Eliminar libro ==="
  curl -b cookies.txt -X DELETE $BASE_URL/api/books/my-library/$BOOK_ID
fi

# Limpiar
rm -f cookies.txt