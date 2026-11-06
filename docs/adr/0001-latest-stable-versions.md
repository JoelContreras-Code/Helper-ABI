# ADR-0001 · Usar las últimas versiones estables

- **Estado:** Aceptado
- **Fecha:** 06/11/2026
- **Decisores:** operador (política), Claude (aplicación técnica)

## Contexto

La especificación original pedía Node 22 y Python 3.11+. El operador pidió usar "lo
último de lo último, nada antiguo". Al 06/11/2026 hay versiones más nuevas, pero algunas
son prerelease o rompen la compatibilidad con otras piezas del stack.

## Decisión

Usar la **última versión estable o LTS** de cada herramienta, con versión exacta fijada:

- **Node.js 26 LTS** (en lugar de 22).
- **Python 3.15** (en lugar de 3.11). Las librerías previstas publican paquetes para 3.15 (comprobado en PyPI).
- **pnpm 12**, React 19, Vite 8, Tailwind 4, Express 5, Zod 4, ESLint 10, Vitest 5.
- **TypeScript 6.0.3**, no 7.0: `typescript-eslint` 8.72 declara soporte `>=4.8.4 <6.1.0`.
  Cuando soporte TS 7, se actualiza en un commit aparte.
- **Sequelize 6.37**: Sequelize 7 sigue en `alpha` (7.0.0-alpha.48).
- **uv** para Python (entornos y dependencias con *lockfile*, mucho más rápido que pip).
  Alternativas consideradas: `venv` + `pip` (estándar, más lento y sin lockfile nativo),
  Poetry (más pesado). Se elige uv por velocidad, lockfile reproducible y porque también
  instala la versión de Python correcta.

Nunca: `alpha`, `beta`, `rc`, `nightly` ni etiquetas `latest` sin fijar (incluidas imágenes Docker).

## Consecuencias

- ➕ Mejor rendimiento, soporte más largo y menos migraciones futuras.
- ➖ Las combinaciones muy nuevas pueden tener incompatibilidades poco documentadas.
  Mitigación: cada fase valida con `install`, `lint`, `typecheck` y `test`.
- ➖ El equipo del operador necesita instalar Node 26 y Python 3.15 (Fase 1, `scripts/setup.ps1`).
