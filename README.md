# Cake Artist — Vale

Proyecto completo y autónomo del funnel conversacional de Cake Artist.

## Qué incluye

- Frontend React, diseño móvil y recursos visuales oficiales.
- Backend Bun con motor conversacional determinista.
- SQLite integrado para conservar conversaciones y configuración.
- Panel de precios existente.
- Audio, imágenes adjuntas, video tutorial y enlace de checkout.
- Dockerfile y configuraciones para Railway y Render.

## Requisitos locales

- Bun 1.3 o superior, o Docker.

## Probar en la computadora

```bash
cp .env.example .env
bun install
bun run build
bun start
```

Abrir `http://localhost:3000`.

Con Docker:

```bash
docker build -t cake-artist-vale .
docker run --rm -p 3000:3000 -v cake_artist_data:/data cake-artist-vale
```

## Variables

- `PORT`: puerto HTTP. Railway y Render lo asignan automáticamente.
- `DATA_DIR`: carpeta del archivo SQLite. Para un volumen persistente use `/data`.
- `UPLOAD_DIR`: carpeta de audios e imágenes. Para un volumen use `/data/uploads`.
- `DIST_DIR`: carpeta del frontend compilado; normalmente `./dist`.

No se necesita MySQL, PostgreSQL ni un servidor de base de datos externo. SQLite se crea solo como un archivo al iniciar.

## Salud del servicio

`GET /health` devuelve `{ "status": "ok" }`.

## Despliegue

Consulta `GUIA_DESPLIEGUE.md` para el paso a paso sin tecnicismos.
