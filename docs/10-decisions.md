# 10 · Registro de decisiones

Lo que está aquí como **tomado** no se vuelve a discutir salvo que el operador lo pida.
Las decisiones de arquitectura importantes tienen además su ADR en [`adr/`](adr/).

## 1. Decisiones tomadas

| ID | Fecha | Decisión | Origen |
| --- | --- | --- | --- |
| D-01 | 06/11/2026 | La raíz del proyecto es la carpeta `Helper ABI`; no se crea subcarpeta `helper-abi/` | Operador |
| D-02 | 06/11/2026 | Política de versiones: **última estable/LTS**, nunca alpha/beta → Node 26 LTS, Python 3.15, pnpm 12, etc. | Operador · [ADR-0001](adr/0001-latest-stable-versions.md) |
| D-03 | 06/11/2026 | TypeScript **6.0.3** (no 7.0) porque `typescript-eslint` aún no soporta TS 7 | Claude (técnica) · ADR-0001 |
| D-04 | 06/11/2026 | Sequelize **6** (v7 sigue en alpha) | Claude (técnica) · ADR-0001 |
| D-05 | 06/11/2026 | Entorno Python con **uv** + `pyproject.toml` en lugar de `requirements.txt` | Claude · ADR-0001 |
| D-06 | 06/11/2026 | Documentación consolidada (v2.0) en `docs/01…10`; originales archivados sin cambios | Operador · [ADR-0002](adr/0002-consolidated-documentation.md) |
| D-07 | 06/11/2026 | Copia duplicada de `ESPECIFICACION.md` en la raíz eliminada | Operador |
| D-08 | 06/11/2026 | Git: cuenta global ya configurada (`JoelContreras-Code`), repo personal `github.com/JoelContreras-Code/Helper-ABI`. Ramas `main` y `dev` | Operador |
| D-09 | 06/11/2026 | **Reddit** solo consulta manual: `robots.txt` `Disallow: /`, JSON 403 y (según prensa) cierre de nuevas solicitudes de API desde el 31/10/2026 | Fase 0 + investigación · resuelve C-1 |
| D-10 | 06/11/2026 | **YouTube** vía Data API v3 (`playlistItems.list`), **no** RSS (`Disallow: /feeds/videos.xml`). **Sin transcripciones** (la API oficial no lo permite para videos ajenos) | Investigación · resuelve C-2 |
| D-11 | 06/11/2026 | Motor balístico solo con **mecánicas verificadas**; sin reglas universales "pen X > armadura Y" | Resuelve C-3 |
| D-12 | 06/11/2026 | El modelo de datos se basa en **observaciones + evidencia** (propuesta en 04, se aprueba en Fase 2) | Resuelve C-4 |
| D-13 | 06/11/2026 | La wiki Fandom baja a fuente secundaria; se evalúan fuentes comunitarias más activas | Resuelve C-5 |
| D-14 | 06/11/2026 | Un solo punto de entrada de sincronización: `POST /api/sync-jobs` lanza el runner Python | Unifica spec §4 e investigación §6 |
| D-15 | 06/11/2026 | La tabla `intel` de la spec original pasa a llamarse `intel_items` (+ tablas de etiquetas y análisis) | 04 |
| D-16 | 06/11/2026 | Se añade **React Router** al stack (navegación entre pantallas) y una pantalla de **Revisión** | 02 |
| D-17 | 06/11/2026 | Prohibido eludir protecciones anti-bot; fuente bloqueada → consulta manual | CLAUDE.md · 05 |
| D-18 | 06/11/2026 | El perfil del operador (arma, niveles, economía) es configuración, no texto fijo en prompts | 01 §2 |
| D-19 | 06/11/2026 | **ABI Field Index** (`/data/ammo.json`, `/data/armor.json`) es la fuente técnica automatizada principal, nivel B, con aviso de posible desactualización | Investigación · 05 §2.3 |
| D-20 | 06/11/2026 | Fuentes con ToS que prohíben automatización (SenseOS), datos cifrados (ABI Tracker) o anti-bot (arenabreakout-infinite.com) → solo manuales | 05 §3–4 |
| D-21 | 06/11/2026 | Node actualizado **globalmente** a 26.13.0 con winget (no gestor de versiones) | Operador |
| D-22 | 06/11/2026 | pnpm 12.18.0 instalado con npm (Node 25+ ya no trae Corepack); Python 3.15.2 gestionado por uv sin tocar el Python 3.14 del sistema | Fase 1 |
| D-23 | 06/11/2026 | Se respeta la protección de antigüedad mínima de pnpm: sin excepciones; solo `esbuild` autorizado a ejecutar scripts de instalación | Fase 1 · ADR-0001 |
| D-24 | 06/11/2026 | Correo de Git: se mantiene el de la cuenta conectada | Operador |
| D-25 | 06/11/2026 | **Umzug 3** para migraciones y seeders en TypeScript, en lugar de `sequelize-cli` | Fase 2 · [ADR-0003](adr/0003-umzug-migrations.md) |
| D-26 | 06/11/2026 | Modelo de datos aprobado; las tablas se crean por fases cuando su código existe | Operador (P-11) · 04 |
| D-27 | 06/11/2026 | **Automatizar el CMS del sitio oficial aprobado** (cada 3–6 h, solo metadatos/extracto/enlace) | Operador (P-04) |
| D-28 | 06/11/2026 | API en JSON snake_case; escrituras solo con `Content-Type: application/json` (protección CSRF básica) | Fase 2 · 11 |
| D-29 | 06/11/2026 | YouTube queda deshabilitado en el catálogo hasta revisar los términos de la API de YouTube (Fase 4). Steam habilitado tras revisar sus términos | Fase 2 |
| D-30 | 06/11/2026 | `db:migrate:undo` borra datos de las tablas revertidas → en producción exige `--yes-delete-data` | Fase 2 |
| D-31 | 06/11/2026 | El catálogo de fuentes vive en `data/knowledge/sources.json` y se valida con Zod (la automatización exige términos revisados y fuente activa) | Fase 2 |

## 2. Contradicciones resueltas entre los documentos originales

| ID | Tema | Resolución |
| --- | --- | --- |
| C-1 | Reddit JSON público vs OAuth obligatorio | D-09 |
| C-2 | `youtube-transcript-api` obligatorio vs no garantizado | D-10 |
| C-3 | "penetración 5 vs casco 4" vs prohibición de reglas universales | D-11 |
| C-4 | 9 tablas simples vs requisitos de procedencia/historial | D-12 |
| C-5 | Fandom como fuente prioritaria vs baja actividad | D-13 |
| C-6 | `docs/SPEC.md` vs `ESPECIFICACION.md` duplicado | D-06, D-07 |
| C-7 | Node 22 vs versiones más nuevas | D-02 |
| C-8 | Disparo de sincronización: workers autónomos (spec) vs job creado por la API (investigación) | D-14 |
| C-9 | `requirements.txt` (spec) vs gestor moderno | D-05 |
| C-10 | Formato del parte sin etiquetas (spec §7) vs etiquetas obligatorias (protocolo §14) | Parte con etiquetas y sección de limitaciones (06 §6) |

## 3. Decisiones pendientes del operador

| ID | Pregunta | Bloquea | Recomendación |
| --- | --- | --- | --- |
| P-01 | Región/servidor de referencia para precios | Fase 5 | — |
| P-02 | Idioma prioritario de las fuentes (presentación: español) | Fase 4 | Fuentes en inglés + español |
| P-03 | Temporada y parche de línea base | Fase 5 | — |
| ~~P-04~~ | ~~¿Automatizar el CMS del sitio oficial?~~ | — | ✅ Aprobado (D-27) |
| P-05 | Canales de YouTube comunitarios (5–10) | Fase 4 | Empezar por el oficial (`UC4p7wn-3DHpKk_9hxftr0ag`) |
| P-14 | Crear una `YOUTUBE_API_KEY` gratuita en Google Cloud | Fase 4 | Claude guía paso a paso |
| P-15 | ¿Montar el seguimiento de anuncios de Discord en un servidor propio? | Fase 7 | Opcional |
| P-06 | Frecuencia de cada conector | Fase 7 | Valores iniciales de 06 §2 |
| P-07 | Retención de documentos, capturas e informes | Fase 4 | Reddit ≤ 48 h (política de Reddit); resto: indefinido salvo capturas |
| P-08 | Campos obligatorios para aprobar munición, armaduras y precios | Fase 5 | — |
| P-09 | Formato exacto del paquete de conocimiento | Fase 5 | Claude propone un JSON Schema |
| P-10 | Pruebas reproducibles para validar el calculador balístico | Fase 6 | — |
| ~~P-11~~ | ~~Aprobar el modelo de datos de [04](04-data-model.md)~~ | — | ✅ Aprobado (D-26) |
| P-12 | Revisar términos de uso de las fuentes comunitarias | Fase 4 | Ya revisados por Claude (05 §2–3); el operador confirma |
| ~~P-13~~ | ~~Instalar Node 26, Python 3.15, uv y actualizar pnpm~~ | — | ✅ Hecho en la Fase 1 |
