# services · Workers de Python

| Carpeta | Qué hará | Fase |
| --- | --- | --- |
| `common/` | Configuración compartida, cliente de la API y del LLM, cliente HTTP con pausas | 1 (config) · 4 |
| `recon/` | Conectores de fuentes y runner de sincronización | 4 |
| `forensic/` | Análisis de capturas de muerte | 6 |

Reglas: los workers **nunca** escriben en la base de datos; envían JSON a la API
(`POST /api/ingest`). Ver [docs/02-architecture.md](../docs/02-architecture.md).

Comandos (desde la raíz del proyecto):

```powershell
pnpm py:sync   # install dependencies (uv)
pnpm py:test   # run pytest
pnpm py:lint   # ruff lint + format check
```
