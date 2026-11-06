# FASE 0 — VERIFICACIÓN

> **Proyecto:** Operación Centinela (Helper-ABI) · **Fecha:** 06/11/2026
> **Ejecutado por:** Claude (VS Code) · **Estado:** pendiente de aprobación del operador
>
> Este documento registra el resultado de la Fase 0 descrita en `ESPECIFICACION.md` §10
> y en `INVESTIGACION_FUENTES_INGESTA_CENTINELA.md` §2 y §10 (I-1). No modifica
> ninguno de los documentos originales.
>
> **Actualización (06/11/2026):** las contradicciones y decisiones de este informe ya
> están resueltas en [`../10-decisions.md`](../10-decisions.md) y el catálogo vigente de
> fuentes está en [`../05-sources.md`](../05-sources.md). Este informe se conserva como registro histórico.

---

## 1. Carpeta raíz

Por instrucción del operador, la raíz del proyecto es la carpeta actual **`Helper ABI`**.
Donde los documentos dicen `helper-abi/`, se entiende `Helper ABI/` (no se crea una
subcarpeta adicional). El nombre del repositorio en GitHub puede seguir siendo `helper-abi`.

---

## 2. Entorno del operador (comprobado)

| Herramienta | Requerido por la spec | Instalado | Estado |
| --- | --- | --- | --- |
| Node.js | 22 | **24.11.1** | ⚠️ Distinto (ver decisión D-1) |
| pnpm | sí | 9.13.2 | ✅ |
| Python | 3.11+ | **3.14.2** (único instalado) | ⚠️ Ver decisión D-2 |
| Git | sí | 2.52.0 | ✅ |
| Docker / Compose | opcional | 29.7.2 / v5.4.0 | ✅ |
| LM Studio (`localhost:1234`) | sí | **No responde** | ⏳ Abrirlo y activar el servidor local antes de la Fase 4 |

---

## 3. Verificación de fuentes

Peticiones realizadas el 06/11/2026 con User-Agent identificable y pausa de 2 s entre
peticiones. Solo lectura pública.

| # | Fuente | Resultado HTTP | robots.txt | Veredicto técnico |
| --- | --- | --- | --- | --- |
| 1 | Steam News API `ISteamNews/GetNewsForApp/v2` (AppID `2073620`) | 200 JSON, 108 noticias, última del 28/10/2026 | API oficial documentada | ✅ **Confirmada.** Conector prioritario |
| 1b | Steam RSS `store.steampowered.com/feeds/news/app/2073620/` | 200 XML | — | ✅ Alternativa válida |
| 1c | AppID `2073620` | `appdetails` → "Arena Breakout: Infinite", tipo `game` | — | ✅ **AppID confirmado** |
| 2 | Wiki Fandom `arena-breakout-infinite.fandom.com/api.php` | 200 JSON (MediaWiki 1.43) | Bloqueado por Cloudflare al leerlo | ⚠️ API funciona, pero poca actividad: 435 páginas, **4 usuarios activos**, últimas ediciones no son de munición. Calidad de datos dudosa |
| 3 | Sitio oficial `arenabreakoutinfinite.com` (`/es/list.html`) | 200 HTML | No existe (404) | ⚠️ Listado de noticias carga dinámico. **Requiere inspección manual** de la pestaña Red del navegador (lo hace el operador) |
| 4 | Reddit `/top.json` público | **403 Forbidden** | `Disallow: /` para todos | ❌ El método de la spec (§5.3, JSON público sin OAuth) **no es viable**. Solo con OAuth + política de retención de 48 h |
| 5 | YouTube RSS | No probado | — | ⏳ Necesita IDs de canal reales elegidos por el operador |
| 6 | SenseOS `senseos.gg` | 200 HTML | Permite `User-agent: *` (excepto `/api/`, `/account/`) | ✅ Técnicamente apta. Falta revisar términos de uso |
| 7 | ABI Builder `abibuilder.com` | 200 HTML | Permite todo excepto `/admin`, `/auth`… Tiene sitemap | ✅ Técnicamente apta. Falta revisar términos |
| 8 | ABI Field Index `arenabreakoutinfinite.wiki` | 200 HTML | `Allow: /` + sitemap | ✅ Técnicamente apta. Candidata fuerte para munición/armaduras. Falta revisar términos |
| 9 | ABI Tracker `abi-tracker.azurewebsites.net` | 200 HTML | No existe (404) | ⚠️ Sin robots.txt; revisar términos antes de automatizar |
| 10 | ABI Database `arenabreakout-infinite.com` | **429** + "Vercel Security Checkpoint" | No legible (bloqueo anti-bot) | ❌ El sitio bloquea clientes automáticos. **Solo consulta manual** |
| 11 | MapGenie `mapgenie.io/arena-breakout-infinite` | **404** | — | ❌ URL incorrecta o inexistente. Consulta manual si se encuentra la correcta |
| 12 | Game8 | No probado | — | ⏳ Prioridad baja según la spec |

> Nota: que un `robots.txt` permita el acceso **no** equivale a revisar los términos de uso.
> La revisión de términos queda pendiente para el operador (protocolo §3.3).

---

## 4. Contradicciones entre documentos

El protocolo complementario (§1) pide señalarlas y no resolverlas en silencio.

| # | Tema | `ESPECIFICACION.md` dice | Otro documento / evidencia dice | Propuesta |
| --- | --- | --- | --- | --- |
| C-1 | Reddit | JSON público sin OAuth (§5.3) | Investigación §2.4: OAuth obligatorio, retención 48 h. Prueba real: 403 | Posponer Reddit (fase I-3) y hacerlo solo con OAuth |
| C-2 | Transcripciones de YouTube | `youtube-transcript-api` como método (§5.4) | Investigación §2.3: no garantizadas, no deben ser requisito | Registrar metadatos del video; transcripción opcional |
| C-3 | Motor de reglas balísticas | "penetración 5 vs casco 4 → no podía pararla" (§12) | Protocolo §7.1: prohíbe reglas universales sin mecánica verificada | Implementar solo mecánicas verificadas; si falta dato, mostrar "desconocido" |
| C-4 | Modelo de datos | 9 tablas simples (§13) | Protocolo §9: evidencia, alias, observaciones, historial, revisión | Presentar propuesta de esquema antes de la Fase 2 (BÚNKER) |
| C-5 | Fuente de munición | Wiki Fandom como prioridad 2 | Investigación no la menciona; Fandom tiene muy poca actividad | Evaluar ABI Field Index como fuente técnica principal (nivel B) |
| C-6 | Nombre del documento | Estructura muestra `docs/SPEC.md` | Existe `docs/ESPECIFICACION.md` y una **copia idéntica** en la raíz | Mantener `docs/ESPECIFICACION.md`; decidir qué hacer con la copia de la raíz |
| C-7 | Versión de Node | Node 22 | Instalado Node 24 | Ver D-1 |

---

## 5. Decisiones que necesito del operador

| Código | Pregunta | Mi recomendación |
| --- | --- | --- |
| D-1 | ¿Node 22 (spec) o Node 24 (instalado)? | **Node 24** (es LTS y ya está instalado). Se documenta con un ADR |
| D-2 | Python 3.14 está instalado; la spec pide 3.11+ | Para recolectores (Fases 4) 3.14 probablemente sirve. Para el módulo forense (EasyOCR/visión) **no tengo certeza** de que todas las librerías tengan soporte para 3.14; podríamos instalar 3.12 en paralelo más adelante |
| D-3 | ¿Qué hacer con la copia `ESPECIFICACION.md` de la raíz? | Dejar solo la de `docs/` para evitar que se desincronicen |
| D-4 | Correo personal para Git (spec §13: no usar el del trabajo) | Necesito que me lo indiques en la Fase 1; no usaré el correo corporativo |
| D-5 | Canales de YouTube (5 a 10) con su ID | Los eliges tú; yo los verifico |
| D-6 | Fuentes aprobadas para automatizar | Steam API ✅ · ABI Field Index, ABI Builder, SenseOS tras revisar sus términos · resto manual |
| D-7 | Decisiones pendientes del protocolo §15 (región de precios, idioma, temporada base, retención…) | No bloquean la Fase 1; sí bloquean la carga de datos reales (Fase 5) |

---

## 6. Checklist de la Fase 0 (spec §10)

- [x] Abrir cada URL de la tabla y confirmar que existe y está activa
- [x] Confirmar el AppID de Steam (`2073620`) y probar el RSS
- [x] Probar `api.php?action=query&meta=siteinfo&format=json` en la wiki Fandom
- [~] Leer robots.txt ✅ — **términos de uso: pendiente (operador)**
- [ ] Elegir 5 a 10 canales de YouTube reales y anotar su ID (operador)
- [ ] Inspeccionar en el navegador la pestaña Red de `arenabreakoutinfinite.com/es/list.html` (operador)
- [ ] Guardar las URLs confirmadas en la configuración del proyecto → se hará en la Fase 1/2 (tabla `sources` + seeder)

---

## 7. Próximo paso propuesto

**Fase 1 — CIMIENTOS:** monorepo con pnpm, `.gitignore`, `.editorconfig`, `.env.example`,
estructura de carpetas, `README.md`, ADR inicial y `git init` con tu identidad personal.
No se escribe lógica de negocio ni se cargan datos en esta fase.
