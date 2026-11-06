# OPERACIÓN CENTINELA

## Investigación de fuentes externas y arquitectura de ingesta

> Documento complementario de `ESPECIFICACION.md` y
> `PROTOCOLO_COMPLEMENTARIO_CENTINELA.md`.\
> **Versión:** 1.0 · **Fecha de investigación:** 06/11/2026\
> **Objetivo:** definir una estrategia viable para consultar fuentes
> públicas de Arena Breakout: Infinite, detectar contenido nuevo y
> organizarlo dentro de Helper-ABI.

------------------------------------------------------------------------

## 1. Conclusión ejecutiva

**Sí es viable construir un agregador de inteligencia externo** que se
ejecute manualmente mediante un botón o automáticamente mediante una
tarea programada.

El sistema no necesita que una IA invente noticias ni que navegue
manualmente por internet en cada ejecución. Debe utilizar conectores
específicos por fuente para consultar publicaciones recientes,
normalizar sus metadatos, detectar duplicados, clasificar el contenido y
guardar los resultados en la API de Helper-ABI.

La viabilidad depende de cada fuente:

-   Steam ofrece una API oficial de noticias apta para consultas
    incrementales.
-   La web oficial de Arena Breakout: Infinite publica noticias, pero su
    listado se carga dinámicamente; hay que identificar y validar el
    mecanismo público de datos antes de implementar un conector estable.
-   YouTube ofrece API oficial para metadatos y canales. Los feeds de
    canal pueden ser una alternativa de bajo costo para detectar
    publicaciones.
-   Reddit exige OAuth y tiene reglas de retención y eliminación de
    contenido; debe integrarse con cautela.
-   Las bases de datos y guías comunitarias pueden consultarse mediante
    conectores específicos, siempre que sus condiciones y mecanismos
    públicos lo permitan. No existe una API universal para todas ellas.

No se debe prometer cobertura total de internet. El sistema solo podrá
consultar fuentes registradas y técnicamente accesibles.

## 2. Fuentes investigadas y viabilidad

### 2.1 Steam News API

-   URL de noticias: `https://store.steampowered.com/news/app/2073620`
-   AppID observado: `2073620`.
-   API documentada:
    `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/`
-   Documentación:
    `https://partner.steamgames.com/doc/webapi/ISteamNews`

La operación `GetNewsForApp` admite: - `appid`: identificador de la
aplicación. - `count`: cantidad de publicaciones. - `maxlength`:
longitud máxima del contenido devuelto. - `enddate`: devolver
publicaciones anteriores a una fecha Unix. - `feeds`: filtrar por feeds
cuando corresponda.

**Evaluación:** conector prioritario. Permite consultar novedades por
fecha y guardar el ID externo, fecha, título, URL, contenido disponible
y metadatos.

**Limitación:** no contiene necesariamente todas las publicaciones
oficiales. Se ha observado que ciertas notas de actualización se
publican en el sitio oficial y no aparecen en Steam. Steam debe ser una
fuente oficial complementaria, no la única.

### 2.2 Sitio oficial de Arena Breakout: Infinite

-   Web oficial: `https://www.arenabreakoutinfinite.com/`
-   Versión en español:
    `https://www.arenabreakoutinfinite.com/es/index.html`
-   Sección de noticias observada:
    `https://www.arenabreakoutinfinite.com/es/list.html`

La página principal presenta una sección de noticias y contenido
destacado de creadores. El listado de noticias devuelve un estado de
carga dinámico en la consulta web examinada.

**Evaluación:** fuente prioritaria de anuncios, parches, eventos y
noticias oficiales.

**Trabajo previo obligatorio:** inspeccionar en navegador las
solicitudes de red de la sección pública de noticias para identificar si
existe un endpoint JSON, feed o respuesta HTML pública estable. Validar
términos, robots.txt, frecuencia y estructura. No asumir ni inventar una
API. Si no existe una vía estable y permitida, mantener la fuente como
consulta manual o usar un adaptador HTML con pruebas y fallback.

### 2.3 YouTube

Documentación oficial: -
`https://developers.google.com/youtube/data/reference/rest` -
`https://developers.google.com/youtube/data/determine_quota_cost` -
`https://developers.google.com/youtube/data/guides/implementation/captions`

Opciones de ingesta:

**A. Feed de canal** - Un feed público de canal puede servir para
detectar nuevas publicaciones. - Es una opción ligera para canales
previamente seleccionados. - Debe validarse con IDs reales de los
canales elegidos.

**B. YouTube Data API** - Requiere API key u OAuth según el método. -
Permite consultar canales, vídeos, playlists y metadatos. -
`search.list` tiene un costo de cuota significativamente mayor que
operaciones como `videos.list` o `playlistItems.list`. - La cuota
predeterminada documentada incluye 10.000 unidades diarias para la
mayoría de métodos, mientras que `search.list` tiene un límite separado
de 100 llamadas diarias en la configuración documentada consultada.
Revisar la cuota efectiva del proyecto de Google antes de depender de
búsquedas frecuentes.

**C. Transcripciones** - La API oficial de captions requiere OAuth para
listar y descargar subtítulos. - La descarga de subtítulos de vídeos de
terceros no debe darse por garantizada. - No hacer que la transcripción
sea requisito para registrar un vídeo. - Si no se dispone legal y
técnicamente de transcripción, guardar título, descripción, fecha,
canal, URL y miniatura; el operador podrá revisar el vídeo manualmente.

**Evaluación:** alta viabilidad para descubrir y registrar vídeos.
Viabilidad condicional para obtener transcripciones.

### 2.4 Reddit

-   Comunidad: `https://www.reddit.com/r/ArenaBreakoutInfinite/`
-   Documentación:
    `https://support.reddithelp.com/hc/es-es/articles/16160319875092-Wiki-de-la-API-de-datos-Reddit`

La API de datos de Reddit requiere OAuth. Reddit exige un User-Agent
identificable, control de límites y cumplimiento de sus términos.
También exige retirar el contenido asociado a publicaciones o cuentas
eliminadas y recomienda eliminar rutinariamente contenido y datos de
usuario almacenados dentro de 48 horas.

**Evaluación:** técnicamente posible, pero no usarlo como archivo
permanente de texto completo. Diseñar el conector para almacenar
únicamente lo permitido, conservar referencias cuando corresponda y
ejecutar tareas de eliminación/sincronización de contenido borrado. Si
el cumplimiento no puede garantizarse, desactivar la persistencia de
cuerpos y limitarse a enlaces o descartar la integración.

### 2.5 Fuentes comunitarias de datos y guías

Fuentes encontradas para evaluar como conectores separados:

  -----------------------------------------------------------------------------------------------------------------------------
  Fuente            URL                                                                     Contenido útil    Estado
                                                                                                              recomendado
  ----------------- ----------------------------------------------------------------------- ----------------- -----------------
  SenseOS           `https://senseos.gg/guides/arena-breakout-infinite/weapon-tier-list/`   Tier lists, guías Evaluar RSS/HTML
                                                                                            y análisis de     y términos
                                                                                            balance           

  ABI Builder       `https://abibuilder.com/`                                               Eventos, builds,  Evaluar páginas
                                                                                            mapas, guías y    públicas y
                                                                                            herramientas      términos

  ABI Field Index   `https://arenabreakoutinfinite.wiki/`                                   Munición,         Evaluar
                                                                                            armaduras, mapas  estructura de
                                                                                            y datos           datos y términos
                                                                                            estructurados     

  ABI Tracker       `https://abi-tracker.azurewebsites.net/`                                Armas, munición,  Evaluar endpoints
                                                                                            armaduras,        públicos y
                                                                                            mercado y         términos
                                                                                            changelog         

  ABI Database      `https://arenabreakout-infinite.com/`                                   Armas, munición,  Evaluar método,
                                                                                            accesorios, mapas versión y
                                                                                            y tier lists      términos
  -----------------------------------------------------------------------------------------------------------------------------

Estas páginas son fuentes comunitarias, no publicaciones oficiales de
MoreFun. Sus valores y recomendaciones deben conservar la atribución y
el nivel de confianza. No asumir que tienen API pública, permiso de
scraping ni datos correctos solo por estar disponibles en el navegador.

## 3. Taxonomía del contenido

El tipo de fuente y la categoría del contenido son conceptos distintos.
Un vídeo oficial puede ser una noticia y una publicación de Reddit puede
ser un reporte de bug.

Se propone una clasificación con categorías múltiples:

  -----------------------------------------------------------------------
  Categoría                           Ejemplos
  ----------------------------------- -----------------------------------
  `patch_notes`                       Notas de parche, hotfixes y ajustes

  `official_news`                     Comunicados y anuncios oficiales

  `events`                            Eventos, recompensas y
                                      colaboraciones

  `season_updates`                    Lanzamientos y avances de temporada

  `tier_lists`                        Rankings S/A/B/C/D y comparativas

  `weapon_builds`                     Configuraciones y accesorios

  `ammo_guides`                       Guías de munición y penetración

  `armor_guides`                      Protección, cascos y chalecos

  `map_guides`                        Mapas, rutas y extracciones

  `tactical_guides`                   Posicionamiento, rotaciones y
                                      tácticas

  `economy_guides`                    Mercado, Koen, loot y rentabilidad

  `videos`                            Vídeos que no encajan en otra
                                      categoría o categoría secundaria

  `community_discussion`              Discusiones y experiencias

  `bug_reports`                       Errores, fallos y problemas
                                      reportados

  `tournaments`                       Torneos y competición

  `other`                             Contenido sin clasificación
                                      suficiente
  -----------------------------------------------------------------------

Un elemento puede tener una categoría principal y varias etiquetas
secundarias. La clasificación automática debe ser revisable.

## 4. Experiencia de usuario: botón y cron

### 4.1 Actualización manual

El panel tendrá una acción visible: **Actualizar inteligencia**.

Al pulsarla: 1. La API crea un trabajo de sincronización. 2. Los
conectores activos consultan sus fuentes. 3. Cada conector recupera
publicaciones posteriores a su cursor o fecha de última sincronización
exitosa. 4. Los registros se normalizan y deduplican. 5. Se guardan los
elementos nuevos. 6. Se clasifican y, si está habilitado, se resumen con
LM Studio. 7. El panel muestra resultados y errores por fuente.

La interfaz debe mostrar: - hora de inicio y finalización; - fuentes
consultadas; - publicaciones nuevas; - elementos actualizados; -
duplicados ignorados; - errores y fuentes no disponibles; - duración; -
estado general del trabajo.

No mostrar «actualización completada» si algunas fuentes fallaron. Usar
un estado parcial cuando corresponda.

### 4.2 Actualización automática

Opciones: - Programador interno del backend mientras la aplicación está
encendida. - Programador de tareas de Windows para lanzar una ejecución
aunque la aplicación no esté abierta.

Para un entorno Windows de uso personal, Windows Task Scheduler es una
alternativa robusta. El cron interno es suficiente cuando el backend
permanece encendido.

Frecuencia inicial sugerida: - Fuentes oficiales: cada 2 a 4 horas. -
YouTube: cada 6 a 12 horas. - Fuentes comunitarias: cada 6 a 12 horas. -
Reddit: cada 6 a 12 horas, solo si la integración cumple sus
políticas. - Resumen diario: una vez al día, después de la ventana de
sincronización elegida.

Estas frecuencias son valores iniciales configurables, no requisitos de
los proveedores. Respetar límites, condiciones y cabeceras de cada
fuente.

## 5. Sincronización incremental y deduplicación

No descargar todo el historial en cada ejecución.

Cada fuente debe mantener: - `last_attempt_at` - `last_success_at` -
`last_seen_published_at` - `cursor` o identificador de paginación cuando
exista - `status` - `last_error` - `items_created` - `items_updated`

Regla de sincronización: 1. Usar el cursor o fecha de la última
sincronización exitosa. 2. Consultar con una pequeña ventana de
solapamiento para capturar publicaciones tardías o cambios de orden. 3.
Deduplicar mediante el identificador externo de la fuente. 4. Si no
existe ID estable, usar URL canónica normalizada y, como respaldo, un
hash de título + fecha + fuente. 5. Actualizar el cursor solo después de
guardar correctamente los resultados de la ejecución. 6. Si falla una
fuente, conservar su cursor anterior y permitir reintento.

No usar la fecha de ejecución como si fuera la fecha de publicación.
Guardar `published_at`, `retrieved_at` y `updated_at` por separado.

El usuario podrá elegir un rango inicial de consulta: últimas 24 horas,
últimos 7 días, últimos 30 días o una fecha personalizada. Después de la
primera carga, el comportamiento predeterminado será «desde la última
sincronización exitosa».

## 6. Flujo técnico propuesto

``` text
BOTÓN DEL PANEL / WINDOWS TASK SCHEDULER
                  |
                  v
          API crea sync job
                  |
                  v
       ORQUESTADOR DE CONECTORES
         /       |        \
        v        v         v
     STEAM    OFFICIAL   YOUTUBE
        \        |         /
         \       |        /
          v      v       v
           NORMALIZACIÓN
                  |
                  v
             DEDUPLICACIÓN
                  |
                  v
          ALMACENAMIENTO API
                  |
                  v
       CLASIFICACIÓN Y EXTRACCIÓN
                  |
                  v
          LM STUDIO (OPCIONAL)
                  |
                  v
       NOTICIAS / VÍDEOS / GUÍAS /
       TIER LISTS / PARCHES / EVENTOS
```

La API Express sigue siendo la única responsable de escribir en la base
de datos. Los workers Python envían registros normalizados a la API; no
ejecutan SQL directamente.

## 7. Modelo conceptual para contenido externo

La tabla `intel` de la especificación principal puede ampliarse o
complementarse. Antes de crear migraciones, Claude debe revisar el
modelo actual y presentar una propuesta.

Campos recomendados para cada elemento:

-   `id`
-   `source_id`
-   `external_id`
-   `canonical_url`
-   `title`
-   `description`
-   `content_excerpt`
-   `content_type`
-   `categories`
-   `language`
-   `author_or_channel`
-   `published_at`
-   `retrieved_at`
-   `updated_at`
-   `game_version`
-   `season`
-   `verification_status`
-   `processing_status`
-   `content_hash`
-   `thumbnail_url` (si se permite y está disponible)
-   `metadata_json`

Para vídeos, añadir cuando esté disponible: - `video_id` -
`channel_id` - `duration` - `thumbnail_url` - `transcript_status` -
`transcript_language`

No almacenar transcripciones completas ni textos extensos de terceros
sin verificar los derechos y términos aplicables. Priorizar metadatos,
enlaces, extractos breves y resúmenes propios.

## 8. Clasificación y uso de IA local

La IA local debe trabajar después de la extracción, no sustituirla.

Responsabilidades: - clasificar por categoría; - extraer entidades como
armas, municiones, mapas y temporadas; - identificar idioma; - generar
resumen breve; - detectar si el contenido parece referirse a Arena
Breakout Mobile u otro juego; - señalar datos dudosos o
contradictorios; - sugerir etiquetas.

La IA no debe: - crear cifras ausentes; - inventar la fecha de
publicación; - convertir opinión en hecho oficial; - asignar un nivel de
verificación sin evidencia; - presentar una tier list comunitaria como
ranking oficial; - completar una transcripción que no existe.

La clasificación debe guardar modelo, fecha de procesamiento y estado.
Cuando el resultado sea ambiguo, usar `needs_review`.

## 9. Cómo representar las tier lists

No combinar todos los rankings en una única tier list propia.

Cada ranking externo debe conservar: - autor/canal; - URL; - fecha de
publicación; - temporada/parche de referencia; - modo de juego y
contexto; - armas incluidas; - posición o tier asignado; - explicación
disponible; - tipo de evidencia; - fecha de captura; - estado de
revisión.

La interfaz puede permitir comparar las opiniones de varios creadores,
pero debe mostrar desacuerdos. Una tier list de creador es una opinión
atribuida, no una estadística oficial.

La tier list calculada por Centinela, si se implementa en el futuro,
debe ser una vista separada y explicar sus fórmulas y datos de entrada.

## 10. Fases recomendadas para esta capacidad

### I-1 --- Catálogo de fuentes

-   Registrar URLs y tipo de fuente.
-   Comprobar disponibilidad, términos, robots.txt y mecanismos de
    acceso.
-   Probar extracción manual y automatizada.
-   Documentar límites y campos disponibles.

### I-2 --- Conectores oficiales

-   Implementar Steam News API.
-   Investigar el mecanismo público del sitio oficial.
-   Registrar vídeos oficiales de YouTube.
-   Mostrar estado y errores por fuente.

### I-3 --- Contenido comunitario

-   Añadir canales YouTube seleccionados.
-   Evaluar SenseOS, ABI Builder, ABI Field Index y ABI Tracker.
-   Añadir Reddit solo si se resuelven OAuth, retención y eliminación.
-   Mantener lista permitida de fuentes.

### I-4 --- Clasificación

-   Definir categorías y etiquetas.
-   Clasificar metadatos y contenido permitido.
-   Guardar resúmenes y entidades extraídas.
-   Añadir revisión manual.

### I-5 --- Sincronización

-   Botón manual.
-   Cursor por fuente.
-   Deduplicación.
-   Historial de ejecuciones.
-   Reintentos y tolerancia a fallos.

### I-6 --- Programación

-   Programador interno o Windows Task Scheduler.
-   Frecuencias configurables.
-   Resumen diario.
-   Alertas de conectores fallidos.

## 11. Prueba de concepto recomendada

Antes de implementar todos los conectores, hacer una prueba pequeña con
tres fuentes:

1.  Steam News API: confirmar consulta JSON, AppID y fechas.
2.  Sitio oficial: identificar si el listado público de noticias tiene
    un endpoint o feed estable y permitido.
3.  YouTube: registrar nuevos vídeos de un canal oficial o de un canal
    comunitario seleccionado.

La prueba debe demostrar: - detección de una publicación nueva; -
extracción de título, URL y fecha; - deduplicación al ejecutar dos
veces; - persistencia en la API; - visualización en una lista del
panel; - manejo de un conector que falle.

No comenzar con Reddit ni con transcripciones automáticas. Añadirlos
después de validar el núcleo.

## 12. Referencias consultadas

### Oficiales

-   Steamworks ISteamNews:
    `https://partner.steamgames.com/doc/webapi/ISteamNews`
-   Steam News ABI: `https://store.steampowered.com/news/app/2073620`
-   Sitio oficial ABI: `https://www.arenabreakoutinfinite.com/`
-   YouTube Data API:
    `https://developers.google.com/youtube/data/reference/rest`
-   YouTube quota:
    `https://developers.google.com/youtube/data/determine_quota_cost`
-   YouTube captions:
    `https://developers.google.com/youtube/data/guides/implementation/captions`
-   Reddit Data API policy:
    `https://support.reddithelp.com/hc/es-es/articles/16160319875092-Wiki-de-la-API-de-datos-Reddit`

### Comunitarias para evaluar

-   SenseOS:
    `https://senseos.gg/guides/arena-breakout-infinite/weapon-tier-list/`
-   ABI Builder: `https://abibuilder.com/`
-   ABI Field Index: `https://arenabreakoutinfinite.wiki/`
-   ABI Tracker: `https://abi-tracker.azurewebsites.net/`
-   ABI Database: `https://arenabreakout-infinite.com/`

------------------------------------------------------------------------

**FIN DEL DOCUMENTO**\
*Operación Centinela --- No buscamos todo internet; construimos una red
de fuentes verificables.*
