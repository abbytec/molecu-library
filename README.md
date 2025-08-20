# Molecu-library

Aplicación de gestion de libros y reseñas en nuxt y moleculer.

# Mis notas:

-   El proyecto requería correr en node 18 por lo que versiónes posteriores de nuxt no funcionaban
-   No usé sidebase/nuxt-auth porque, aunque puede convivir con ssr: false, necesita un servidor Nitro para las rutas de autenticación. Mi requisito era un SPA con backend separado; preferí no introducir un segundo servidor (Nitro) además de la API en Moleculer. Así mantengo el front 100% CSR y toda la lógica de auth en la API.
