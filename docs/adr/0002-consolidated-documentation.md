# ADR-0002 · Documentación consolidada

- **Estado:** Aceptado
- **Fecha:** 06/11/2026
- **Decisores:** operador

## Contexto

Había tres documentos (especificación, protocolo complementario e investigación de
fuentes) con al menos 10 contradicciones entre sí (ver [10-decisions.md §2](../10-decisions.md)),
información repetida y una copia duplicada de la especificación en la raíz. El protocolo
original prohibía reescribirlos, pero el operador pidió explícitamente reorganizarlos.

## Decisión

- Crear una documentación consolidada (v2.0) en `docs/01…10`, un archivo por tema,
  sin contradicciones y con las decisiones aplicadas.
- Conservar los tres originales **sin modificar** en `docs/archive/original/`, solo como historia.
- Añadir `CLAUDE.md` en la raíz con las reglas operativas resumidas.
- Las decisiones viven en `docs/10-decisions.md`; las de arquitectura, además, en ADRs.

## Consecuencias

- ➕ Una sola fuente de verdad por tema, fácil de seguir para el operador y para Claude.
- ➕ No se pierde información: los originales siguen disponibles.
- ➖ Hay que mantener los documentos al día cuando cambie una decisión (se actualiza el
  documento del tema + `10-decisions.md` en el mismo commit).
