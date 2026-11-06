# 05 · Fuentes de información

Catálogo vigente de fuentes, verificado el **06/11/2026** con peticiones reales
(User-Agent `HelperABI-Centinela/0.1 (personal use)`, ≥ 2 s entre peticiones).
No existe una API pública oficial del juego: todo sale de fuentes web públicas.

> Contexto observado (fuente comunitaria, **no verificado**): temporada actual **S7 "Utopia"**,
> desde el 15/09/2026; versión de datos del juego observada `1.0.0.151.x`.

## 1. Resumen: qué se automatiza

| Prioridad | Fuente | Nivel | Método | Veredicto |
| --- | --- | --- | --- | --- |
| 1 | Steam News API | A | API oficial documentada | ✅ **Automatizar** |
| 2 | CMS del sitio oficial | A | API JSON pública (no documentada) | ⚠️ **Automatizar con cautela** (requiere aprobación P-04) |
| 3 | ABI Field Index | B | JSON estático permitido | ✅ **Automatizar** (con aviso de desactualización) |
| 4 | YouTube Data API v3 | A/D | API oficial con API key | ✅ **Automatizar** (necesita API key gratuita) |
| 5 | Discord oficial (Follow → servidor propio) | A | Bot oficial en servidor propio | ⏳ Semiautomático, opcional |
| — | SenseOS, ABI Builder, Fandom, ABI Tracker, Reddit | B/D/E | Lectura humana | 📖 **Manual** |
| — | MapGenie, Google News RSS, RSS de YouTube, transcripciones, arenabreakout-infinite.com | — | — | ❌ **Descartadas** |

## 2. Fuentes automatizables

### 2.1 Steam News API — ✅ prioridad 1

| Dato | Valor |
| --- | --- |
| Endpoint | `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/` |
| Parámetros | `appid=2073620` · `count` · `maxlength` · `enddate` · `feeds=steam_community_announcements` |
| AppID | `2073620` ✅ confirmado ("Arena Breakout: Infinite", tipo `game`) |
| Documentación | `https://partner.steamgames.com/doc/webapi/ISteamNews` |
| Prueba | 200 JSON · 108 ítems (104 con el filtro de anuncios) |
| ID externo | `gid` |
| Notas | `feeds=steam_community_announcements` filtra la prensa externa. Algunos ítems traen `tags: ["hide_store"]` (avisos de baneos → categoría `bans_notices`). `tags=patchnotes` devuelve 0: las notas de parche se detectan por título/contenido |
| Alternativa | RSS `https://store.steampowered.com/feeds/news/app/2073620/` (200) |
| Limitación | No trae todas las publicaciones oficiales → por eso existe la fuente 2.2 |

### 2.2 CMS del sitio oficial — ⚠️ prioridad 2

El listado `arenabreakoutinfinite.com/es/list.html` se carga con el SDK público
`cmsutils-lite` del propio sitio, que llama a esta API:

| Dato | Valor |
| --- | --- |
| Lista | `POST https://sg-community.playerinfinite.com/api/gpts.information_feeds_svr.InformationFeedsSvr/GetContentByLabel` |
| Detalle | `POST .../InformationFeedsSvr/GetContentInfoById` con `{"content_id":"<id>"}` |
| Cabeceras (las mismas que envía el sitio) | `Content-Type: application/json;charset=utf-8` · `X-Language: es-US` (o `en`) · `X-GameId: 30048` · `X-AreaId: global` · `X-Source: pc_web` |
| Body de la lista | `{"language":["es-US"],"gameid":"30048","offset":0,"get_num":6,"ext_info_type_list":[0,1,2],"primary_label_id":893,"secondary_label_id":0,"sort_by_list":[{"key":"start_timestamp","asc":0}]}` |
| Etiquetas | `893` noticias · `1013` eventos · `934` creadores |
| Prueba | 200 · `code: 0` · 247 ítems en `es-US`, 380 en `en`. Última: "Aviso de suspensiones… 3 de Nov" (03/11/2026) |
| Campos | `content_id`, `title`, `content_desc`, `content_part`, `pub_timestamp` (epoch s, string), `pic_urls`, `primary_label_ids`, `secondary_label_ids`, `father_content_id` (agrupa traducciones), `view_num` · detalle: `content` (HTML) |
| URL canónica | `https://www.arenabreakoutinfinite.com/es/news.html?content_id=<id>` |
| ID externo | `content_id` (deduplicar traducciones por `father_content_id`) |
| robots.txt | No existe en ninguno de los dos dominios |
| Valor | Trae comunicados que **no** están en Steam (ej. actualización del 27/10, aviso del 03/11) |

**Riesgos y reglas de uso:**
- Endpoint **no documentado**: puede cambiar sin aviso → validación estricta del esquema y
  *circuit breaker* (si la respuesta no cumple el esquema, la fuente pasa a `restricted` y no se reintenta).
- El EULA de Level Infinite prohíbe "bots… automation programs that interact with the
  Services". Va dirigido al juego, pero el texto es amplio. Por eso: **frecuencia baja
  (cada 3–6 h)**, solo leer noticias públicas, guardar título/fecha/extracto/enlace y
  **no** republicar el contenido completo. **Requiere aprobación explícita del operador (P-04).**

### 2.3 ABI Field Index — ✅ prioridad 3 (datos técnicos)

| Dato | Valor |
| --- | --- |
| Sitio | `https://arenabreakoutinfinite.wiki/` (fan site no oficial; dice extraer de las *data templates* del juego) |
| Datos | `/data/ammo.json` · `/data/armor.json` · también `/data/keys.json`, `/maps.json`, `/weapons.json` |
| Prueba | 200 JSON · `ammo.json`: `patch 1.0.0.142.19`, `generated 2026-10-21`, 71 municiones (5 de 7.62x51) |
| Campos munición | `id`, `slug`, `name`, `caliber`, `pierce`, `penetration`, `damage`, `armorDamage`, `velocity`, `accuracy`, `vRecoil`, `hRecoil`, `wound`, `defeats[]`, `grade` |
| Campos armadura | `slug`, `name`, `kind`, `class`, `durability`, `effective`, `material`, `materialModifier`, `areas[]`, `weight`, `speedPenalty`, `ergoPenalty`, `ricochet`, `sound` |
| robots.txt | `Allow: /` y comenta: *"Data payloads are the product; crawlers may fetch them"* |
| Términos | No tiene página de términos (solo `/privacy`) |
| Frecuencia | 1 vez al día; solo procesar si cambian `patch` o `generated` |

**Riesgos:** su `patch` (`142.19`) parece **anterior** a la versión observada en otra fuente (`151.17`).
Cobertura de mapas incompleta. → Todo entra como `pending`, nivel B, y la UI muestra
**"posible desactualización"** mientras el parche no coincida con la temporada vigente.
Valores coinciden con ABI Builder en una muestra (ej. .338 AP: pen 64, daño 90, daño a armadura 55),
pero **una fuente que copia a otra no cuenta como corroboración independiente**.

### 2.4 YouTube Data API v3 — ✅ prioridad 4

| Dato | Valor |
| --- | --- |
| Canal oficial | `@ArenaBreakoutInfinite` · ID **`UC4p7wn-3DHpKk_9hxftr0ag`** ✅ (enlazado desde el sitio oficial) |
| Playlist de subidas | `UU4p7wn-3DHpKk_9hxftr0ag` |
| Método | `playlistItems.list?playlistId=<uploads>&part=snippet` (1 unidad de cuota por llamada; 10.000/día) |
| Requiere | `YOUTUBE_API_KEY` en `.env` (gratuita, Google Cloud Console) |
| ID externo | `videoId` |
| Guardar | título, descripción, fecha, canal, URL, miniatura. **Sin transcripción** |
| Canales comunitarios | Los elige el operador (P-05); se obtiene su playlist de subidas igual |

❌ **No usar el RSS** `youtube.com/feeds/videos.xml`: el `robots.txt` de YouTube tiene `Disallow: /feeds/videos.xml` (verificado).
❌ **No usar transcripciones automáticas**: la API oficial (`captions.download`) exige permiso de edición del video, y librerías como `youtube-transcript-api` usan endpoints internos bloqueados por robots/ToS.

### 2.5 Discord oficial — ⏳ opcional, semiautomático

- Servidor oficial verificado (`OFFICIAL_GAME_GUILD`, ~744 mil miembros, invitación `arenabreakoutinfinite`).
- Método legítimo: en Discord, usar **"Seguir"** en el canal de anuncios hacia **un servidor
  propio** del operador; un bot propio (API oficial de Discord) lee ese canal.
- ⏳ No verificado qué canales permiten "Seguir". Configuración manual una sola vez.
- ❌ Prohibido: self-bots (automatizar una cuenta de usuario) o leer el servidor oficial directamente.

## 3. Fuentes de consulta manual

Útiles para el operador y para el flujo de investigación (03 §9), **sin** conector automático.

| Fuente | URL | Por qué manual | Uso |
| --- | --- | --- | --- |
| SenseOS | `senseos.gg/guides/arena-breakout-infinite/...` · `/wiki/arena-breakout-infinite/patch-notes/` | Sus ToS (05/11/2026) **prohíben scraping y acceso automatizado** | Guía de mecánicas de S7 (ej. munición y penetración, actualizada 01/11/2026). Nivel D |
| ABI Builder | `abibuilder.com/wiki/ammo`, `/wiki/body-armor`, `/wiki/helmets` | Datos dentro del payload de Next.js (frágil); datos anteriores a S7 | Contraste de cifras. Nivel B |
| Wiki Fandom | `arena-breakout-infinite.fandom.com` | API funciona, pero 4 usuarios activos y Cloudflare en robots | Referencia secundaria. Nivel B/E |
| ABI Tracker | `abi-tracker.azurewebsites.net/GameInfo/Bullet` | Datos cifrados/ofuscados: descifrarlos sería eludir una protección | Ver versión de datos (`151.17`). Evitar `/Player` y `/Market` |
| Reddit | `reddit.com/r/ArenaBreakoutInfinite` | `robots.txt` `Disallow: /`, JSON 403. Según prensa (no verificado en fuente oficial) Reddit cerró nuevas solicitudes de API el 31/10/2026 | Lectura humana; guardar enlaces a mano |
| Press kit | `press.levelinfinite.com` | `Crawl-Delay: 5`; contenido no revisado | Imágenes/material oficial |
| maps.tcno.co | `maps.tcno.co` | Cobertura y términos no revisados | Mapas (alternativa a MapGenie) |

## 4. Fuentes descartadas

| Fuente | Motivo (verificado) |
| --- | --- |
| arenabreakout-infinite.com | 429 + "Vercel Security Checkpoint" (anti-bot). No se elude |
| MapGenie | Arena Breakout: Infinite **no existe** en MapGenie (404); su robots prohíbe scraping sin permiso escrito |
| Google News RSS | `news.google.com/robots.txt`: `Disallow: /` |
| RSS de YouTube | `Disallow: /feeds/videos.xml` |
| Transcripciones de YouTube | Ver 2.4 |
| Reddit API / JSON / RSS | Ver §3 |
| Level Infinite (sitio corporativo) | RSS funciona, pero la última nota de ABI es de 2024 |
| X / Twitter | API de pago; no probado |
| Wiki Miraheze | Reportada inactiva |
| Cuenta/SDK de Level Infinite, overlays, lectores de memoria | **Prohibido** (EULA y anticheat) |

## 5. Reglas comunes para cualquier conector

1. `robots.txt` y términos revisados **antes** de activar la fuente (`terms_reviewed = true`).
2. User-Agent identificable (`HTTP_USER_AGENT`), ≥ 2 s entre peticiones por dominio, respetar `Retry-After`.
3. Desafío anti-bot (Cloudflare/Vercel/CAPTCHA) → detenerse, marcar `restricted`, avisar. Nunca eludir.
4. Validar el esquema de cada respuesta; si cambia → *circuit breaker*.
5. Guardar metadatos, extractos breves y enlaces; no republicar contenido completo de terceros.
6. Todo dato técnico entra como `pending`; lo aprueba el operador.
7. Una fuente nueva se añade aquí primero (con su verificación) y luego en el seeder de `sources`.

## 6. Pendiente de verificar

- Texto oficial de la política de API de Reddit y sus fechas (solo prensa secundaria).
- Qué canales de Discord permiten "Seguir".
- Si el parche `1.0.0.142.19` de Field Index corresponde a S7.
- Afirmación de ABI Builder de colaborar con el desarrollador.
- Cobertura de ABI en `maps.tcno.co`.

> Detalle de la investigación: los resultados crudos de las pruebas no se guardan en el
> repositorio; esta tabla es el registro oficial.
