# ADR-0003 · Migraciones con Umzug en lugar de sequelize-cli

- **Estado:** Aceptado
- **Fecha:** 06/11/2026
- **Decisores:** Claude (técnica), aprobado por el operador al aprobar la Fase 2

## Contexto

La especificación original pedía `sequelize-cli` con un `.sequelizerc`. Al revisarlo
(06/11/2026), `sequelize-cli` 6.6.5 depende de **umzug 2**, `yargs` 16 y `fs-extra` 9
(versiones antiguas), escribe migraciones solo en JavaScript y se usa únicamente por
línea de comandos, lo que dificulta probar migraciones de forma automática.

## Decisión

Usar **Umzug 3.8** directamente: es la misma librería de migraciones que `sequelize-cli`
usa por dentro, en su versión actual.

- Migraciones y seeders en **TypeScript** (`apps/api/src/migrations`, `src/seeders/{base,dev}`).
- Historial de migraciones en la tabla `SequelizeMeta` (mismo nombre que usa sequelize-cli).
- Seeders `dev` con historial propio (`SequelizeDevSeeds`) para poder deshacerlos.
- Seeders `base` sin historial: son *upserts* idempotentes que se ejecutan siempre.
- CLI propio pequeño: `apps/api/src/db/cli.ts` (`pnpm db:*`).
- No existe `.sequelizerc`.

Alternativas consideradas: `sequelize-cli` (la de la spec; descartada por lo anterior) y
cambiar de ORM (Prisma, Drizzle; descartado: la spec fija Sequelize y no hace falta).

## Consecuencias

- ➕ Las migraciones se prueban en Vitest (subir → bajar todo → subir otra vez).
- ➕ Tipos de TypeScript en migraciones y seeders; mismas dependencias actuales.
- ➕ El mismo historial sirve para el código fuente (`.ts`) y el compilado (`.js`).
- ➖ Los comandos de `sequelize-cli` (`npx sequelize db:migrate`) no existen; se usan los `pnpm db:*`.
