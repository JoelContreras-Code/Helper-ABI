# 03 · Gobernanza de datos del juego

Cómo entra, se verifica, se aprueba y se conserva un dato. Este documento manda sobre
cualquier atajo técnico: **la calidad del Helper depende de la calidad del conocimiento**.

## 1. Principios no negociables

1. **Juego correcto:** solo Arena Breakout: Infinite de PC (MoreFun Studios / Level Infinite).
2. **Evidencia antes que afirmaciones:** todo dato tiene fuente rastreable o queda marcado como no verificado.
3. **No inventar:** lo desconocido queda `null`. No se completa por intuición ni con datos de otro juego.
4. **Separación de roles:** Claude y el LLM implementan y procesan; **el operador aprueba**.
5. **Historial preservado:** actualizar nunca borra el valor anterior ni su procedencia.
6. **Tolerancia a fallos:** una fuente caída no detiene a las demás.
7. **Seguridad del juego:** cero interacción con cliente, memoria, archivos, tráfico, cuenta o anticheat.

## 2. Identificación de la fuente

Antes de extraer, confirmar: juego = *Arena Breakout: Infinite*, plataforma = PC,
y si la fuente lo indica: región, temporada, parche y fecha.
Si no se puede confirmar que es la versión de PC → `version_uncertain` y sus cifras
**no** pasan a datos confirmados.

### Niveles de confianza de la fuente

| Nivel | Tipo | Uso |
| --- | --- | --- |
| **A** | Oficial: notas de parche, anuncios, sitio oficial, Steam | Evidencia primaria de cambios oficiales |
| **B** | Base de datos o wiki comunitaria con datos verificables | Referencia técnica; debe contrastarse |
| **C** | Pruebas propias reproducibles (capturas, mediciones) | Evidencia empírica; documentar el método |
| **D** | Creadores y guías identificables | Opiniones y estrategias atribuidas |
| **E** | Comentarios, foros, posts aislados | Pistas que requieren corroboración |

El nivel no vuelve verdadero un dato: incluso una fuente A se vincula al dato concreto que respalda.

## 3. Estados de verificación (vocabulario cerrado)

| Estado | Significado |
| --- | --- |
| `pending` | Recolectado, sin revisar (estado inicial de **todo** lo automático) |
| `verified` | Respaldado por evidencia suficiente y aprobado por el operador |
| `corroborated` | Contrastado con ≥ 1 fuente **independiente** (copiar a otra no cuenta) |
| `disputed` | Fuentes confiables con valores incompatibles (se guardan ambos) |
| `unverified` | Sin evidencia suficiente |
| `obsolete` | Fue válido; ya no es vigente |
| `rejected` | Incorrecto o de otro juego/versión |

Reglas:

- Un resumen de IA **nunca** cambia `pending`/`unverified` a `verified`.
- La IA puede detectar contradicciones y **proponer** correcciones; no aprobar.
- Si dos fuentes discrepan: conservar ambos valores y abrir una tarea de revisión. **Nunca promediar.**
- Para daño, penetración, durabilidad, precios y estadísticas de armas: evidencia específica obligatoria.

Estado de procesamiento (independiente del de verificación) para contenido recolectado:
`new` → `classified` → `summarized` · o `needs_review` · o `failed`.

## 4. Evidencia

Cada dato relevante se relaciona con una o varias evidencias:

`source_id`, `source_url`, `retrieved_at`, `published_at` (si existe),
`excerpt` (extracto breve o referencia a tabla/sección), `evidence_type`
(`official` · `database` · `measurement` · `community` · `video` · `other`),
`game_version`, `confidence_status`, `reviewed_by`, `reviewed_at`.

Guardar extractos breves, no artículos completos (derechos de autor y términos de uso).

## 5. Modelo temporal

Todo dato que pueda cambiar con un parche lleva, cuando la evidencia lo permita:
`season`, `patch_version`, `valid_from`, `valid_until`, `observed_at`, `last_verified_at`.

1. No asumir que el dato actual vale para temporadas anteriores.
2. Un cambio de parche registra el valor anterior **y** el nuevo.
3. Temporada/parche desconocidos → se marca desconocido; **no** se infiere por la fecha de consulta.
4. Distinguir `published_at` (publicación), `retrieved_at` (consulta) y vigencia.
5. Datos sin vigencia confirmada se pueden mostrar, con advertencia visible en la UI.

## 6. Tres tipos de información (no se mezclan)

| Tipo | Ejemplos | Característica |
| --- | --- | --- |
| **Datos maestros** | Armas, munición, armaduras, médicos, mapas, extracciones, comerciantes | Identidad estable |
| **Observaciones** | Precios, disponibilidad, estadísticas por versión, resultados de pruebas | Valor + fecha + contexto + fuente + versión |
| **Análisis** | Builds recomendadas, costo/rendimiento, tácticas, tendencias, causa probable de muerte | Conclusión derivada; enlaza los datos que la sustentan; se etiqueta como análisis |

## 7. Reglas por dominio

### 7.1 Munición y balística

- **Prohibido** reducir la balística a reglas universales tipo "penetración 5 siempre atraviesa armadura 4".
- El motor de reglas implementa **solo** mecánicas documentadas y verificadas
  (pueden influir durabilidad, zona, distancia, impactos previos…).
- Campos por munición (si hay evidencia): nombre, alias, calibre, nivel de penetración,
  daño a carne, daño a armadura, velocidad, compatibilidad, precio con contexto, parche, fuente, estado.
- Si falta una propiedad: la calculadora muestra **"desconocido"**. No fabrica probabilidades ni número de tiros.

### 7.2 Armaduras y cascos

Distinguir nivel, durabilidad máxima, durabilidad actual, zonas cubiertas, material,
penalizaciones, precio, versión y evidencia. Dos piezas del mismo nivel no protegen
necesariamente igual. No afirmar cobertura de una zona sin evidencia.

### 7.3 Precios y economía

Un precio es una **observación**, no un atributo del objeto: moneda, valor, mercado o
comerciante, región/servidor, fecha y hora, cantidad, condición, impuestos/comisiones, fuente.
No comparar precios de contextos distintos. Las recomendaciones económicas declaran presupuesto y contexto.

### 7.4 Builds y meta

Cada build: arma base, accesorios, costo estimado y fecha, propósito (económica/equilibrada/competitiva),
modo y mapa, distancia de combate, fuente, evidencia, limitaciones.
Una build de creador se **atribuye** al creador; un post popular no la convierte en "meta".

### 7.5 Tier lists

Cada ranking externo conserva autor, URL, fecha, temporada, modo, tier por arma,
explicación y fecha de captura. Nunca se fusionan en una única tier list. La UI puede
compararlas mostrando desacuerdos. Una tier list propia (futuro) es una vista separada con fórmula visible.

### 7.6 Mapas y tácticas

Separar hechos verificables (extracciones, condiciones, nombres de zonas) de consejos
(rutas, posiciones, zonas calientes). Cada guía indica mapa, modo, fecha, fuente y confianza.

## 8. Contrato de ingestión (conceptual)

La forma definitiva se implementa con Zod en la API (Fase 2). Ejemplo de **observación**:

```json
{
  "entity_type": "ammo",
  "entity_key": "ammo:7.62x51:example_round",
  "field": "penetration_level",
  "value": 4,
  "unit": "level",
  "game": "Arena Breakout: Infinite",
  "platform": "PC",
  "season": null,
  "patch_version": null,
  "source_key": "abi_field_index",
  "source_url": "https://example.com/reference",
  "retrieved_at": "2026-11-06T12:00:00Z",
  "published_at": null,
  "excerpt": "Table 'Ammo 7.62x51', row 'Example'",
  "verification_status": "pending",
  "notes": "Pending cross-check"
}
```

Reglas:
- Claves estables (`entity_key`); nunca depender solo del nombre traducido.
- Nombres originales, localizados y alias en tabla aparte.
- Unidades explícitas; validación de tipos, rangos y obligatorios.
- Se **rechaza** cualquier registro sin `game` = Arena Breakout: Infinite y `platform` = PC.
- Duplicados: se evitan con claves naturales / IDs estables (ver 06 §3).
- La API es la única que valida y persiste.

## 9. Flujo de conocimiento (de la pregunta a la base)

1. **Definir pregunta** → 2. **Localizar fuentes** (PC, versión relevante) → 3. **Extraer** sin reinterpretar →
4. **Normalizar** nombres, unidades, versiones → 5. **Contrastar** → 6. **Revisar** (confirmados / pendientes / dudosos / rechazados) →
7. **Aprobar** (operador) → 8. **Entregar** paquete → 9. **Importar** (Claude) → 10. **Comprobar** conteos, relaciones y duplicados.

### Paquete de conocimiento (`data/knowledge/<domain>-<YYYYMMDD>.json`)

Debe incluir: objetivo, fecha de investigación, juego/plataforma, temporada/parche,
fuentes consultadas, registros normalizados, pendientes/disputados, cambios respecto al
lote anterior y responsable de aprobación. Un lote con campos críticos sin verificar **no** se presenta como completo.
El formato JSON exacto se fija antes de la Fase 5 (decisión pendiente P-09).

## 10. Etiquetas obligatorias en informes de IA

| Etiqueta | Uso |
| --- | --- |
| **HECHO VERIFICADO** | Respaldado por evidencia aprobada |
| **OBSERVACIÓN COMUNITARIA** | Reportado por jugadores o creadores |
| **ANÁLISIS** | Interpretación del sistema con los datos disponibles |
| **RECOMENDACIÓN** | Acción sugerida, con contexto y limitaciones |
| **DATO DESCONOCIDO** | No se pudo confirmar |

Cada informe registra: fecha/hora, versión de la app, modelo usado, periodo y fuentes
analizadas, registros consultados y limitaciones. El LLM no rellena huecos con
conocimiento general: si el contexto no alcanza, lo declara.

## 11. Criterios de aceptación de datos

- Un registro aprobado tiene procedencia.
- Un registro pendiente nunca se muestra como confirmado.
- Una cifra dinámica muestra cuándo y en qué contexto se observó.
- Una discrepancia no se oculta con promedios.
- Un dato obsoleto no aparece como vigente sin advertencia.
- Los informes identifican fuentes y separan hechos de recomendaciones.
