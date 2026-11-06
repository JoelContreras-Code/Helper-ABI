# 11 · Referencia de la API

API REST en `http://127.0.0.1:4000/api` (solo accesible desde el propio equipo).
JSON en **snake_case**, igual que los datos que envían los workers de Python.

## Reglas generales

| Regla | Detalle |
| --- | --- |
| Escrituras | `POST`/`PATCH` exigen `Content-Type: application/json` → si no, **415**. Bloquea formularios de otras páginas web |
| CORS | Solo `WEB_ORIGIN` (el panel) |
| Token interno | Endpoints marcados 🔒 exigen `Authorization: Bearer <INGEST_TOKEN>` → si no, **401** |
| Límite de peticiones | `/ingest`: 120/min · escrituras de `/sync-jobs`: 30/min → **429** |
| Errores | `{ "error": "<code>", "message"?: "...", "issues"?: [{ "path", "message" }] }`. Nunca se muestran trazas internas |

Códigos de error: `validation_error` (400), `invalid_json` (400), `unauthorized` (401),
`not_found` / `source_not_found` / `sync_job_not_found` (404), `unsupported_media_type` (415),
`source_not_enabled` / `sync_job_in_progress` / `sync_job_not_running` / `sync_job_finished` / `conflict` (409),
`payload_too_large` (413), `unknown_source` (422), `rate_limited` (429), `internal_error` (500).

## Endpoints

| Método | Ruta | Quién | Qué hace |
| --- | --- | --- | --- |
| GET | `/health` | Todos | Estado de la API |
| GET | `/sources` | Panel | Catálogo de fuentes con `can_automate` y `sync_state` |
| GET | `/intel?source=&category=&limit=&offset=` | Panel | Contenido recolectado, más reciente primero (sin fecha al final). `limit` 1–100 (20 por defecto) |
| POST | `/ingest` 🔒 | Runner Python | Guarda hasta 200 elementos de una fuente; deduplica |
| POST | `/sync-jobs` | Panel / tarea programada | Crea un trabajo `queued`. Solo uno activo a la vez (409) |
| GET | `/sync-jobs?limit=` | Panel | Últimos trabajos con resultados por fuente |
| GET | `/sync-jobs/:id` | Panel | Un trabajo |
| PATCH | `/sync-jobs/:id` 🔒 | Runner Python | Reporta progreso y resultados |

### POST /api/ingest

```json
{
  "source_key": "steam_news",
  "sync_job_id": 12,
  "items": [
    {
      "external_id": "1847920302230290",
      "canonical_url": "https://store.steampowered.com/news/app/2073620/view/1847920302230290",
      "title": "Arena Breakout: Infinite Halloween Event",
      "content_type": "announcement",
      "primary_category": "events",
      "tags": ["halloween"],
      "published_at": "2026-10-28T00:00:00Z",
      "retrieved_at": "2026-11-06T21:10:50Z"
    }
  ]
}
```

- Campos opcionales: `description`, `content_excerpt` (≤ 2000), `language`, `author_or_channel`,
  `game_version`, `season`, `thumbnail_url`, `metadata` (≤ 8 KB). Campos desconocidos → 400.
- URLs solo `http(s)` (se rechazan `javascript:`, `data:`, etc.). Fechas ISO 8601 con zona horaria.
- La fuente debe existir y tener `can_automate = true` (activa, términos revisados, automatización habilitada) → si no, 409.
- Si se envía `sync_job_id`, el trabajo debe estar `running`.
- Respuesta: `{ source_key, received, created, updated, duplicates }` (201 si creó algo, 200 si no).
- Todo el lote se guarda en una transacción: o entra completo o no entra nada.
- Todo entra con `verification_status = "pending"` y `processing_status = "new"`.

### PATCH /api/sync-jobs/:id

```json
{
  "status": "finished",
  "results": [
    { "source_key": "steam_news", "status": "success", "items_created": 1, "cursor": "1847920302230290", "duration_ms": 1200 },
    { "source_key": "official_cms", "status": "failed", "error": "HTTP 503" }
  ]
}
```

| `status` enviado | Efecto |
| --- | --- |
| `running` | `queued → running`; guarda `started_at`. Puede incluir resultados parciales |
| `finished` | La API **calcula** el estado final: todo OK/omitido → `success`; todo falló → `failed`; mezcla → `partial` |
| `failed` | El runner falló por completo; guarda `error` |

- Resultado `success`: avanza el cursor de la fuente y reinicia `consecutive_failures`.
- Resultado `failed`: conserva el cursor anterior e incrementa `consecutive_failures`.
- Un trabajo terminado no admite cambios (409). Un trabajo activo con más de 2 h sin terminar se marca `failed` automáticamente al crear el siguiente.
