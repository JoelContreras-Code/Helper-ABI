# OPERACIÓN CENTINELA

## Protocolo complementario de conocimiento, datos y colaboración con Claude

> **Documento complementario** de `ESPECIFICACION.md`.\
> **Versión:** 1.0 · **Fecha:** 06/11/2026\
> **Propósito:** definir cómo se investiga, valida, almacena y mantiene
> el conocimiento de Arena Breakout: Infinite, así como las reglas
> operativas del desarrollador asistido por IA.

------------------------------------------------------------------------

## 1. Relación con la especificación principal

Este documento **no reemplaza ni modifica** `ESPECIFICACION.md`. Lo
complementa en los aspectos que requieren mayor precisión operativa.

-   `ESPECIFICACION.md`: define el producto, sus módulos, arquitectura,
    tecnologías y fases.
-   Este documento: define la gobernanza del conocimiento, la calidad de
    los datos, el flujo de aprobación y las responsabilidades de Claude.
-   Las decisiones técnicas que cambien la arquitectura deberán
    documentarse mediante ADR en `docs/adr/`.
-   Si ambos documentos parecen contradecirse, Claude debe detenerse,
    señalar la contradicción y solicitar una decisión. No debe elegir
    silenciosamente.

## 2. Principios no negociables

1.  **Juego correcto:** solo Arena Breakout: Infinite para PC. Nunca
    mezclar datos de Arena Breakout Mobile ni de Escape from Tarkov.
2.  **Evidencia antes que afirmaciones:** todo dato factual incorporado
    al conocimiento debe tener una fuente rastreable o quedar
    explícitamente marcado como no verificado.
3.  **No inventar:** los campos desconocidos permanecen `null`, vacíos o
    con estado pendiente. No se completan por intuición ni mediante
    datos de otro juego.
4.  **Separación de responsabilidades:** Claude implementa y procesa; el
    operador y el equipo de conocimiento investigan, contrastan y
    aprueban los datos que se consideran oficiales para la base.
5.  **Historial preservado:** una actualización no debe borrar el valor
    anterior ni su procedencia.
6.  **Automatización tolerante a fallos:** el fallo de una fuente no
    debe detener la consulta de las demás.
7.  **Seguridad del juego:** no interactuar con el cliente, memoria,
    archivos, procesos, tráfico privado, SDK de cuenta ni mecanismos del
    anticheat.
8.  **Cambios pequeños y verificables:** Claude debe inspeccionar el
    proyecto antes de modificarlo, evitar sobreingeniería y probar cada
    cambio.

## 3. Identidad y alcance de las fuentes

### 3.1 Identificación obligatoria

Antes de extraer información, verificar que la fuente corresponde a: -
Juego: Arena Breakout: Infinite. - Plataforma: PC. -
Desarrollador/editor: MoreFun Studios / Level Infinite, según
corresponda a la publicación. - Región, temporada, parche y fecha,
cuando la fuente los indique.

Si la fuente no permite confirmar que habla de la versión de PC,
clasificarla como `version_uncertain`. No trasladar sus cifras a los
datos confirmados.

### 3.2 Clasificación de fuentes

  -----------------------------------------------------------------------
  Nivel                   Tipo de fuente          Uso
  ----------------------- ----------------------- -----------------------
  A                       Publicación oficial,    Evidencia primaria para
                          notas de parche o       cambios oficiales
                          información oficial del 
                          juego                   

  B                       Base de datos o wiki    Referencia técnica que
                          comunitaria con datos   debe contrastarse
                          verificables            

  C                       Pruebas reproducibles,  Evidencia empírica;
                          capturas o mediciones   documentar método
                          propias                 

  D                       Creadores, guías y      Opiniones, estrategias
                          análisis de jugadores   y observaciones
                          identificables          

  E                       Comentarios, foros y    Pistas que requieren
                          publicaciones aisladas  corroboración
  -----------------------------------------------------------------------

La clasificación no convierte automáticamente una fuente en verdadera.
Incluso una fuente de nivel A debe vincularse al dato concreto que
respalda.

### 3.3 Registro de fuentes

Cada fuente debe tener, cuando sea posible:

-   `name`
-   `url`
-   `source_type`
-   `trust_level`
-   `game_version`
-   `region`
-   `language`
-   `last_checked_at`
-   `last_success_at`
-   `status`: `active`, `unavailable`, `restricted`, `deprecated`,
    `pending_review`
-   `terms_reviewed`
-   `notes`

No automatizar una fuente si sus términos, robots.txt o restricciones
aplicables no han sido revisados. Si el acceso automatizado no está
permitido o no es viable, utilizar consulta manual o descartar la
fuente.

## 4. Estados de verificación y confianza

### 4.1 Estados permitidos

Usar un vocabulario controlado:

-   `pending`: dato recopilado, aún no revisado.
-   `verified`: dato respaldado por evidencia suficiente.
-   `corroborated`: dato contrastado con una o más fuentes
    independientes.
-   `disputed`: fuentes confiables presentan valores incompatibles.
-   `unverified`: no hay evidencia suficiente.
-   `obsolete`: fue válido, pero ya no debe tratarse como vigente.
-   `rejected`: dato incorrecto o perteneciente a otro juego/versión.

No convertir automáticamente `pending` o `unverified` en `verified`
mediante un resumen de IA.

### 4.2 Reglas de aprobación

-   Los datos extraídos automáticamente ingresan como pendientes.
-   La IA puede detectar contradicciones y proponer correcciones, pero
    no aprobar por sí sola datos críticos.
-   Para cifras de daño, penetración, durabilidad, precios y
    estadísticas de armas, conservar evidencia específica.
-   Una fuente que copia a otra no cuenta como corroboración
    independiente.
-   Si dos fuentes discrepan, conservar ambos valores y abrir una
    discrepancia; no calcular un promedio arbitrario.
-   El operador aprueba la incorporación al conjunto de conocimiento
    verificado.

### 4.3 Registro de evidencia

Cada dato relevante debe poder relacionarse con una o varias evidencias:

-   `source_id`
-   `source_url`
-   `retrieved_at`
-   `published_at` (si existe)
-   `quote_or_excerpt` o referencia concreta a tabla/sección
-   `evidence_type`: `official`, `database`, `measurement`, `community`,
    `video`, `other`
-   `game_version`
-   `confidence_status`
-   `reviewed_by` y `reviewed_at` cuando haya revisión humana

Guardar extractos breves y referencias, respetando derechos de autor y
condiciones de uso. No es necesario copiar artículos completos.

## 5. Modelo temporal: temporada, parche y vigencia

Todo dato que pueda cambiar con actualizaciones debe asociarse, cuando
la evidencia lo permita, a:

-   `season`
-   `patch_version`
-   `valid_from`
-   `valid_until`
-   `observed_at`
-   `last_verified_at`

Reglas:

1.  No asumir que el dato actual es válido para temporadas anteriores.
2.  No sobrescribir una cifra antigua sin conservar su historial.
3.  Cuando un parche cambie un dato, registrar el valor anterior y el
    nuevo.
4.  Si no se conoce la temporada o parche, marcarlo como desconocido; no
    inferirlo por la fecha de consulta.
5.  Distinguir fecha de publicación, fecha de consulta y periodo de
    vigencia.

Los datos sin vigencia confirmada pueden mostrarse, pero la interfaz
debe advertir que su actualidad no está garantizada.

## 6. Separación de datos maestros, observaciones y análisis

No mezclar en una misma entidad información de naturaleza distinta.

### 6.1 Datos maestros

Identifican objetos y propiedades relativamente estables: - armas y
variantes; - municiones; - armaduras y cascos; - objetos médicos; -
mapas, modos y extracciones; - comerciantes y categorías de objetos.

### 6.2 Observaciones

Registran valores medidos o consultados en un momento: - precios de
mercado; - disponibilidad; - estadísticas observadas en una versión; -
popularidad o frecuencia de uso; - resultados de pruebas.

Una observación debe indicar fecha, contexto, fuente y versión cuando
sea posible.

### 6.3 Análisis y recomendaciones

Son conclusiones derivadas: - build recomendada; - relación
costo/rendimiento; - táctica sugerida; - tendencia del meta; -
explicación probable de una muerte.

Toda recomendación debe enlazar con los datos y evidencias que la
sustentan. Debe identificarse como análisis, no como estadística
oficial.

## 7. Reglas especiales para dominios críticos

### 7.1 Munición y balística

No reducir el sistema de balística a una regla universal del tipo
«penetración 5 atraviesa siempre armadura 4».

La comparación puede depender de mecánicas adicionales, condición de la
armadura, zonas protegidas, distancia, impactos y otros factores del
juego. El motor de reglas solo debe implementar mecánicas que hayan sido
documentadas y verificadas.

Por cada munición, conservar cuando exista evidencia: - nombre y
alias; - calibre; - nivel de penetración; - daño; - velocidad; -
compatibilidad; - precio y contexto del precio; - parche/temporada; -
fuente y estado de verificación.

Si una propiedad no está confirmada, el calculador debe mostrar
`desconocido` o una advertencia. No debe fabricar probabilidades ni
cantidad exacta de disparos.

### 7.2 Armaduras y cascos

Distinguir: - nivel de protección; - durabilidad máxima y condición
actual; - zonas cubiertas; - material, si está documentado; -
penalizaciones; - precio; - versión y evidencia.

No asumir que dos piezas del mismo nivel protegen igual. No afirmar que
una zona está cubierta si no existe evidencia del modelo o de una
prueba.

### 7.3 Precios y economía

Un precio no es un atributo permanente del objeto. Cada precio observado
debe incluir, si se conoce: - moneda; - valor; - mercado o
comerciante; - región/servidor; - fecha y hora; - cantidad o unidad; -
condición del objeto; - impuestos o comisiones aplicables; - fuente.

No comparar precios de contextos distintos como si fueran equivalentes.
Las recomendaciones económicas deben indicar el presupuesto y el
contexto utilizados.

### 7.4 Builds y meta

Cada build debe incluir: - arma base y configuración de accesorios; -
coste estimado y fecha; - propósito (económica, equilibrada,
competitiva, etc.); - modo y mapa, si aplica; - estilo o distancia de
combate; - fuente de la propuesta; - pruebas o evidencia disponible; -
limitaciones conocidas.

Una recomendación de creador debe atribuirse a ese creador. No
etiquetarla como «meta» únicamente por una publicación popular.

### 7.5 Mapas y tácticas

Diferenciar hechos verificables (extracciones, condiciones, nombres de
ubicaciones) de consejos tácticos (rutas, posiciones, zonas calientes).
Los consejos pueden depender del modo, dificultad, aparición y
comportamiento de otros jugadores.

Cada guía debe indicar mapa, modo, fecha, fuente y nivel de confianza.

## 8. Contrato de ingestión de conocimiento

Los recolectores deben entregar registros normalizados. El contrato
definitivo se implementará y validará con Zod en la API; este esquema es
una guía conceptual, no una orden para crear una tabla sin revisar el
modelo existente.

Ejemplo de registro:

``` json
{
  "entity_type": "ammo",
  "entity_key": "7.62x51_example_round",
  "field": "penetration_level",
  "value": 4,
  "unit": "level",
  "game": "Arena Breakout: Infinite",
  "platform": "PC",
  "season": null,
  "patch_version": null,
  "source_id": "source_example",
  "source_url": "https://example.com/reference",
  "retrieved_at": "2026-11-06T12:00:00Z",
  "published_at": null,
  "verification_status": "pending",
  "notes": "Pendiente de contraste"
}
```

Reglas del contrato:

-   Identificar entidades mediante claves estables; no depender solo del
    nombre traducido.
-   Guardar nombres originales, nombres localizados y alias por separado
    cuando sea necesario.
-   Mantener unidades explícitas.
-   Validar tipos, rangos y campos obligatorios.
-   Rechazar registros sin identificación del juego/plataforma.
-   Permitir campos desconocidos sin inventar valores.
-   Evitar duplicados mediante claves naturales o identificadores
    estables.
-   La API es la única responsable de validar y persistir; los workers
    no escriben directamente en la base de datos.

## 9. Modelo de datos: recomendaciones para revisar el esquema

Las tablas de la especificación principal son un punto de partida. Antes
de implementar migraciones definitivas, Claude debe presentar una
propuesta de relaciones y explicar cómo preservará procedencia e
historial.

Entidades o capacidades que deben evaluarse:

  -----------------------------------------------------------------------
  Entidad/capacidad                   Propósito
  ----------------------------------- -----------------------------------
  `sources`                           Catálogo y estado de las fuentes

  `source_documents` o equivalente    Publicaciones, páginas, videos y
                                      documentos recolectados

  `evidence`                          Evidencia que respalda afirmaciones
                                      concretas

  `weapons`, `ammo`, `armor`,         Datos maestros del juego
  `medical_items`                     

  `entity_aliases`                    Nombres alternativos y
                                      localizaciones

  `stat_observations` o equivalente   Valores observados por versión y
                                      fecha

  `price_observations`                Histórico de precios con contexto

  `builds` y componentes              Configuraciones y recomendaciones

  `maps`, `map_locations`,            Conocimiento geográfico y
  `extractions`                       condiciones

  `raids`, `deaths`                   Historial personal del operador

  `reports`                           Informes generados y sus fuentes

  `review_tasks` o equivalente        Datos pendientes, disputas y
                                      aprobaciones
  -----------------------------------------------------------------------

No es obligatorio crear una tabla por cada fila. Claude debe proponer un
diseño normalizado, explicar las relaciones y evitar duplicación
innecesaria.

### Requisitos de integridad

-   Las relaciones deben usar claves foráneas cuando corresponda.
-   Las migraciones deben ser reversibles cuando sea viable.
-   Los seeders base solo deben cargar registros aprobados.
-   Los datos de prueba deben estar claramente separados de los reales.
-   Una exportación debe conservar IDs, relaciones, unidades,
    procedencia, estado y fechas.
-   La importación debe ser idempotente: repetirla no debe duplicar
    registros.
-   Los cambios de esquema requieren pruebas y documentación.

## 10. Flujo de trabajo del equipo de conocimiento

El flujo estándar será:

1.  **Definir pregunta:** concretar qué dato o dominio necesitamos
    investigar.
2.  **Localizar fuentes:** identificar fuentes aptas para PC y para la
    versión relevante.
3.  **Extraer:** recopilar datos sin reinterpretarlos.
4.  **Normalizar:** organizar nombres, unidades, categorías y versiones.
5.  **Contrastar:** buscar discrepancias y corroboración independiente.
6.  **Revisar:** separar confirmados, pendientes, dudosos y rechazados.
7.  **Aprobar:** el operador decide qué entra al conocimiento
    verificado.
8.  **Entregar:** preparar JSON/CSV/Markdown según el contrato acordado.
9.  **Importar:** Claude implementa o ejecuta el mecanismo de carga
    autorizado.
10. **Comprobar:** validar conteos, relaciones, duplicados y resultados
    de consulta.

### Paquete de entrega de información

Cada lote de conocimiento debe incluir: - objetivo del lote; - fecha de
investigación; - juego/plataforma; - temporada/parche, si se conoce; -
fuentes consultadas; - registros normalizados; - datos pendientes o
disputados; - cambios respecto al lote anterior; - responsable de
aprobación.

No presentar un lote como completo si existen campos críticos sin
verificar.

## 11. Responsabilidades de Claude

Claude actúa como desarrollador e implementador técnico, no como
autoridad final de los datos del juego.

### Puede

-   inspeccionar el repositorio y explicar su estado;
-   proponer arquitectura y modelos de datos;
-   implementar recolectores respetando las fuentes autorizadas;
-   normalizar y validar registros;
-   crear migraciones, seeders, endpoints y pruebas;
-   detectar duplicados, inconsistencias y datos incompletos;
-   generar informes que distingan evidencia de inferencia;
-   proponer mejoras sin aplicarlas hasta recibir autorización cuando
    afecten alcance o arquitectura.

### No puede

-   inventar estadísticas, precios, nombres, URLs, parches o mecánicas;
-   convertir una opinión comunitaria en hecho confirmado;
-   mezclar información de la versión móvil o de otros juegos;
-   aprobar por su cuenta datos críticos para el conjunto verificado;
-   sobrescribir o eliminar historial sin autorización;
-   cambiar tecnologías, arquitectura, dependencias principales o
    alcance unilateralmente;
-   ejecutar scraping que incumpla términos o restricciones;
-   acceder al cliente del juego, su memoria, archivos o tráfico;
-   introducir datos ficticios en seeders de producción;
-   afirmar que una fase está terminada sin pruebas y evidencia de
    funcionamiento.

### Antes de cada tarea

Claude debe: 1. leer la especificación principal y este protocolo; 2.
inspeccionar los archivos relacionados y el código existente; 3.
identificar dependencias y efectos colaterales; 4. proponer el cambio
mínimo necesario; 5. señalar supuestos y preguntas bloqueantes; 6.
implementar únicamente el alcance aprobado.

### Al terminar cada tarea

Debe entregar: - resumen de archivos creados/modificados; - decisiones
técnicas tomadas; - comandos ejecutados; - pruebas realizadas y
resultados; - limitaciones o riesgos pendientes; - pasos exactos para
que el operador verifique; - confirmación de qué queda pendiente.

Debe detenerse al finalizar cada fase y esperar aprobación, conforme a
la especificación principal.

## 12. Skills de Claude: organización propuesta

Las Skills deben ser pequeñas, especializadas y complementarias. No
duplicar toda la especificación en cada una.

  -----------------------------------------------------------------------
  Skill sugerida                      Responsabilidad
  ----------------------------------- -----------------------------------
  `centinela-core`                    Reglas generales, límites, flujo de
                                      trabajo y lectura de documentación

  `centinela-architecture`            Arquitectura, límites entre API,
                                      web, workers y base de datos

  `centinela-database`                Modelado, Sequelize, migraciones,
                                      seeders e integridad

  `centinela-source-recon`            Recolectores, fuentes, permisos,
                                      pausas y manejo de fallos

  `centinela-data-quality`            Normalización, procedencia,
                                      verificación, discrepancias y
                                      vigencia

  `centinela-game-knowledge`          Dominio ABI PC: armas, munición,
                                      armaduras, médicos, mapas y
                                      economía

  `centinela-local-ai`                Integración con LM Studio, prompts,
                                      límites y salidas estructuradas

  `centinela-forensics`               OCR/visión, validación contra la
                                      base y análisis posterior a la
                                      partida

  `centinela-testing`                 Pruebas, criterios de aceptación y
                                      regresiones
  -----------------------------------------------------------------------

Crear únicamente las Skills necesarias para el trabajo real. Antes de
añadir una, comprobar si su responsabilidad ya está cubierta por otra.
Las Skills de conocimiento del juego no autorizan a Claude a inventar
datos ni a aprobar registros.

## 13. Criterios de aceptación transversales

Una funcionalidad no se considera terminada solo porque compile o se vea
en pantalla.

Debe cumplir, según corresponda:

-   validación de entradas y salidas;
-   manejo de errores y logs útiles;
-   pruebas automatizadas;
-   ausencia de secretos en el repositorio;
-   protección frente a contenido externo malicioso;
-   trazabilidad de los datos mostrados;
-   estados vacíos y errores visibles en la interfaz;
-   documentación mínima de configuración y uso;
-   compatibilidad con Windows, según el entorno definido;
-   ninguna interacción prohibida con el cliente del juego.

### Criterios específicos de conocimiento

-   Un registro aprobado tiene procedencia.
-   Un registro pendiente no se presenta como confirmado.
-   Una cifra dinámica muestra cuándo y en qué contexto se observó.
-   Una discrepancia no se oculta mediante promedios.
-   Un dato obsoleto no aparece como vigente sin advertencia.
-   El informe identifica fuentes y separa hechos de recomendaciones.

## 14. Informes generados por IA

Todo informe debe diferenciar visualmente o mediante etiquetas:

-   **HECHO VERIFICADO:** respaldado por evidencia aprobada.
-   **OBSERVACIÓN COMUNITARIA:** reportada por jugadores o creadores.
-   **ANÁLISIS:** interpretación del sistema a partir de los datos
    disponibles.
-   **RECOMENDACIÓN:** acción sugerida, con contexto y limitaciones.
-   **DATO DESCONOCIDO:** información que no se pudo confirmar.

El LLM no debe completar huecos con conocimiento general no respaldado
por la base. Si el contexto es insuficiente, debe declararlo.

Cada informe debe registrar: - fecha y hora de generación; - versión de
la aplicación; - modelo utilizado; - periodo y fuentes analizadas; -
registros de conocimiento consultados; - limitaciones detectadas.

## 15. Decisiones pendientes antes de cerrar el diseño

Estos puntos requieren decisión del operador o una prueba técnica; no
deben resolverse mediante suposiciones:

1.  ¿Qué región/servidor se utilizará como referencia para precios y
    economía?
2.  ¿Qué idioma tendrá prioridad para las fuentes y cuál será el idioma
    de presentación?
3.  ¿Qué temporada y parche se consideran la línea base inicial?
4.  ¿Qué fuentes se aprueban realmente para automatización y cuáles
    serán manuales?
5.  ¿Qué canales de YouTube se autorizan y cómo se identifican sus IDs?
6.  ¿Qué frecuencia tendrá cada recolector y cómo se manejarán límites
    de acceso?
7.  ¿Qué política de retención se aplicará a documentos,
    transcripciones, capturas e informes?
8.  ¿Qué campos serán obligatorios para aprobar munición, armaduras y
    precios?
9.  ¿Qué formato exacto tendrá el paquete de datos que el equipo
    entregará para importar?
10. ¿Qué pruebas reproducibles permitirán validar el calculador
    balístico?

## 16. Orden operativo inicial para Claude

Antes de programar:

1.  Leer `ESPECIFICACION.md` y este documento completo.
2.  No reemplazar, reescribir ni resumir estos documentos como
    sustituto.
3.  Inspeccionar el entorno y confirmar versiones instaladas.
4.  Identificar contradicciones, riesgos y decisiones pendientes.
5.  Presentar un diagnóstico breve y un plan de Fase 0.
6.  No crear la aplicación completa ni avanzar de fase sin aprobación
    explícita.
7.  No poblar datos reales hasta que exista un formato de ingestión,
    procedencia y aprobación acordado.

**Prioridad inicial:** convertir estas reglas en un flujo de trabajo
reproducible. La calidad del Helper dependerá tanto de la calidad del
conocimiento como de la calidad del código.

------------------------------------------------------------------------

**FIN DEL PROTOCOLO COMPLEMENTARIO**\
*Operación Centinela --- La información es munición.*
