# 06 · Pipeline de inteligencia

Flujo: **Sincronizar → Normalizar → Deduplicar → Guardar → Clasificar → Resumir → Informe.**

## 1. Conectores (unidades de reconocimiento)

Todos los conectores implementan la misma interfaz en `services/recon/`:

```python
class Connector(Protocol):
    source_key: str
    def fetch(self, since: datetime | None, cursor: str | None) -> FetchResult: ...
    # FetchResult = items normalizados + nuevo cursor + errores no fatales
```

- Cliente HTTP común (`services/common/http.py`): User-Agent de `HTTP_USER_AGENT`,
  pausa mínima `HTTP_MIN_DELAY_MS` (≥ 2000 ms) por dominio, timeouts, reintentos con
  *backoff* exponencial y respeto de `Retry-After` / errores 429.
- Si una fuente responde con un desafío anti-bot (Cloudflare, Vercel…), el conector
  **se detiene**, marca la fuente como `restricted` y no reintenta. No se elude.
- Qué conectores existen y su método exacto: [05-sources.md](05-sources.md).

## 2. Sincronización incremental

Cada fuente mantiene en `source_sync_states`: `last_attempt_at`, `last_success_at`,
`last_seen_published_at`, `cursor`, `status`, `last_error`.

1. Usar el cursor o la fecha del último éxito.
2. Consultar con una **ventana de solapamiento** (por defecto 24 h) para captar publicaciones tardías.
3. Deduplicar (ver §3).
4. Actualizar el cursor **solo después** de guardar correctamente.
5. Si falla: conservar el cursor anterior; reintento en la siguiente ejecución.

Primera carga: el operador elige rango (24 h, 7 días, 30 días o fecha). Después: "desde el último éxito".
Nunca usar la fecha de ejecución como fecha de publicación: `published_at`, `retrieved_at` y `updated_at` se guardan por separado.

### Estados del trabajo

`running` → `success` (todas OK) · `partial` (alguna falló) · `failed` (todas fallaron).
**Nunca** mostrar "completado" si alguna fuente falló.

El panel muestra: inicio/fin, duración, fuentes consultadas, nuevos, actualizados,
duplicados ignorados y errores por fuente.

### Frecuencias iniciales (configurables)

| Fuente | Frecuencia |
| --- | --- |
| Steam News API | cada 2–4 h |
| CMS del sitio oficial | cada 3–6 h (API no documentada: frecuencia baja) |
| YouTube Data API | cada 6–12 h |
| ABI Field Index (JSON) | 1 vez al día (solo si cambia `patch`/`generated`) |
| Parte de Inteligencia | 1 vez al día, después de la sincronización |

## 3. Deduplicación

Orden de preferencia para identificar un elemento:

1. `external_id` de la fuente (ej. `gid` de Steam, `videoId` de YouTube).
2. URL canónica normalizada (sin parámetros de tracking, sin `#`, minúsculas en host).
3. Respaldo: `content_hash` = SHA-256 de (fuente + título normalizado + fecha de publicación).

Restricción única en BD: (`source_id`, `external_id`). Si el contenido cambió
(hash distinto), se actualiza y se cuenta como `updated`, conservando `retrieved_at` original.

## 4. Taxonomía de contenido

Un elemento tiene **una categoría principal** y **varias etiquetas**. El tipo de fuente y la categoría son cosas distintas.

`patch_notes` · `official_news` · `events` · `season_updates` · `bans_notices` ·
`tier_lists` · `weapon_builds` · `ammo_guides` · `armor_guides` · `map_guides` ·
`tactical_guides` · `economy_guides` · `videos` · `community_discussion` · `bug_reports` ·
`tournaments` · `other`

> `bans_notices` se añade porque Steam publica avisos de baneos de forma recurrente
> (observado en la Fase 0) y conviene separarlos del resto de noticias.

Clasificación en dos pasos: **reglas** baratas primero (palabras clave en el título,
feed de origen) y **LLM** solo si las reglas no deciden. Resultado ambiguo → `needs_review`.

## 5. El analista (LLM local)

- **Conexión:** LM Studio, API compatible con OpenAI en `LMSTUDIO_URL` (por defecto `http://localhost:1234/v1`).
- **Temperatura:** 0.2–0.3. **Salida estructurada** (JSON Schema) para clasificación y extracción.
- **Bloques:** máx. ~3.000 tokens de entrada por llamada; resumir por fuente y luego consolidar.
- Si LM Studio no responde: los elementos quedan `processing_status = new` y se procesan después. La sincronización **no** falla por eso.
- Se guarda `model`, `prompt_version` y `processed_at` de cada resultado.

**Hace:** clasificar, extraer entidades (armas, munición, mapas, temporadas), detectar idioma,
resumir brevemente, sospechar si habla del juego móvil u otro juego, señalar datos dudosos, sugerir etiquetas.

**No hace:** crear cifras ausentes, inventar fechas, convertir opinión en hecho oficial,
asignar verificación, presentar una tier list comunitaria como oficial, completar transcripciones inexistentes.

### Prompt base del Parte de Inteligencia (borrador v1)

```text
You are a tactical instructor for Arena Breakout: Infinite (PC only).
Operator profile: {operator_profile_json}
Use ONLY the context below. Never use general knowledge to fill gaps.
Answer in Spanish. Tag every statement with one of:
[HECHO VERIFICADO] [OBSERVACIÓN COMUNITARIA] [ANÁLISIS] [RECOMENDACIÓN] [DATO DESCONOCIDO].
If a number is not in the context, write [DATO DESCONOCIDO]. Do not invent figures.
Sections: (1) patch changes, (2) ammo by cost/penetration, (3) budget builds,
(4) positioning tips, (5) meta warnings.
Context:
{context_blocks}
```

El prompt se escribe en inglés (mejor rendimiento de modelos pequeños) y la salida en español.

## 6. Formato del Parte de Inteligencia

```text
# PARTE DE INTELIGENCIA — [FECHA]
> Generado: [fecha/hora] · App v[x] · Modelo: [modelo] · Periodo: [desde–hasta]

## 1. RESUMEN EJECUTIVO (3 líneas)
## 2. CAMBIOS DE PARCHE
## 3. MUNICIÓN: RECOMENDACIÓN DEL DÍA
## 4. BUILDS ECONÓMICAS (arma del perfil del operador)
## 5. TÁCTICAS DE LA COMUNIDAD
## 6. ALERTAS DEL META
## 7. FUENTES CONSULTADAS
## 8. LIMITACIONES (fuentes caídas, datos desconocidos)
```

Cada afirmación lleva su etiqueta (ver 03 §10).

## 7. Programación automática

- **Opción A (recomendada para Windows):** Programador de tareas → script PowerShell → `POST /api/sync-jobs`.
- **Opción B:** cron interno de la API mientras está encendida.
- Alertas: si un conector falla N veces seguidas (por defecto 3), se muestra en el Centro de mando.
