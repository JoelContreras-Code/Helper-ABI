# FASE 1 — CIMIENTOS

> **Fecha:** 06/11/2026 · **Estado:** ✅ terminada, pendiente de aprobación del operador
> **Rama:** `dev`

## 1. Qué se hizo

### Herramientas instaladas en el equipo

| Herramienta | Antes | Ahora | Cómo |
| --- | --- | --- | --- |
| Node.js | 24.11.1 | **26.13.0 LTS** | `winget upgrade OpenJS.NodeJS.LTS` (global, con permiso de administrador) |
| pnpm | 9.13.2 | **12.18.0** | `npm install -g pnpm@12.18.0` (Node 25+ ya no trae Corepack) |
| uv | — | **0.13.7** | `winget install astral-sh.uv --scope user` |
| Python (proyecto) | 3.14.2 (sistema) | **3.15.2** (gestionado por uv) | `uv python install 3.15`. El Python 3.14 del sistema **no se tocó** |

### Archivos creados

| Ruta | Qué es |
| --- | --- |
| `package.json`, `pnpm-workspace.yaml` | Monorepo: scripts comunes y lista de apps |
| `tsconfig.base.json` | TypeScript estricto compartido |
| `eslint.config.js`, `.prettierrc.json`, `.prettierignore` | Reglas de calidad y formato |
| `.env.example` | Plantilla de todas las variables (sin secretos) |
| `.nvmrc` | Versión de Node del proyecto |
| `docker-compose.yml` | PostgreSQL 18.6 opcional (perfil `postgres`, solo localhost) |
| `.vscode/` | Extensiones recomendadas y formato al guardar |
| `scripts/setup.ps1` | Instalador para Windows (idempotente) |
| `apps/api/` | API Express 5: `GET /api/health`, helmet, CORS limitado, errores en JSON, logs con fecha, validación del entorno con Zod |
| `apps/web/` | Panel React 19 + Vite 8 + Tailwind 4: tema militar, lista de pantallas (desactivadas hasta la Fase 3) y estado de la API |
| `services/` | Proyecto Python (uv): configuración validada (`common/settings.py`) que **impone ≥ 2 s entre peticiones** |
| `data/{knowledge,screenshots,exports,recordings}/` | Carpetas de datos (las privadas, ignoradas por Git) |

## 2. Decisiones técnicas

- **Sin `dotenv`:** la API usa `process.loadEnvFile`, que ya viene en Node 26.
- **Seguridad de dependencias:** pnpm 12 bloquea paquetes publicados hace muy poco.
  Tailwind 4.3.5 salió el mismo día → se usa **4.3.4** en lugar de saltarse la protección.
  Solo `esbuild` tiene permiso para ejecutar su script de instalación.
- **API solo en `127.0.0.1`** y CORS solo para el panel.
- **El panel no usa todavía TanStack Query ni React Router**: llegan en la Fase 3, cuando
  hay pantallas reales (no se instalan dependencias que aún no se usan).
- `scripts/reset-db.ps1` se crea en la Fase 2, cuando exista la base de datos.

Registradas en [`../10-decisions.md`](../10-decisions.md) (D-21 a D-24) y [ADR-0001](../adr/0001-latest-stable-versions.md).

## 3. Pruebas y resultados

| Verificación | Comando | Resultado |
| --- | --- | --- |
| Instalador completo (2 ejecuciones seguidas) | `scripts/setup.ps1` | ✅ Exit 0, idempotente |
| Formato | `pnpm format:check` | ✅ |
| Lint (ESLint estricto con tipos) | `pnpm lint` | ✅ 0 problemas |
| Tipos | `pnpm typecheck` | ✅ |
| Pruebas API | `pnpm test` | ✅ 8/8 (health, 404 JSON, CORS, cabeceras de seguridad, validación de entorno) |
| Pruebas panel | `pnpm test` | ✅ 4/4 (título, API en línea, API caída, respuesta inesperada) |
| Pruebas Python | `pnpm py:test` | ✅ 4/4 (valores por defecto, archivo `.env`, secretos ocultos, rechazo de pausas < 2 s) |
| Lint/formato Python | `pnpm py:lint` | ✅ |
| Todo junto | `pnpm check` | ✅ Exit 0 |
| Compilación | `pnpm build` | ✅ |
| Prueba real | API + panel encendidos | ✅ `/api/health` responde directo y a través del proxy del panel |

## 4. Cómo lo verificas tú (paso a paso)

1. Abre una terminal en VS Code (**Terminal → New Terminal**). Si ya tenías una abierta, ciérrala y abre otra para que reconozca los programas nuevos.
2. Ejecuta `pnpm check`. Al final no debe aparecer ningún `failed` ni `error`.
3. Ejecuta `pnpm dev`. Espera a ver `API (development) listening on http://127.0.0.1:4000` y la línea de Vite con `http://127.0.0.1:5173`.
4. Abre **http://127.0.0.1:5173** en el navegador. Debes ver **OPERACIÓN CENTINELA** y, en *Estado del sistema*, **API · En línea · helper-abi-api v0.1.0**.
5. En la terminal pulsa `Ctrl + C` para detener todo. Recarga la página: ahora debe decir **Sin conexión** (así se ve un error de forma clara).
6. Cuando VS Code lo sugiera, instala las extensiones recomendadas.

## 5. Riesgos y pendientes

- ⚠️ Al actualizar Node a 26 de forma global, cualquier otro proyecto del equipo que dependiera de Node 24 podría notarlo (riesgo bajo, ambas son LTS).
- ⚠️ La carpeta tiene un espacio en el nombre (`Helper ABI`). Hasta ahora no causó problemas, pero en PowerShell las rutas van siempre entre comillas.
- ⏳ **P-04** (automatizar el CMS del sitio oficial) sigue sin respuesta; se necesita antes de la Fase 4.
- ⏳ **P-11:** aprobar el modelo de datos ([04-data-model.md](../04-data-model.md)) es lo primero de la Fase 2.
