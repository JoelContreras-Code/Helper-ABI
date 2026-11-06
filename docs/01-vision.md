# 01 · Visión, alcance y límites

## 1. Misión

**Situación:** el operador perdió economía en el juego (de 20M a 2M) por falta de
información actualizada sobre munición, builds, cambios de parche y tácticas.

**Misión:** construir una aplicación que recolecte, verifique y resuma automáticamente
información pública del juego, usando un modelo de IA **local** (sin costo de tokens).

**Resultado esperado:**

1. Un **Parte de Inteligencia** diario: cambios de parche, munición recomendada, builds
   económicas, tips tácticos y alertas del meta.
2. Un **panel web** para consultar noticias, datos de munición/armaduras, registrar raids
   y analizar capturas de muerte.

## 2. Perfil del operador (configurable, no fijo en el código)

Estos valores viven en la configuración de la app (no en prompts escritos a mano),
porque cambian con el tiempo:

| Campo | Valor inicial |
| --- | --- |
| Arma principal | Rifle tirador M110 (7.62x51) |
| Nivel de munición habitual | 4 |
| Nivel de equipo habitual | 4 |
| Economía | Limitada (~2M) |
| Idioma de presentación | Español |

## 3. Objetivos

| Código | Objetivo | Prioridad | Dónde se detalla |
| --- | --- | --- | --- |
| OBJ-01 | Recolectar notas de parche y noticias oficiales | Alta | 05, 06 |
| OBJ-02 | Obtener datos técnicos de munición y armadura con evidencia | Alta | 03, 05 |
| OBJ-03 | Discusión comunitaria (Reddit) | Baja ⚠️ | 05 §3 (solo consulta manual) |
| OBJ-04 | Registrar videos de canales seleccionados (YouTube Data API) | Media | 05 §2.4, 06 |
| OBJ-05 | Clasificar y resumir con LLM local (LM Studio) | Alta | 06 |
| OBJ-06 | Generar el Parte de Inteligencia diario | Alta | 06 |
| OBJ-07 | Guardar histórico en BD local con procedencia | Alta | 03, 04 |
| OBJ-08 | Detectar cambios del meta entre informes | Baja | 06 |
| OBJ-09 | Analizar capturas de muerte (forense) | Media | 07 |
| OBJ-10 | Registrar raids y economía personal | Media | 04, 08 |

## 4. Fuera de alcance (prohibido)

- Leer memoria, archivos, procesos o tráfico del juego.
- Usar cuenta, SDK o tokens de sesión de Level Infinite (viola el EULA).
- Overlays, Overwolf, Cheat Engine o cualquier cosa que corra junto al juego.
- Análisis en tiempo real de la partida.
- Eludir protecciones anti-bot de sitios web.
- Datos de Arena Breakout móvil o Escape from Tarkov.
- Uso comercial o redistribución del contenido recolectado.

## 5. Mejoras futuras (backlog, sin fecha)

1. **Calculadora de duelo:** munición propia vs. casco/chaleco enemigo, usando solo
   mecánicas verificadas (ver 03 §7.1). Si falta un dato, muestra "desconocido".
2. **Notificaciones:** enviar el Parte de Inteligencia por Discord o Telegram.
3. **Diario de muertes con patrones:** "el 60 % de tus muertes son por la cabeza".
4. **Comparador de meta:** qué armas y munición suben o bajan semana a semana.
5. **Análisis de grabaciones de OBS** después de la partida (fase F-6).
6. **Tier list propia** calculada, separada de las tier lists de creadores y con su fórmula visible.
