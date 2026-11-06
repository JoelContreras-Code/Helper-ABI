# OPERACIÓN CENTINELA

### Sistema de Inteligencia Táctica para Arena Breakout Infinite

> **CLASIFICACIÓN:** Uso personal · **OPERADOR:** Joel Contreras · **VERSIÓN:** 1.0 · **FECHA:** 06/11/2026

---

## 1. BRIEFING DE MISIÓN

**Situación:** El operador pierde economía (de 20M a 2M) por falta de información actualizada sobre munición, builds, cambios de parche y tácticas.

**Misión:** Construir desde cero una aplicación que recolecte, procese y resuma automáticamente inteligencia del juego desde múltiples fuentes, usando un modelo de IA **local** (sin costo de tokens).

**Resultado esperado:** Un informe diario ("Parte de Inteligencia") con cambios de meta, munición recomendada, builds económicas y tips tácticos, enfocado en rifle tirador (M110) y economía limitada.

**Restricción crítica:** La aplicación **NUNCA** interactúa con el cliente del juego, su memoria ni sus archivos. Solo consume fuentes públicas en internet. Esto evita cualquier conflicto con el anticheat.

---

## 2. OBJETIVOS

| Código | Objetivo | Prioridad |
| --- | --- | --- |
| OBJ-01 | Recolectar notas de parche oficiales | Alta |
| OBJ-02 | Extraer tablas de munición y armadura de la wiki | Alta |
| OBJ-03 | Recolectar posts top semanales de Reddit | Media |
| OBJ-04 | Extraer transcripciones de canales de YouTube seleccionados | Media |
| OBJ-05 | Resumir todo con un LLM local (LM Studio) | Alta |
| OBJ-06 | Generar un informe diario en Markdown | Alta |
| OBJ-07 | Guardar el histórico en una base de datos local | Media |
| OBJ-08 | Detectar cambios entre informes (qué subió y qué bajó en el meta) | Baja |

---

## 3. ENTORNO DEL OPERADOR

| Componente | Especificación |
| --- | --- |
| GPU | AMD Radeon RX 6600 (8 GB VRAM) |
| RAM | 32 GB |
| Sistema | Windows |
| Editor | Visual Studio Code + Claude |
| Motor de IA | LM Studio (backend Vulkan, compatible con AMD) |
| Modelo recomendado | Qwen2.5 7B Instruct (cuantizado Q4_K_M, ~5 GB) |
| Lenguaje | Python 3.11+ (workers) · TypeScript (API y web) |

---

## 4. ARQUITECTURA GENERAL (conceptual)

```
┌──────────────────────────────────────────────────────────┐
│                   CENTRO DE MANDO                        │
└───────────────┬──────────────────────────────────────────┘
                │
   ┌────────────┼─────────────┬──────────────┐
   ▼            ▼             ▼              ▼
┌────────┐  ┌────────┐   ┌────────┐    ┌──────────┐
│PARCHES │  │  WIKI  │   │ REDDIT │    │ YOUTUBE  │   ← UNIDADES DE RECONOCIMIENTO
└───┬────┘  └───┬────┘   └───┬────┘    └────┬─────┘
    └───────────┴─────┬──────┴──────────────┘
                      ▼
            ┌───────────────────┐
            │  ALMACÉN (BD)     │   ← INTELIGENCIA EN BRUTO
            └─────────┬─────────┘
                      ▼
            ┌───────────────────┐
            │ ANALISTA (LLM     │   ← LM Studio en localhost:1234
            │  local)           │
            └─────────┬─────────┘
                      ▼
            ┌───────────────────┐
            │ PARTE DE INTELIG. │   ← informes diarios
            └───────────────────┘
```

**Flujo:** Reconocimiento → Almacenamiento → Análisis → Informe.

> La estructura de carpetas definitiva está en la sección **13-E**.

---

## 5. UNIDADES DE RECONOCIMIENTO (MÓDULOS)

Todas heredan de una clase base de recolector con un método que devuelve una lista de elementos de inteligencia.

### 5.1 Unidad PARCHES
- **Fuente:** noticias de Steam (RSS) y página oficial (ver 13-B).
- **Método:** `feedparser` / `requests` + `BeautifulSoup`.
- **Extrae:** título, fecha, cuerpo de cada nota de parche.
- **Filtro:** solo publicaciones que no estén ya en la base de datos.

### 5.2 Unidad WIKI
- **Fuente:** wiki comunitaria (Fandom, API MediaWiki; confirmar en Fase 0).
- **Método:** API `action=query` o scraping de tablas con `pandas.read_html`.
- **Extrae:** tablas de munición (calibre, daño, penetración, nivel), armaduras y cascos (nivel, durabilidad, zonas protegidas).
- **Valor táctico:** responder "¿qué munición barata atraviesa un casco nivel 5?".

### 5.3 Unidad REDDIT
- **Fuente:** `r/ArenaBreakoutInfinite`.
- **Método:** endpoint JSON público (`/top.json?t=week`) con User-Agent propio. Opcional: PRAW con credenciales en `.env`.
- **Extrae:** título, texto, puntaje, número de comentarios, top 5 comentarios.
- **Filtro:** puntaje mínimo configurable (ej. 50).

### 5.4 Unidad YOUTUBE
- **Fuente:** feeds RSS de canales elegidos por el operador.
- **Método:** `feedparser` + `youtube-transcript-api`.
- **Extrae:** título, fecha, transcripción (es/en).
- **Filtro:** solo videos de los últimos 7 días.

---

## 6. EL ANALISTA (LLM LOCAL)

- **Conexión:** API compatible con OpenAI en `http://localhost:1234/v1/chat/completions`.
- **Temperatura:** 0.3 (respuestas precisas, poca invención).
- **Estrategia:** resumir por fuente en bloques pequeños (máx. ~3.000 tokens por llamada) y después consolidar.
- **Prompt base (borrador):**

> Eres un instructor táctico experto en Arena Breakout Infinite. Tu operador usa rifle tirador M110, munición nivel 4, equipo nivel 4 y tiene economía limitada. Analiza la información y responde en español con: (1) cambios relevantes de parche, (2) munición recomendada por relación costo/penetración, (3) builds económicas, (4) tips tácticos de posicionamiento, (5) advertencias del meta actual. Si un dato no aparece en la información, dilo: no inventes cifras.

---

## 7. FORMATO DEL PARTE DE INTELIGENCIA

```
# PARTE DE INTELIGENCIA — [FECHA]
## 1. RESUMEN EJECUTIVO (3 líneas)
## 2. CAMBIOS DE PARCHE
## 3. MUNICIÓN: RECOMENDACIÓN DEL DÍA
## 4. BUILDS ECONÓMICAS (M110)
## 5. TÁCTICAS DE LA COMUNIDAD
## 6. ALERTAS DEL META
## 7. FUENTES CONSULTADAS
```

---

## 8. MEJORAS SUGERIDAS (FUTURO)

1. **Calculadora de duelo:** introduces tu munición y el casco o chaleco del enemigo, y te dice si lo atraviesas y cuántos tiros necesitas aproximadamente.
2. **Bot de Discord o Telegram:** te envía el parte de inteligencia al celular cada mañana.
3. **Rastreador de economía:** registras cada raid (equipo llevado, botín, si sobreviviste) y calcula tu ganancia o pérdida neta y tu tasa de supervivencia por mapa.
4. **Diario de muertes:** anotas cómo moriste (grupo, headshot, emboscada al lootear) y el analista detecta patrones.
5. **Comparador de meta:** compara el informe de hoy con el de la semana pasada y marca qué armas y munición están subiendo.
6. **Análisis de grabaciones:** revisar clips de OBS **después** de la partida con un modelo de visión local. Nunca en tiempo real.

---

## 9. REGLAS DE ENFRENTAMIENTO (NORMAS DEL PROYECTO)

- Nunca leer memoria, archivos ni tráfico del juego.
- Respetar las fuentes: pausas entre peticiones (mín. 2 segundos), User-Agent identificable, solo uso personal.
- Secretos (credenciales de Reddit, tokens, etc.) solo en `.env`, nunca en el código.
- Cada módulo con manejo de errores: si una fuente falla, las demás continúan.
- Logs con fecha y hora.
- Código, nombres de archivos, variables y funciones en inglés; comentarios en inglés.
- Commits con formato Conventional Commits.

---

## 10. INFORME DE RECONOCIMIENTO DE FUENTES

No existe una API pública oficial de Arena Breakout Infinite: todo se obtiene de fuentes web públicas. Datos tomados de un informe externo (Gemini, 06/11/2026). **Ninguna URL está verificada aún.** La Fase 0 las confirma antes de programar.

### Fuentes priorizadas

| Prioridad | Fuente | URL (por verificar) | Método | Riesgo | Notas |
| --- | --- | --- | --- | --- | --- |
| 1 | Noticias de Steam | store.steampowered.com/news/app/2073620 | RSS o Steam Web API `ISteamNews/GetNewsForApp` | Bajo | Mejor vía para parches. Confirmar el AppID |
| 2 | Wiki Fandom | arena-breakout-infinite.fandom.com/api.php | API MediaWiki (JSON) | Bajo | Munición, armas, armaduras |
| 3 | Base de datos comunitaria | arenabreakout-infinite.com | Scraping con pausas | Bajo | Ítems y munición. Revisar robots.txt y términos |
| 4 | Reddit | reddit.com/r/ArenaBreakoutInfinite | JSON público o PRAW | Bajo | Ya incluido en 5.3 |
| 5 | YouTube | Canales elegidos por el operador | RSS (gratis) o YouTube Data API v3 (clave gratis con cuota) | Bajo | Mantener RSS por defecto |
| 6 | Sitio oficial | arenabreakoutinfinite.com | Scraping HTML | Bajo | Sin RSS; respaldo de Steam |
| 7 | MapGenie | mapgenie.io/arena-breakout-infinite | Consulta manual | Medio | Revisar términos antes de automatizar |
| 8 | Game8 | game8.co | Scraping HTML | Medio | Revisar términos antes de automatizar |

### Descartadas o con restricciones

- **Cuenta y SDK de Level Infinite:** prohibido. Usar tokens de sesión viola el EULA.
- **Overlays, Overwolf, lectores de memoria, Cheat Engine:** prohibido. Riesgo de baneo con el anticheat ACE.
- **X / Twitter:** la API es de pago; no recomendado.
- **Discord oficial:** un bot solo lee servidores donde lo agregó un administrador. Alternativa: seguir el canal de anuncios con la función Follow hacia un servidor propio y leerlo desde ahí.
- **Wiki de Miraheze:** reportada como inactiva.

### Alertas de calidad del informe externo

- **Creadores:** varios nombres parecen ser de Escape from Tarkov (por ejemplo, Pestily y Lvndmark) o no se pudieron confirmar. Los canales los elige el operador y se verifican a mano.
- **Tabla balística 7.62x51:** las asignaciones de nivel (M80, M61, M62) son dudosas. No usar esos valores; la tabla de munición se llena solo con datos extraídos de la wiki.
- **Afirmaciones sobre duración de baneos y detalles del ACE:** no verificadas; solo como contexto.

### Fase 0: VERIFICACIÓN (antes de la Fase 1)

- [ ] Abrir cada URL de la tabla y confirmar que existe y está activa
- [ ] Confirmar el AppID de Steam y probar el RSS
- [ ] Probar `api.php?action=query&meta=siteinfo&format=json` en la wiki Fandom
- [ ] Leer robots.txt y términos de uso de cada sitio para scraping
- [ ] Elegir 5 a 10 canales de YouTube reales y anotar su ID de canal
- [ ] Guardar las URLs confirmadas en la configuración del proyecto

---

## 11. PROMPTS DE RECONOCIMIENTO PARA IAs CON WEB

Estos prompts sirven para cualquier IA con búsqueda web (Claude con búsqueda, Gemini, Perplexity, ChatGPT). Todos empiezan con la misma **regla de identificación** para no mezclar los dos juegos.

| Juego | Plataforma | Uso en Centinela |
| --- | --- | --- |
| **Arena Breakout Infinite** | PC | ✅ El único que nos interesa |
| Arena Breakout | Móvil (iOS/Android) | ❌ Descartar: estadísticas y munición distintas |

**Regla de identificación (pegar al inicio de cada prompt):**

```
REGLA CRÍTICA: Investiga SOLO "Arena Breakout: Infinite" (versión de PC, MoreFun Studios / Level Infinite). NO uses datos de "Arena Breakout" (versión móvil): sus armas, munición, precios y mecánicas son distintos. Por cada dato, indica la fuente y confirma que es de la versión de PC. Si una fuente no aclara la versión, márcala como "VERSIÓN DUDOSA". Prioriza información de los últimos 3 meses e indica la fecha y el parche o temporada de cada dato. No inventes URLs, cifras ni nombres.
```

### Prompt R-1: Munición y balística

```
[REGLA CRÍTICA]
Compila la tabla completa de munición actual de Arena Breakout: Infinite. Por cada bala: calibre, nombre, nivel de penetración, daño a la carne, daño a la armadura, velocidad, precio aproximado en el mercado y en qué tienda o nivel de comerciante se compra. Destaca el calibre 7.62x51 (M110). Entrega una tabla Markdown por calibre y cita la fuente de cada fila.
```

### Prompt R-2: Armaduras, cascos y zonas de impacto

```
[REGLA CRÍTICA]
Compila todos los chalecos, chalecos tácticos con placas y cascos de Arena Breakout: Infinite: nivel de protección, durabilidad, zonas que cubren (cabeza, cara, oídos, cuello, tórax, abdomen), penalizaciones de movimiento y ergonomía, y precio. Explica cómo funcionan la penetración, el daño por contundencia y la pérdida de durabilidad. Tabla Markdown con fuentes.
```

### Prompt R-3: Médicos, estimulantes y jeringas

```
[REGLA CRÍTICA]
Compila todos los objetos médicos de Arena Breakout: Infinite: botiquines, vendas, torniquetes, férulas, analgésicos, cirugía y jeringas o estimulantes. Por cada uno: efecto exacto, duración, efectos secundarios, tiempo de uso, precio y cuándo conviene usarlo en un combate. Recomienda un kit médico mínimo para un jugador con poca economía y otro kit de alto nivel.
```

### Prompt R-4: Armas y builds

```
[REGLA CRÍTICA]
Compila las armas de Arena Breakout: Infinite con su calibre, cadencia, retroceso y alcance efectivo. Luego da las builds recomendadas del meta actual para: (1) M110 y otros rifles de tirador, (2) rifles de asalto baratos, (3) opciones económicas por debajo de 300.000 de dinero del juego. Cita a creadores o guías reales y su fecha.
```

### Prompt R-5: Mapas, posiciones y rutas

```
[REGLA CRÍTICA]
Por cada mapa actual de Arena Breakout: Infinite (incluye modos y niveles de dificultad), describe: zonas calientes, posiciones de francotirador recomendadas, rutas seguras de entrada y salida, extracciones y sus condiciones, y errores comunes que hacen morir a los jugadores. Cita guías y videos reales.
```

### Prompt R-6: Interfaz y pantalla de muerte

```
[REGLA CRÍTICA]
Describe con detalle qué información muestra Arena Breakout: Infinite en la pantalla de muerte o resumen de raid (arma y munición del asesino, partes del cuerpo dañadas, distancia, equipo del rival, etc.) y en el HUD durante la partida. Busca capturas de pantalla reales y enlázalas. Esto sirve para diseñar un analizador de capturas.
```

### Prompt R-7: Economía y mercado

```
[REGLA CRÍTICA]
Explica la economía actual de Arena Breakout: Infinite: seguro de equipo, comerciantes, mercado de jugadores, impuestos, objetos de mayor valor por espacio, y estrategias reales para recuperar dinero desde 2 millones. Indica qué objetos conviene vender y cuáles guardar.
```

### Prompt R-8: Verificador cruzado

```
[REGLA CRÍTICA]
Te paso un informe generado por otra IA sobre Arena Breakout: Infinite. Verifica cada URL, cada cifra y cada nombre de creador. Marca cada dato como CONFIRMADO, INCORRECTO (con la corrección y su fuente) o NO VERIFICABLE. Señala cualquier dato que venga de la versión móvil o de Escape from Tarkov.
[PEGAR INFORME AQUÍ]
```

**Flujo recomendado:** ejecutar R-1 a R-7, pasar cada resultado por R-8 en una IA distinta y guardar solo lo confirmado en `data/knowledge/`.

---

## 12. MÓDULO FORENSE: ANÁLISIS DE MUERTES POR IMAGEN

El operador sube una captura de su muerte y Centinela responde qué lo mató, por qué su equipo no aguantó y qué debió llevar. **No se entrena ningún modelo**: un modelo de visión local lee la imagen y la base de conocimiento aporta los datos exactos.

### Flujo del análisis

```
Captura (PNG/JPG)
      │
      ▼
[1] LECTOR VISUAL ── Qwen2.5-VL 7B en LM Studio + OCR (EasyOCR)
      │   extrae: arma rival, munición, zonas dañadas, distancia,
      │   tu equipo, tu vida, médicos en tu inventario
      ▼
[2] VALIDADOR ── busca cada nombre en la base de datos (coincidencia aproximada)
      │   ej. "T03" → arma confirmada, calibre, munición compatible
      ▼
[3] MOTOR DE REGLAS ── compara munición rival vs tu armadura y casco
      │   ej. penetración 5 vs casco 4 → "tu casco no podía pararla"
      ▼
[4] ASESOR (LLM) ── redacta el informe con los datos validados
      ▼
INFORME FORENSE (Markdown)
```

### Qué detecta y qué aconseja

| Elemento | Ejemplo de detección | Ejemplo de consejo |
| --- | --- | --- |
| Arma del rival | T03 | Calibre y alcance efectivo del arma |
| Munición del rival | Nivel de penetración leído de la base | "Atraviesa con facilidad tu chaleco nivel 4" |
| Zonas dañadas | Cabeza, tórax | "Murió por la cabeza: tu casco era el punto débil" |
| Tu equipo | Casco y chaleco nivel 4 | Mejora mínima recomendada por costo |
| Médicos y estimulantes | Lo que llevabas y lo que no | "Faltó un estimulante o un analgésico para esta pelea" |
| Contexto | Distancia, cantidad de rivales | Error táctico probable (pelea contra grupo, sin cobertura) |

### Ejemplo de informe forense

```
INFORME FORENSE #014 — 2026-11-06
CAUSA: Disparo a la cabeza a ~80 m
ARMA RIVAL: T03 · MUNICIÓN: [nivel según la base de datos]
TU PROTECCIÓN: Casco nivel 4 → INSUFICIENTE contra esa munición
MÉDICOS: Sin estimulantes · Sin analgésico
VEREDICTO: Pérdida de equipo, no de puntería.
ACCIONES:
  1. Contra rivales con munición alta, evita duelos de cabeza expuesta.
  2. Agrega a tu kit: [estimulante recomendado por la base].
  3. Prioriza munición nivel 5 para tu M110.
```

### Base de conocimiento que necesita

Se llena con los prompts R-1 a R-3 y la wiki, en archivos dentro de `data/knowledge/`.

| Archivo | Contenido |
| --- | --- |
| `weapons.json` | Nombre, alias, calibre, cadencia, alcance |
| `ammo.json` | Nombre, calibre, penetración, daño, precio |
| `armor.json` | Nombre, tipo, nivel, durabilidad, zonas, precio |
| `medical.json` | Nombre, efecto, duración, precio, uso táctico |

### Fases del módulo forense

| Fase | Nombre en clave | Entregable |
| --- | --- | --- |
| F-1 | **OJO** | Leer una captura y devolver texto en JSON |
| F-2 | **ARCHIVO** | Base de conocimiento poblada y validada |
| F-3 | **JUICIO** | Motor de reglas penetración vs armadura |
| F-4 | **VEREDICTO** | Informe forense completo desde una captura |
| F-5 | **PATRONES** | Resumen semanal: "el 60% de tus muertes son por la cabeza" |
| F-6 | **CINE** (futuro) | Clips de OBS: extraer fotogramas cada 2 s y analizar los últimos 15 s antes de la muerte |

**Regla:** el análisis siempre es **después** de la partida, con capturas o grabaciones guardadas. Nunca sobre el juego en ejecución.

---

## 13. ARQUITECTURA DEFINITIVA: HELPER-ABI

El proyecto nace en la carpeta raíz `helper-abi/`: la IA crea ahí todos los archivos, carpetas, configuraciones, entornos y ejemplos.

### Stack tecnológico

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Frontend | **React 19 + Vite + TypeScript (strict)** | Arranque y recarga instantáneos |
| Estilos | **Tailwind CSS v4** | Diseño rápido, tema oscuro militar |
| Animaciones | **Motion (Framer Motion)** | Transiciones ligeras y fluidas |
| Datos en el frontend | **TanStack Query** | Caché y peticiones eficientes |
| Gráficas | **Recharts** | Estadísticas de muertes y economía |
| Backend / API | **Node.js 22 + Express + TypeScript (strict)** | API REST simple y rápida |
| ORM | **Sequelize + sequelize-cli** | Modelos, migraciones y seeders portables |
| Base de datos | **SQLite** en desarrollo · **PostgreSQL** opcional en producción | Se cambia solo con el `.env` |
| Validación | **Zod** | Entradas validadas en la API |
| Workers de inteligencia | **Python 3.11** | Scraping, OCR y visión |
| IA local | **LM Studio** (Qwen2.5 7B / Qwen2.5-VL 7B) | Sin costo de tokens |
| Monorepo | **pnpm workspaces** | Un solo repositorio, dependencias rápidas |
| Calidad | ESLint + Prettier + Vitest + pytest | Código limpio y probado |
| Contenedores (opcional) | Docker Compose con imágenes alpine/slim y versiones fijas | Entorno reproducible |

### Diagrama de arquitectura

```
┌──────────────────────────────────────────────┐
│  apps/web  · React + Tailwind + Motion       │  ← Panel de mando
└───────────────────────┬──────────────────────┘
                        │ HTTP/JSON (TanStack Query)
┌───────────────────────▼──────────────────────┐
│  apps/api  · Express + Sequelize             │  ← ÚNICO dueño de la BD
└───────┬───────────────────────────▲──────────┘
        │ ORM                       │ POST /api/ingest (token interno)
┌───────▼────────┐      ┌───────────┴──────────────────────┐
│ SQLite / PG    │      │ services/ (Python)               │
│ migraciones    │      │  recon/    → parches, wiki, reddit│
│ seeders        │      │  forensic/ → capturas de muerte  │
└────────────────┘      └───────────┬──────────────────────┘
                                    │ HTTP local
                        ┌───────────▼──────────┐
                        │ LM Studio :1234      │
                        └──────────────────────┘
```

**Regla de oro:** solo la API toca la base de datos. Los workers de Python **no** escriben SQL: envían JSON a la API, que valida con Zod y guarda con Sequelize. Así no hay consultas armadas a mano ni riesgo de inyección SQL.

### Estructura de carpetas

```
helper-abi/
├── README.md
├── .gitignore
├── .editorconfig
├── .env.example                 # Public template of variables
├── package.json                 # Root monorepo scripts
├── pnpm-workspace.yaml
├── docker-compose.yml           # Optional local environment
├── docs/
│   ├── SPEC.md                  # This document
│   ├── ARCHITECTURE.md
│   └── adr/                     # Architecture decision records
├── apps/
│   ├── web/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── app/             # Routes and layout
│   │       ├── pages/           # Intel, Arsenal, Forensic, Economy
│   │       ├── components/      # Reusable UI
│   │       ├── features/        # Per-module logic
│   │       ├── hooks/
│   │       ├── lib/             # API client, utils
│   │       └── styles/          # Military Tailwind theme
│   └── api/
│       ├── .sequelizerc
│       └── src/
│           ├── server.ts
│           ├── config/          # database config per environment
│           ├── models/
│           ├── migrations/      # Versioned schema
│           ├── seeders/
│           │   ├── dev/         # Dummy data (testing only)
│           │   └── base/        # Verified real data
│           ├── routes/
│           ├── controllers/
│           ├── services/
│           ├── validators/      # Zod schemas
│           └── middlewares/     # Errors, internal auth, rate limit
├── services/
│   ├── requirements.txt
│   ├── recon/                   # Source collectors
│   ├── forensic/                # Death screenshot analysis
│   └── common/                  # API and LLM clients
├── data/
│   ├── knowledge/               # Real JSON: weapons, ammo, armor, medical
│   └── screenshots/             # Death screenshots (git-ignored)
└── scripts/
    ├── setup.ps1                # Windows setup
    └── reset-db.ps1
```

### Base de datos portable (migraciones y seeders)

- El esquema vive **solo** en `migrations/`. Cualquiera clona el repo y ejecuta `pnpm db:migrate` para tener todas las tablas iguales.
- Los datos se cargan con seeders, nunca pegando SQL a mano.
- `pnpm db:seed:dev` carga datos dummy para probar la interfaz. Se eliminan con `pnpm db:seed:undo:dev` antes de trabajar con datos reales.
- `pnpm db:seed:base` carga los datos reales desde `data/knowledge/*.json`, ya verificados con el prompt R-8.
- Exportar e importar: `pnpm db:export` vuelca las tablas a JSON en `data/`, y otro equipo las importa con el seeder base.

| Tabla | Contenido |
| --- | --- |
| `intel` | Información recolectada (fuente, título, URL, contenido, fechas, procesado) |
| `weapons` | Nombre, alias, calibre, cadencia, alcance |
| `ammo` | Calibre, penetración, daño, precio |
| `armor` | Tipo (casco/chaleco), nivel, durabilidad, zonas |
| `medical_items` | Efecto, duración, precio, uso táctico |
| `raids` | Mapa, equipo llevado, botín, sobrevivió, ganancia |
| `deaths` | Informe forense, arma y munición rival, zona del impacto |
| `reports` | Partes de inteligencia diarios |
| `sources` | URL, estado de verificación, última consulta |

### Entornos

| Archivo | Uso | ¿Va a Git? |
| --- | --- | --- |
| `.env.example` | Plantilla con todas las variables, sin valores secretos | ✅ Sí |
| `.env.development` | Local, SQLite, datos dummy permitidos | ❌ No |
| `.env.test` | Pruebas automáticas con BD temporal | ❌ No |
| `.env.production` | PostgreSQL, sin seeders dev | ❌ No |

Variables mínimas: `DB_DIALECT`, `DB_STORAGE` o `DATABASE_URL`, `API_PORT`, `INGEST_TOKEN`, `LMSTUDIO_URL`, `LLM_TEXT_MODEL`, `LLM_VISION_MODEL`.

### Pantallas del panel

1. **Centro de mando:** resumen del día, alertas del meta, tasa de supervivencia.
2. **Inteligencia:** partes diarios con filtros por fuente.
3. **Arsenal:** tablas de munición y armaduras con calculadora de penetración.
4. **Forense:** subir una captura y ver el informe animado.
5. **Economía:** registro de raids y gráfica de ganancia o pérdida.

Estilo: tema oscuro, verde oliva y ámbar, tipografía monoespaciada en los datos, animaciones de entrada cortas (≤ 200 ms) y `prefers-reduced-motion` respetado.

### Seguridad

- Subida de capturas: validar tipo (PNG/JPG), tamaño máximo y renombrar archivos; nunca servirlos con su nombre original.
- Escapar todo texto externo (Reddit, wiki) antes de mostrarlo en React; no usar `dangerouslySetInnerHTML` con contenido recolectado.
- `/api/ingest` protegido con token interno y rate limit; CORS limitado a la URL local del panel.
- Ningún secreto en Dockerfiles ni en el repositorio.

### Repositorio en tu GitHub personal

- Crear el repo `helper-abi` en **tu cuenta personal**, no en la organización de la empresa. Visibilidad recomendada: privado.
- Configurar la identidad **solo para este repo** para no mezclarla con la del trabajo:

```
git config user.name "Joel Contreras"
git config user.email "<your-personal-email>"
```

- Si en el mismo PC usas la cuenta de la empresa, crear una llave SSH aparte para la cuenta personal y un alias en `~/.ssh/config` (por ejemplo, `github-personal`).
- `.gitignore` debe excluir: `node_modules/`, `.env*` (menos `.env.example`), `*.sqlite`, `data/screenshots/`, `__pycache__/`, `.venv/`, `dist/`.
- Ramas: `main` estable y `dev` de trabajo; commits con Conventional Commits (`feat:`, `fix:`, `docs:`).
- Revisa la política de tu empresa sobre proyectos personales hechos en equipos o en horario laboral.

### Fases de despliegue

| Fase | Nombre en clave | Entregable |
| --- | --- | --- |
| 0 | VERIFICACIÓN | Fuentes confirmadas (sección 10) |
| 1 | CIMIENTOS | Monorepo, `.env.example`, Git, repo en GitHub personal |
| 2 | BÚNKER | API + Sequelize + migraciones + seeders dev y base |
| 3 | PANEL | React con layout, tema y navegación animada |
| 4 | RECONOCIMIENTO | Workers Python enviando a `/api/ingest` |
| 5 | ARSENAL | Datos reales cargados, dummy eliminado |
| 6 | FORENSE | Análisis de capturas (sección 12) |
| 7 | AUTOMATIZACIÓN | Tareas programadas y exportación de BD |

---

## 14. ORDEN PARA CLAUDE EN VS CODE

> Lee este documento completo. Construye el proyecto **Operación Centinela** fase por fase, dentro de la carpeta raíz `helper-abi`, siguiendo la arquitectura de la sección 13, empezando por la Fase 0 (VERIFICACIÓN). Al terminar cada fase, detente, explícame qué hiciste, cómo probarlo, y espera mi confirmación antes de seguir. Explícame todo como a un principiante: no tengo experiencia programando. Usa Windows como sistema de referencia.

---

**FIN DEL DOCUMENTO** · *"La información es munición."*
