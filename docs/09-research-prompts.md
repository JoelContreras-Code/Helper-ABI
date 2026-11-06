# 09 · Prompts de investigación para IAs con búsqueda web

Sirven para Claude con búsqueda, Gemini, Perplexity o ChatGPT. Su resultado es
**materia prima** para el flujo de [03 §9](03-data-governance.md): todo entra como
`pending` y lo aprueba el operador. Nunca se carga directo a la base.

## Flujo

1. Ejecutar R-1 a R-7 en una IA.
2. Pasar cada resultado por **R-8 en una IA distinta**.
3. Guardar solo lo confirmado, con sus fuentes, como paquete en `data/knowledge/`.

| Juego | Plataforma | Uso |
| --- | --- | --- |
| **Arena Breakout: Infinite** | PC | ✅ El único que nos interesa |
| Arena Breakout | Móvil (iOS/Android) | ❌ Descartar: estadísticas y munición distintas |
| Escape from Tarkov | PC | ❌ Descartar: juego distinto (creadores como Pestily o Lvndmark son de Tarkov) |

## Regla de identificación (pegar al inicio de cada prompt)

```text
REGLA CRÍTICA: Investiga SOLO "Arena Breakout: Infinite" (versión de PC, MoreFun Studios / Level Infinite). NO uses datos de "Arena Breakout" (versión móvil) ni de "Escape from Tarkov": sus armas, munición, precios y mecánicas son distintos. Por cada dato, indica la fuente (URL exacta) y confirma que es de la versión de PC. Si una fuente no aclara la versión, márcala como "VERSIÓN DUDOSA". Prioriza información de los últimos 3 meses e indica la fecha y la temporada o parche de cada dato. Si no encuentras un dato, escribe "NO ENCONTRADO". No inventes URLs, cifras ni nombres.
```

## R-1 · Munición y balística

```text
[REGLA CRÍTICA]
Compila la tabla completa de munición actual de Arena Breakout: Infinite. Por cada bala: calibre, nombre, nivel de penetración, daño a la carne, daño a la armadura, velocidad, precio aproximado (indicando mercado o comerciante, región y fecha) y en qué tienda o nivel de comerciante se compra. Destaca el calibre 7.62x51 (M110). Entrega una tabla Markdown por calibre y cita la fuente de cada fila. Explica también, con fuente, cómo funciona la mecánica de penetración frente a armadura (si existe documentación oficial o pruebas reproducibles).
```

## R-2 · Armaduras, cascos y zonas

```text
[REGLA CRÍTICA]
Compila los chalecos, chalecos tácticos con placas y cascos de Arena Breakout: Infinite: nivel de protección, durabilidad, zonas que cubren (cabeza, cara, oídos, cuello, tórax, abdomen), material, penalizaciones de movimiento y ergonomía, y precio con contexto. Explica cómo funcionan la penetración, el daño por contundencia y la pérdida de durabilidad, citando la fuente de cada explicación. Tabla Markdown con fuentes.
```

## R-3 · Médicos y estimulantes

```text
[REGLA CRÍTICA]
Compila los objetos médicos de Arena Breakout: Infinite: botiquines, vendas, torniquetes, férulas, analgésicos, cirugía y jeringas o estimulantes. Por cada uno: efecto exacto, duración, efectos secundarios, tiempo de uso, precio con contexto y cuándo conviene usarlo. Recomienda un kit mínimo para poca economía y otro de alto nivel, separando claramente datos (con fuente) de recomendaciones.
```

## R-4 · Armas y builds

```text
[REGLA CRÍTICA]
Compila las armas de Arena Breakout: Infinite con calibre, cadencia, retroceso y alcance efectivo. Luego da builds atribuidas a creadores o guías reales (nombre, URL, fecha, temporada) para: (1) M110 y otros rifles de tirador, (2) rifles de asalto baratos, (3) opciones por debajo de 300.000 Koen. Indica el costo con fecha.
```

## R-5 · Mapas, posiciones y rutas

```text
[REGLA CRÍTICA]
Por cada mapa actual de Arena Breakout: Infinite (con modos y niveles de dificultad), separa: (a) HECHOS: extracciones y sus condiciones, nombres de zonas; (b) CONSEJOS: zonas calientes, posiciones de tirador, rutas de entrada y salida, errores comunes. Cita guías y videos reales con fecha.
```

## R-6 · Interfaz y pantalla de muerte

```text
[REGLA CRÍTICA]
Describe qué información muestra Arena Breakout: Infinite en la pantalla de muerte o resumen de raid (arma y munición del asesino, partes del cuerpo dañadas, distancia, equipo del rival, etc.) y en el HUD. Enlaza capturas de pantalla reales con su fecha. Servirá para diseñar un analizador de capturas.
```

## R-7 · Economía y mercado

```text
[REGLA CRÍTICA]
Explica la economía actual de Arena Breakout: Infinite: seguro de equipo, comerciantes, mercado de jugadores, impuestos, objetos de mayor valor por espacio y estrategias para recuperar dinero desde 2 millones de Koen. Indica región/servidor y fecha de cada precio. Separa datos (con fuente) de recomendaciones.
```

## R-8 · Verificador cruzado

```text
[REGLA CRÍTICA]
Te paso un informe generado por otra IA sobre Arena Breakout: Infinite. Verifica cada URL, cada cifra y cada nombre de creador. Marca cada dato como CONFIRMADO (con la fuente donde lo comprobaste), INCORRECTO (con la corrección y su fuente) o NO VERIFICABLE. Señala cualquier dato que venga de la versión móvil o de Escape from Tarkov.
[PEGAR INFORME AQUÍ]
```

## Alertas conocidas del informe externo original (Gemini, 06/11/2026)

- Varios creadores citados eran de Escape from Tarkov o no se pudieron confirmar.
- Las asignaciones de nivel de la tabla 7.62x51 (M80, M61, M62) son dudosas: **no usar**.
- Afirmaciones sobre duración de baneos y detalles del anticheat ACE: no verificadas.
