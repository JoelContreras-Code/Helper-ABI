# 07 · Módulo forense (análisis de muertes por imagen)

El operador sube una captura de su muerte y Centinela responde qué lo mató, por qué su
equipo no aguantó y qué debió llevar. **No se entrena ningún modelo**: un modelo de
visión local lee la imagen y la base de conocimiento aporta los datos.

**Regla:** siempre **después** de la partida, sobre capturas o grabaciones guardadas.
Nunca sobre el juego en ejecución.

## 1. Flujo

```text
Captura (PNG/JPG)
      │
      ▼
[1] LECTOR VISUAL ── modelo de visión en LM Studio (+ OCR si hace falta)
      │   extrae a JSON: arma rival, munición, zonas dañadas, distancia,
      │   equipo propio, vida, médicos del inventario
      ▼
[2] VALIDADOR ── busca cada nombre en game_entities + entity_aliases
      │   (coincidencia aproximada con rapidfuzz; umbral configurable)
      │   sin coincidencia segura → "no identificado", nunca se adivina
      ▼
[3] MOTOR DE REGLAS ── compara munición rival vs armadura/casco propio
      │   usando SOLO mecánicas verificadas (03 §7.1)
      │   dato faltante → resultado "desconocido"
      ▼
[4] ASESOR (LLM) ── redacta el informe con los datos validados y etiquetas
      ▼
INFORME FORENSE (Markdown) → tabla deaths + reports
```

## 2. Qué detecta y qué aconseja

| Elemento | Ejemplo de detección | Ejemplo de consejo |
| --- | --- | --- |
| Arma del rival | Nombre leído de la pantalla | Calibre y alcance según la base |
| Munición del rival | Nombre → nivel de penetración **según la base** | Comparación con tu protección, si la mecánica está verificada |
| Zonas dañadas | Cabeza, tórax | "Murió por la cabeza: revisa tu casco" |
| Tu equipo | Casco y chaleco | Mejora mínima por costo (con precio observado y su fecha) |
| Médicos | Lo que llevabas y lo que no | Kit sugerido según la base |
| Contexto | Distancia, número de rivales | Error táctico probable, etiquetado como **ANÁLISIS** |

## 3. Ejemplo de informe (formato; los valores son ilustrativos)

```text
INFORME FORENSE #014 — 2026-11-06
CAUSA: [HECHO] Impacto en la cabeza · distancia ~80 m (leída de la captura)
ARMA RIVAL: [HECHO] <arma> · MUNICIÓN: <munición> (penetración: <según base | DATO DESCONOCIDO>)
TU PROTECCIÓN: Casco nivel 4
EVALUACIÓN: [ANÁLISIS] <solo si la mecánica está verificada; si no: "no se puede determinar">
MÉDICOS: Sin estimulantes · Sin analgésico
ACCIONES:
  1. [RECOMENDACIÓN] ...
LIMITACIONES: <campos no leídos, datos sin verificar>
```

## 4. Base de conocimiento necesaria

Se llena con el flujo de [03 §9](03-data-governance.md) (prompts de investigación R-1 a R-3 +
fuentes técnicas) y vive en la BD (`game_entities`, `stat_observations`, `entity_aliases`).
Los paquetes aprobados se guardan como JSON en `data/knowledge/`.

## 5. Fases del módulo

| Fase | Nombre | Entregable |
| --- | --- | --- |
| F-1 | **OJO** | Leer una captura y devolver JSON (prueba con capturas reales del operador) |
| F-2 | **ARCHIVO** | Base de conocimiento poblada y validada (depende de Fase 5) |
| F-3 | **JUICIO** | Motor de reglas con mecánicas verificadas y pruebas reproducibles (decisión P-10) |
| F-4 | **VEREDICTO** | Informe forense completo desde una captura |
| F-5 | **PATRONES** | Resumen semanal de causas de muerte |
| F-6 | **CINE** (futuro) | Clips de OBS: fotogramas cada 2 s de los últimos 15 s |

## 6. Notas técnicas

- Modelo de visión: Qwen2.5-VL 7B como punto de partida; en la Fase 6 se comparan
  modelos de visión más recientes que quepan en 8 GB de VRAM (RX 6600, Vulkan).
- OCR: se evalúa en la Fase 6 si el modelo de visión basta o hace falta un OCR dedicado
  (EasyOCR depende de PyTorch, que es pesado; alternativas: RapidOCR/ONNX). No se instala hasta entonces.
- Seguridad de subida: ver [02 §7](02-architecture.md).
