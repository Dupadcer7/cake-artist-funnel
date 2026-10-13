# Guía sencilla para publicar Cake Artist con tu propio enlace

## Antes de comenzar

Tienes un archivo ZIP con el proyecto completo. **Primero descomprímelo**. No subas el ZIP cerrado al hosting: Railway y Render normalmente leen el proyecto desde un repositorio de GitHub.

No necesitas contratar ni configurar una base de datos externa. El proyecto usa **SQLite**, que es un archivo que se crea automáticamente. Si por ahora no necesitas guardar conversaciones, puedes publicar sin disco persistente. La página y el funnel seguirán funcionando; solo se pueden perder conversaciones y cambios de precios cuando el servicio se reinicie.

## Opción recomendada: Railway

Railway suele ser la ruta más sencilla para este proyecto porque reconoce el `Dockerfile` incluido.

### 1. Subir el proyecto a GitHub

1. Crea una cuenta en GitHub si aún no la tienes.
2. En GitHub, pulsa **+** y después **New repository**.
3. Ponle un nombre, por ejemplo `cake-artist-vale`.
4. Puedes elegir **Private** para que el código no sea público.
5. Crea el repositorio sin añadir archivos extra.
6. Abre la carpeta descomprimida `cake-artist-proyecto` en tu computadora.
7. En el repositorio de GitHub, pulsa **Add file → Upload files**.
8. Arrastra **el contenido de la carpeta**, no el archivo ZIP.
9. Espera que termine y pulsa **Commit changes**.

Si el navegador no acepta todos los archivos de una vez, súbelos por carpetas o utiliza GitHub Desktop. El proyecto contiene recursos multimedia grandes, pero cada archivo está por debajo del límite habitual de subida web.

### 2. Crear el servicio en Railway

1. Abre el sitio oficial de Railway y crea una cuenta, preferiblemente entrando con GitHub.
2. Pulsa **New Project**.
3. Elige **Deploy from GitHub repo**.
4. Autoriza a Railway para ver el repositorio que creaste.
5. Selecciona `cake-artist-vale`.
6. Railway detectará el `Dockerfile` y empezará a construir el proyecto.
7. Espera a que el despliegue quede en estado correcto. En los registros debe aparecer `Cake Artist listo en el puerto`.
8. En el servicio, abre **Settings → Networking** y pulsa **Generate Domain**.
9. Abre el enlace generado y prueba la conversación.

Documentación oficial de referencia: https://docs.railway.com/guides/react

### 3. Variables de entorno

En Railway abre el servicio y entra en **Variables**. La plataforma ya define `PORT`, así que no necesitas crearla.

Para empezar sin guardar datos, no necesitas añadir variables.

Si más adelante activas un volumen, añade:

```text
DATA_DIR=/data
UPLOAD_DIR=/data/uploads
DIST_DIR=/app/dist
```

No añadas claves privadas al código ni al repositorio.

### 4. Guardar datos de forma permanente (opcional)

Hazlo solo si quieres conservar conversaciones, audios, imágenes y cambios del panel después de reinicios.

1. En el proyecto de Railway, añade un **Volume** al mismo servicio.
2. Usa la ruta de montaje `/data`.
3. Confirma las variables `DATA_DIR=/data` y `UPLOAD_DIR=/data/uploads`.
4. Vuelve a desplegar.

SQLite quedará en `/data/cake-artist.sqlite`. No tienes que crear un servidor de base de datos.

Documentación oficial de volúmenes: https://docs.railway.com/guides/volumes.md

### 5. Conectar tu dominio propio

1. En Railway abre **Settings → Networking → Custom Domain**.
2. Escribe el dominio o subdominio que quieres usar, por ejemplo `curso.tudominio.com`.
3. Railway te mostrará un destino DNS. **Cópialo exactamente**; no lo adivines.
4. En la empresa donde compraste tu dominio, abre la sección **DNS**.
5. Para un subdominio como `curso`, crea el registro **CNAME** que Railway indique.
6. Para el dominio principal sin `www`, usa el tipo de registro que Railway muestre para tu proveedor.
7. Guarda los cambios y espera la verificación. El DNS puede tardar desde minutos hasta varias horas.
8. Railway emitirá el certificado HTTPS cuando el DNS esté correcto.

No borres los registros de correo de tu dominio. Solo crea o cambia el registro que Railway te indique.

## Alternativa: Render

El paquete también incluye `render.yaml` y el mismo `Dockerfile`.

1. Crea una cuenta en Render e inicia con GitHub.
2. En el panel pulsa **New → Blueprint**.
3. Conecta el repositorio `cake-artist-vale`.
4. Render leerá `render.yaml`.
5. Confirma la creación del servicio y espera el despliegue.
6. Abre el enlace terminado en `onrender.com` que Render asigne.

Guía oficial del primer despliegue: https://render.com/docs/your-first-deploy

### Disco en Render (opcional)

El plan gratuito puede reiniciarse y perder el archivo SQLite. Si quieres conservar datos, usa un plan que permita disco persistente:

1. Abre el servicio → **Disks** o **Advanced**.
2. Añade un disco con ruta de montaje `/data`.
3. Cambia las variables a `DATA_DIR=/data` y `UPLOAD_DIR=/data/uploads`.
4. Vuelve a desplegar.

Documentación oficial: https://render.com/docs/disks

### Dominio en Render

1. Abre el servicio → **Settings → Custom Domains**.
2. Añade tu dominio.
3. Copia exactamente los registros DNS que Render muestre.
4. Créelos en el panel de la empresa donde compraste el dominio.
5. Espera la verificación y prueba el enlace con `https://`.

Documentación oficial: https://render.com/docs/custom-domains

## Cómo comprobar que todo funciona

Haz estas pruebas después de publicar:

1. Abre el enlace desde tu teléfono en modo incógnito.
2. Verifica que aparece Vale y que puedes pulsar una respuesta rápida.
3. Recorre: **Comienzo desde cero → Prefiero seguir → Ver precio**.
4. Escribe un país compatible, por ejemplo Colombia, y confirma que aparece el precio, los medios de pago y el tutorial.
5. Abre el video de inscripción.
6. Confirma que el botón de inscripción abre Hotmart en otra pestaña.
7. Envía `No gracias, es muy caro y pensé que era presencial` y verifica que Vale cierre con amabilidad sin volver a vender.
8. Abre la dirección `/health` al final de tu dominio. Debe mostrar `status: ok`.
9. Si activaste disco, conversa, reinicia el servicio desde el hosting y vuelve a abrir con el mismo navegador. La conversación debe seguir allí.

## Actualizar la página más adelante

1. Modifica los archivos en tu repositorio de GitHub.
2. Guarda los cambios con un nuevo commit.
3. Railway o Render iniciará otro despliegue automáticamente.
4. Repite las pruebas anteriores.

## Costos

Los precios de los planes cambian. Revisa el precio actual antes de confirmar un plan: https://docs.railway.com/pricing/plans

El dominio se paga por separado a la empresa registradora. No necesitas comprar otro servidor de base de datos.

## Si algo falla

- **No carga la página:** abre los logs y busca el primer error del despliegue.
- **Error al construir:** confirma que `Dockerfile`, `package.json`, `client` y `server` están en la raíz del repositorio.
- **No hay enlace público:** en Railway genera un dominio en Networking; en Render abre el enlace asignado al servicio.
- **Se perdieron conversaciones:** activa un disco/volumen y usa la ruta `/data`.
- **El dominio no verifica:** revisa que el CNAME o registro indicado esté copiado exactamente y espera la propagación DNS.
