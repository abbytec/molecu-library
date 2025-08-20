# Molecu-library

Aplicación de gestion de libros y reseñas en nuxt y moleculer.

# Mis notas:

-   La paleta de colores está basada en la de la misma API que se consume (openlibrary)
-   El proyecto requería correr en node 18 por lo que versiónes posteriores de nuxt no funcionaban
-   No usé sidebase/nuxt-auth porque, aunque puede convivir con ssr: false, necesita un servidor Nitro para las rutas de autenticación. Mi requisito era un SPA con backend separado; preferí no introducir un segundo servidor (Nitro) además de la API en Moleculer. Así mantengo el front 100% CSR y toda la lógica de auth en la API.
-   Usé una librería compartida para los tipos de datos con los que se trabajará. Para aprovechar mejor la arquitectura mono-repo.

## 🚀 Comandos de Deployment

### Desarrollo

```bash
npm run dev              # Frontend + Backend en paralelo
npm run dev:api          # Solo backend
npm run dev:front        # Solo frontend
```

### Producción

```bash
# Deployment automático
chmod +x deploy.sh
./deploy.sh

# O comandos manuales
npm run build            # Construir todo (shared → api → frontend)
npm run start            # Iniciar en modo producción

# Comandos individuales
npm run build:shared     # Solo tipos compartidos
npm run build:api        # Solo backend
npm run build:front     # Solo frontend
npm run start:api        # Solo backend en producción
npm run start:front     # Solo frontend en producción
```

### Utilidades

```bash
npm run clean            # Limpiar archivos temporales
npm run install:all      # Reinstalar todas las dependencias
npm run deploy:setup     # Setup completo para deployment
```

📖 **Documentación completa**: Ver [DEPLOYMENT.md](DEPLOYMENT.md)
