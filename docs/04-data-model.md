# 04 · Modelo de datos

> **Estado: ✅ aprobado por el operador (06/11/2026, P-11).** Unifica las 9 tablas de la
> spec original con los requisitos de procedencia e historial de [03](03-data-governance.md).
>
> Las tablas se crean **por fases**, con una migración cuando el código que las usa existe
> (no se crea esquema sin uso ni pruebas):
>
> | Fase | Tablas | Estado |
> | --- | --- | --- |
> | 2 BÚNKER | `sources`, `source_sync_states`, `sync_jobs`, `sync_job_results`, `intel_items`, `intel_item_tags` | ✅ Migradas |
> | 4 RECONOCIMIENTO | `intel_item_analyses` | ⏳ |
> | 5 ARSENAL | `game_entities`, `entity_aliases`, detalle por tipo, `stat_observations`, `price_observations`, `evidence`, `builds`, `tier_lists`, `review_tasks`, mapas | ⏳ |
> | 6–7 | `raids`, `deaths`, `reports`, `report_sources` | ⏳ |
>
> Cambios respecto a la propuesta, aplicados en la Fase 2: `sync_jobs.status` incluye
> `queued`; `source_sync_states` añade `consecutive_failures` (alerta tras N fallos);
> `access_method` admite `json`.

## 1. Decisión de diseño

En lugar de poner cada estadística como columna fija de `ammo` o `armor` (que obliga a
sobrescribir y pierde historial), se separa:

- **Entidades maestras** (`game_entities` + tablas de detalle por tipo): identidad estable.
- **Observaciones** (`stat_observations`, `price_observations`): cada valor con fecha,
  versión, fuente y estado. El "valor vigente" es una consulta, no una columna sobrescrita.
- **Evidencia** (`evidence`): qué fuente respalda qué observación.

Así se cumplen a la vez: historial preservado, discrepancias sin promediar y procedencia.

## 2. Tablas

### Fuentes y recolección

| Tabla | Propósito | Campos clave |
| --- | --- | --- |
| `sources` | Catálogo de fuentes | `key` (único), `name`, `base_url`, `source_type`, `trust_level` (A–E), `access_method` (`api`/`rss`/`json`/`html`/`manual`), `game_version`, `region`, `language`, `status` (`active`/`unavailable`/`restricted`/`deprecated`/`pending_review`), `terms_reviewed`, `automation_enabled`, `notes` |
| `source_sync_states` | Cursor incremental por fuente (1:1 con `sources`) | `last_attempt_at`, `last_success_at`, `last_seen_published_at`, `cursor`, `status`, `last_error` |
| `sync_jobs` | Cada ejecución (botón o cron) | `trigger` (`manual`/`scheduled`), `status` (`running`/`success`/`partial`/`failed`), `started_at`, `finished_at`, `range_from` |
| `sync_job_results` | Resultado por fuente dentro de un job | `sync_job_id`, `source_id`, `status`, `items_created`, `items_updated`, `duplicates_skipped`, `error`, `duration_ms` |
| `intel_items` | Contenido externo recolectado (antes `intel`) | `source_id`, `external_id`, `canonical_url`, `title`, `description`, `content_excerpt`, `content_type` (`article`/`video`/`post`/`patch_notes`…), `primary_category`, `language`, `author_or_channel`, `published_at`, `retrieved_at`, `game_version`, `season`, `verification_status`, `processing_status`, `content_hash`, `thumbnail_url`, `metadata_json` · **único** (`source_id`, `external_id`) |
| `intel_item_tags` | Categorías secundarias / etiquetas | `intel_item_id`, `tag`, `assigned_by` (`rule`/`llm`/`operator`) |
| `intel_item_analyses` | Clasificación y resumen del LLM | `intel_item_id`, `model`, `prompt_version`, `summary`, `entities_json`, `wrong_game_suspected`, `status`, `processed_at` |

### Conocimiento del juego

| Tabla | Propósito | Campos clave |
| --- | --- | --- |
| `game_entities` | Identidad de cualquier objeto del juego | `entity_key` (único, ej. `ammo:7.62x51:m80`), `entity_type` (`weapon`/`ammo`/`armor`/`helmet`/`medical`/`map`/`extraction`/`trader`), `canonical_name`, `status` |
| `entity_aliases` | Nombres alternativos y localizados | `entity_id`, `alias`, `language`, `alias_type` (`official`/`localized`/`abbreviation`/`community`) |
| `weapons` / `ammo` / `armor` / `medical_items` / `maps` | Detalle **estable** por tipo (1:1 con `game_entities`) | p. ej. `ammo.caliber`, `armor.armor_type` (`helmet`/`vest`/`plate_carrier`), `weapons.caliber`. Sin cifras que cambien por parche |
| `stat_observations` | Valores que pueden cambiar (penetración, daño, durabilidad, cadencia…) | `entity_id`, `field`, `value_numeric`, `value_text`, `unit`, `season`, `patch_version`, `valid_from`, `valid_until`, `observed_at`, `verification_status`, `supersedes_id` |
| `price_observations` | Histórico de precios con contexto | `entity_id`, `currency`, `amount`, `market` (`trader`/`player_market`), `trader_name`, `region`, `quantity`, `condition`, `fees_included`, `observed_at`, `source_id`, `verification_status` |
| `evidence` | Respaldo de una observación | `observation_type` + `observation_id`, `source_id`, `source_url`, `excerpt`, `evidence_type`, `retrieved_at`, `published_at`, `game_version`, `reviewed_by`, `reviewed_at` |
| `builds` + `build_components` | Builds atribuidas | `weapon_entity_id`, `purpose`, `estimated_cost`, `cost_observed_at`, `mode`, `map_entity_id`, `range`, `author`, `source_id`, `limitations` / componentes: `build_id`, `entity_id`, `slot` |
| `tier_lists` + `tier_list_entries` | Rankings externos atribuidos | `author`, `source_url`, `published_at`, `season`, `mode` / `tier_list_id`, `entity_id`, `tier`, `rank`, `rationale` |
| `review_tasks` | Cola de revisión del operador | `target_type`, `target_id`, `reason` (`pending`/`discrepancy`/`wrong_game`/`stale`), `status` (`open`/`approved`/`rejected`), `resolution_note`, `resolved_at` |

### Datos personales del operador

| Tabla | Propósito | Campos clave |
| --- | --- | --- |
| `raids` | Registro de partidas | `map_entity_id`, `mode`, `loadout_value`, `loot_value`, `survived`, `net_result`, `played_at`, `notes` |
| `deaths` | Muertes e informe forense | `raid_id` (opcional), `screenshot_path` (UUID), `extracted_json`, `weapon_entity_id`, `ammo_entity_id`, `hit_zones`, `distance_m`, `report_md`, `model`, `analyzed_at` |
| `reports` | Partes de inteligencia | `report_date`, `report_type` (`daily`/`forensic`/`weekly`), `content_md`, `app_version`, `model`, `period_from`, `period_to`, `limitations` |
| `report_sources` | Qué contenido y datos usó cada informe | `report_id`, `intel_item_id` / `observation_id` |

## 3. Relaciones principales

```text
sources 1─1 source_sync_states
sources 1─N intel_items 1─N intel_item_tags
                         1─N intel_item_analyses
sync_jobs 1─N sync_job_results N─1 sources

game_entities 1─1 (weapons | ammo | armor | medical_items | maps)
game_entities 1─N entity_aliases
game_entities 1─N stat_observations 1─N evidence N─1 sources
game_entities 1─N price_observations
stat_observations ─ supersedes_id → stat_observations   (historial)

builds N─1 game_entities (arma) · builds 1─N build_components N─1 game_entities
tier_lists 1─N tier_list_entries N─1 game_entities
reports 1─N report_sources → intel_items | stat_observations
raids 1─N deaths
```

## 4. Integridad

- Claves foráneas en todas las relaciones; migraciones reversibles (`down`) cuando sea viable.
- `seeders/base` solo carga registros con `verification_status` aprobado.
- `seeders/dev` usa datos claramente ficticios (prefijo `DUMMY_`) y se eliminan con `db:seed:undo:dev`.
- Exportación conserva IDs, relaciones, unidades, procedencia, estados y fechas; importación idempotente (upsert por clave natural).
- Cada cambio de esquema: migración + prueba + nota en el informe de fase.

## 5. Preguntas resueltas

1. Modelo de **observaciones** (más tablas, historial completo): ✅ aprobado.
2. `evidence` polimórfica o una tabla por tipo: se decide en la Fase 5 con los datos reales delante
   (recomendación inicial: una tabla por tipo, porque permite claves foráneas reales).
3. Mapas y extracciones: Fase 5.
