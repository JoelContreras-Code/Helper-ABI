# Documentación — Operación Centinela (Helper-ABI)

> Fuente única de verdad del proyecto. Versión consolidada 2.0 · 06/11/2026.
> Los tres documentos originales (v1.0) se conservan sin cambios en
> [`archive/original/`](archive/original/) solo como referencia histórica.

## Orden de lectura

| # | Documento | Qué responde |
| --- | --- | --- |
| 1 | [01-vision.md](01-vision.md) | ¿Qué construimos, para quién y con qué límites? |
| 2 | [02-architecture.md](02-architecture.md) | ¿Con qué tecnología y cómo se conectan las piezas? |
| 3 | [03-data-governance.md](03-data-governance.md) | ¿Cómo se verifica, guarda y aprueba un dato del juego? |
| 4 | [04-data-model.md](04-data-model.md) | ¿Qué tablas y relaciones tendrá la base de datos? *(propuesta)* |
| 5 | [05-sources.md](05-sources.md) | ¿De dónde sale la información y cómo se extrae? |
| 6 | [06-intel-pipeline.md](06-intel-pipeline.md) | ¿Cómo se sincroniza, clasifica y resume la información? |
| 7 | [07-forensic.md](07-forensic.md) | ¿Cómo se analiza una captura de muerte? |
| 8 | [08-roadmap.md](08-roadmap.md) | ¿En qué orden se construye y cuándo una fase está terminada? |
| 9 | [09-research-prompts.md](09-research-prompts.md) | Prompts para investigar con IAs que tienen búsqueda web |
| 10 | [10-decisions.md](10-decisions.md) | Decisiones tomadas y decisiones pendientes |

Además:

- [`adr/`](adr/): registros de decisiones de arquitectura (por qué elegimos algo).
- [`reports/`](reports/): informes de cierre de cada fase.
- [`/CLAUDE.md`](../CLAUDE.md): reglas operativas para Claude (resumen accionable).

## Jerarquía cuando algo no cuadra

1. Lo que el operador decide explícitamente (registrado en `10-decisions.md` o un ADR).
2. Estos documentos consolidados (`01` a `10`).
3. Los originales en `archive/original/` (solo contexto; no mandan).

Si dos documentos consolidados se contradicen, **es un error de documentación**:
Claude se detiene, lo señala y propone la corrección. No elige en silencio.

## Convenciones de estos documentos

- Contenido en español; nombres de archivos, código, tablas y campos en inglés.
- Cada dato del juego que aparezca aquí es **ejemplo** salvo que diga lo contrario.
  Los datos reales viven en la base de datos con su evidencia, no en la documentación.
- Etiquetas de estado: ✅ confirmado · ⚠️ con reservas · ❌ descartado · ⏳ pendiente.
