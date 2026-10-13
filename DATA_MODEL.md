# Modelo de datos

La aplicación utiliza SQLite en `DATA_DIR/cake-artist.sqlite`.

- `visitors`: identifica la sesión persistente del navegador y el estado de compra.
- `conversations`: historial JSON y estado completo del funnel.
- `processed_user_messages`: idempotencia para no responder dos veces al mismo mensaje.
- `country_prices`: precios, promoción y medios de pago por país.
- `app_settings`: configuración global de bonos y transcripción.

El servidor crea las tablas automáticamente al iniciar y carga el catálogo de países solo cuando faltan filas. No se insertan conversaciones de ejemplo. El archivo `server/migrations/001_initial.sql` documenta el esquema equivalente.
