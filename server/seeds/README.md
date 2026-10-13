# Datos iniciales

El catálogo de 23 países y los ajustes iniciales están definidos en `server/src/server.ts` y se insertan con `INSERT OR IGNORE` durante el primer inicio.

No hay conversaciones, visitantes ni historial inventado en el paquete. Esas tablas comienzan vacías y reciben datos únicamente cuando una persona usa la aplicación.
