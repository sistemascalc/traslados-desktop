# Traslados

Aplicación Electron para Mac y Windows del registro compartido de traslados matrimoniales, sin cuenta ni clave.

## Instalar y usar

Descarga la versión más reciente desde [Releases](https://github.com/sistemascalc/traslados-desktop/releases/latest).

- **Mac:** abre el DMG y arrastra Traslados a Aplicaciones. El instalador universal funciona en Intel y Apple Silicon.
- **Windows:** ejecuta el instalador EXE y sigue los pasos.
- Abre Traslados directamente: no se requiere cuenta de ChatGPT ni clave. Necesita internet. Cualquier persona con el enlace puede consultar nombres, datos y fotos, registrar ingresos y actualizar estados en el mismo registro compartido.
- La recepción, entrega a la capellanía, regreso y avisos se administran en el mismo registro. Las fotos se amplían en un visor dentro de la ficha.
- Para actualizar, selecciona **Traslados → Buscar actualizaciones**. La edición inicial permite descargar e instalar la versión más reciente de GitHub. Guarda cualquier formulario antes de cerrar la aplicación.

Esta edición inicial no tiene certificado de firma de Apple ni Windows. El sistema puede mostrar un aviso de desarrollador no identificado. No se incluyen credenciales ni datos de matrimonios en este repositorio.

## Desarrollo

Requiere Node.js 22 o superior.

```sh
npm ci
npm test
npm start
npm run build:mac -- --universal
npm run build:win
```

La aplicación no exige iniciar sesión. El contenido web se ejecuta con sandbox, aislamiento de contexto y sin acceso a Node.js. Solo se permiten el sitio configurado y los dominios de autenticación indicados en `src/policy.cjs`.

## Publicar una actualización

1. Actualiza `version` en `package.json` y el archivo de bloqueo (`npm version patch --no-git-tag-version`).
2. Sube los cambios a `main`.
3. En Actions, ejecuta **Publicar instaladores**, o crea una etiqueta `v` seguida de la versión (por ejemplo, `v1.0.1`).
4. El flujo prueba el código, genera Mac universal y Windows x64, y publica los instaladores y sus sumas SHA-256 en GitHub Releases.

Para habilitar actualización automática firmada, configura los secretos `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` y/o `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`. El flujo activa el mecanismo automático únicamente al disponer de la firma de esa plataforma. En Mac se requieren firma Developer ID y notarización válidas. Nunca guardes certificados o claves en el repositorio.

La actualización de la interfaz y del servidor se realiza en el sitio compartido; este repositorio distribuye la aplicación de escritorio. No contiene copias de la base de datos ni de documentos.
