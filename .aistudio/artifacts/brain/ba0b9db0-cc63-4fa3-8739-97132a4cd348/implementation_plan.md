# Biseries por Rondas y Objetivos de Progresión

Esta actualización incorpora dos capacidades centrales a Gym Tracker manteniendo el 100% de compatibilidad con tu historial, rutinas existentes y diccionario maestro: la creación y ejecución de **Biseries (o circuitos de 2 o más ejercicios)** agrupadas por rondas sincronizadas, y la definición de **objetivos de peso y/o repeticiones para la próxima sesión** editables tanto en la plantilla como mientras entrenás.

---

### Revisión del Usuario y Decisiones Confirmadas

> [!IMPORTANT]
> Estas 4 decisiones fueron confirmadas previamente y definen el comportamiento de toda la implementación:

- **Ejecución durante el entrenamiento (por Rondas)**: Las biseries se mostrarán **agrupadas por ronda** (Ronda 1: Ej A + Ej B, Ronda 2: Ej A + Ej B, etc.) para cargar el circuito seguido sin tener que subir y bajar entre tarjetas.
- **Cantidad de series sincronizada**: La cantidad de rondas se define a nivel de la biserie (ej. 3 rondas) y sincroniza automáticamente la cantidad de series de todos los ejercicios incluidos en ella.
- **Nivel de los objetivos**: El peso y/o repeticiones objetivo funcionan a **nivel general del ejercicio** (puede cargarse solo peso, solo reps, ambos, o ninguno si no se usa en ese ejercicio).
- **Edición dual de objetivos**: Los objetivos pueden configurarse y actualizarse tanto desde el **editor de plantilla** como directamente desde la **tarjeta del ejercicio mientras entrenás** para dejarlo listo para la próxima vez.

---

### 1. Concepto General y Valor Principal

- **Qué resuelve**: A medida que el entrenamiento avanza, aparecen pares o tríos de ejercicios en una misma estación (biseries/triseries) donde una "serie" equivale a completar una vuelta de todos los ejercicios antes de descansar, junto con la necesidad de anotar metas concretas de sobrecarga progresiva (ej. apuntar a `12 reps` o `25 kg` la próxima vez).
- **Quién y cuándo lo usa**: En la preparación previa de la rutina (Editor de Plantilla) y en tiempo real durante la sesión en el gimnasio (Vista de Entrenamiento), además de quedar reflejado al compartir o respaldar reportes.
- **Valor clave**: Cero fricción al entrenar en circuitos (ves qué toca en cada ronda en un solo bloque) y continuidad total de tus datos pasados: los registros diarios siguen guardándose por ejercicio y número de serie, por lo que no perdés ni un solo dato histórico ni gráfico/reporte anterior.

---

### 2. Experiencia de Usuario y Diseño Visual

#### Flujos Principales

1. **Configurar una Biserie y Objetivos en el Editor de Plantilla**:
   - Dentro de una rutina, junto a "Añadir Ejercicio", aparece el botón **"Añadir Biserie"**.
   - Al crear o editar una biserie, podés definir su **número/nombre** (ej. `"Biserie 1"`), **cantidad de rondas** (control `- / +`), **notas técnicas de la biserie** (ej. `"3 rondas en la misma torre · pausa 60–90 s..."`) y sumar 2 o más ejercicios (ya sea creando/buscando del repositorio maestro o moviendo un ejercicio suelto existente hacia adentro de la biserie, o sacándolo de ella).
   - Cada ejercicio (suelto o dentro de una biserie) suma dos campos opcionales compactos de **Objetivo próxima vez**: `Peso obj. (kg)` y `Reps obj.` (acepta valores puntuales o rangos como `10-12`).
   - Las biseries y los ejercicios sueltos comparten la misma lista reordenable de la rutina para respetar el orden exacto de tu día.

2. **Entrenar con Biseries y Objetivos (Vista de Entrenamiento)**:
   - **Ejercicios individuales**: Conservan su tarjeta actual, sumando en la cabecera una línea de referencia clara cuando hay objetivo configurado (ej. `Objetivo: 25 kg · 10-12 reps`) con acceso directo de un toque para editarlo o definirlo ahí mismo mientras entrenás.
   - **Bloque de Biserie por Rondas**:
     - **Cabecera del bloque**: Muestra el nombre de la biserie (`Biserie 1`), cantidad de rondas y sus notas generales con tipografía limpia y contraste legible.
     - **Ficha compacta de cada ejercicio integrante**: Lista los ejercicios de la biserie con sus aclaraciones técnicas del maestro, fecha de su última sesión (`Últ. vez`), su **objetivo editable en vivo** y el campo de **nota de la sesión de hoy** de cada ejercicio.
     - **Grilla por Rondas (`Ronda 1`, `Ronda 2`, `Ronda 3`...)**: Cada ronda agrupa las filas de carga de todos los ejercicios del bloque (Ej A serie `#i`, Ej B serie `#i`...) con inputs grandes de toque cómodo (`Reps`, `Kg`, `Seg` si aplica, y el check de completado), mostrando justo debajo de cada fila el dato de la última vez para esa misma serie (`Historial`).

3. **Exportación, Reportes y Respaldo**:
   - **PDF de Plantillas de Rutinas**: Agrupa visualmente las biseries con una fila destacada que muestra nombre, rondas y notas de la biserie, seguida por sus ejercicios, series y columna de **Objetivo**.
   - **PDF de Evolución Diaria**: Identifica cuando un ejercicio pertenecía a una biserie y mantiene el detalle completo por serie de reps, peso, tiempo y notas.
   - **CSV de Evolución + Config**: Agrega columnas de `Biserie`, `Peso Objetivo` y `Reps Objetivo` al listado diario, manteniendo las secciones de respaldo de configuración y maestro al final del archivo.
   - **Backup JSON y Restauración**: Incluye automáticamente la definición de biseries y objetivos dentro de la configuración de rutinas, soportando importar tanto backups nuevos como anteriores sin errores.

#### Identidad Visual y Ergonomía Móvil

- **Estética coherente**: Se mantiene el tema oscuro de alto contraste existente (`#0d0d12` de fondo, superficies `slate-900` traslúcidas, acento `#00ff88` / esmeralda exclusivamente en acciones clave y estados activos).
- **Jerarquía limpia sin ruido**: Separación entre rondas y bloques mediante espacios amplios y divisores sutiles de `1px` (`border-white/10`), sin tarjetas anidadas recargadas, sin barras laterales gruesas ni cápsulas decorativas en metadatos estáticos (los objetivos y rondas se muestran con texto limpio y separadores `·`).
- **Ergonomía táctil**: Controles `- / +`, checks de ronda y botones de edición de objetivo con área táctil mínima de `44×44px` y cifras con ancho tabular (`tabular-nums`) para alinear pesos y repeticiones en la grilla.

---

### 3. Decisiones Clave de Producto y Compromisos

- **Decision 1 — Almacenamiento plano de ejercicios con vínculo a grupo (`supersetId`)**
  - *Enfoque elegido*: Mantener todos los ejercicios dentro del listado `exercises` de cada rutina y guardar los metadatos de cada biserie (nombre, rondas, notas) en un mapa auxiliar dentro de la misma rutina (`supersets`), vinculando cada ejercicio miembro mediante `supersetId`.
  - *Por qué*: Garantiza **cero ruptura** con el historial diario (`gym_log_*`), el Administrador del Maestro de Ejercicios, la detección de rutinas pasadas, el cálculo de "Última vez" y los backups previos. Si en el futuro sacás un ejercicio de una biserie, su historial de pesos y repeticiones sigue intacto porque el `id` del ejercicio nunca cambia.
  - *Alternativas descartadas*: Reemplazar `exercises` por un árbol anidado de "items y grupos". Eso habría obligado a migrar toda la estructura histórica y duplicar lógica en historial, maestro y dedup.

- **Decision 2 — Objetivos por ejercicio dentro de la rutina (no en el diccionario maestro global)**
  - *Enfoque elegido*: Guardar `targetWeight` y `targetReps` en el ejercicio dentro de cada rutina, mientras que las aclaraciones técnicas (`notes`) siguen sincronizadas con el Maestro de Ejercicios.
  - *Por qué*: Un mismo ejercicio (ej. *Curl Bayesian*) puede hacerse como ejercicio principal en una rutina con un peso/rango y dentro de una biserie de fatiga en otra rutina con otro objetivo.
  - *Alternativas descartadas*: Guardar los objetivos en el Maestro Global. Esto mezclaría metas de distintos contextos o intensidades.

- **Decision 3 — Campos de objetivo flexibles (texto numérico corto)**
  - *Enfoque elegido*: Permitir tanto un número puntual (`22.5`, `12`) como un rango (`10-12`) en los objetivos de repeticiones/peso, manteniendo los campos vacíos por defecto cuando no se usan.
  - *Por qué*: En tu propio ejemplo de rutina usás rangos como `10–12 rep`, y aclaraste que no siempre lo vas a usar en todos los ejercicios.

---

### 4. Arquitectura Técnica y Estrategia de Datos

#### Diagrama de Arquitectura y Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Almacenamiento Local (localStorage)                  │
│  • Rutinas: RoutineConfig (exercises[] con supersetId y targets +       │
│             supersets: Record<id, SupersetGroup>)                       │
│  • Logs Diarios: DayLog por fecha (sin cambios de formato por serie)    │
│  • Maestro de Ejercicios: notas técnicas globales por ejercicio         │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│        Editor de Plantilla            │ │     Vista de Entrenamiento    │
│  • Reordenamiento unificado de        │ │  • Agrupador visual de bloques│
│    bloques (ejercicios y biseries)    │ │    (sueltos vs biseries)      │
│  • Crear/editar Biserie (nombre,      │ │  • Tarjeta de Ejercicio       │
│    rondas sincronizadas, notas)       │ │    individual + objetivo      │
│  • Mover ejercicios dentro/fuera      │ │  • Tarjeta de Biserie por     │
│  • Configurar peso/reps objetivo      │ │    Rondas (Ronda 1..N con     │
└───────────────────┬───────────────────┘ │    todos los ej. del par/trío │
                    │                     │    y edición rápida de metas) │
                    └──────────┬──────────┘ └──────────────┬────────────────┘
                               │                           │
                               ▼                           ▼
                  ┌──────────────────────────────────────────┐
                  │       Motor de Exportación / Backup      │
                  │  • PDF Plantillas (bloques de biserie +  │
                  │    columna de objetivos)                 │
                  │  • PDF / CSV Diario (etiqueta de biserie │
                  │    y columnas de objetivo)               │
                  │  • JSON Backup & Restore retrocompatible │
                  └──────────────────────────────────────────┘
```

#### Modelo de Datos

- **Ejercicio en Rutina**: Extiende la estructura actual agregando campos opcionales `supersetId`, `targetWeight` y `targetReps`.
- **Grupo Biserie (`SupersetGroup`)**: `{ id, name, rounds, notes }`, almacenado en `routine.supersets[supersetId]`. Al modificar `rounds`, se actualizan automáticamente las `sets` de todos los ejercicios vinculados a ese `supersetId`.
- **Bloques de Renderizado**: Función pura de agrupación que recorre los ejercicios activos en orden; los ejercicios consecutivos con el mismo `supersetId` se renderizan juntos como un bloque `BiserieCard` (en entrenamiento) o un bloque editable agrupado (en el editor de plantilla), y los que no tienen `supersetId` se renderizan como tarjetas individuales.

#### Mapeo de Interacciones y Estado

- **Crear / Editar Biserie**: Genera un `supersetId`, crea su registro en `routine.supersets` con rondas iniciales (por defecto `3`), permite agregar ejercicios desde el modal existente (sincronizándoles `sets = rounds` y asignándoles `supersetId`) o vincular ejercicios ya presentes en la rutina, y permite reordenar el bloque completo o los ejercicios internos.
- **Editar Objetivo en Vivo (Entrenamiento)**: Cada tarjeta individual y cada encabezado de ejercicio dentro de una biserie expone un disparador compacto para editar `targetWeight` / `targetReps`, propagando el cambio inmediatamente a `routineConfig` y `localStorage` sin tocar el log del día actual.
- **Cargar Ronda en Biserie**: Cada input de la `Ronda i` actualiza directamente `dayLog[ex.id][i]` a través de los mismos manejadores de registro y completado existentes, preservando historial previo por serie y detección de cambios en el día.
- **Importación y Deduplicación**: Los archivos JSON/CSV anteriores sin `supersets` ni objetivos se cargan sin migración forzosa, y la exportación CSV preserva la compatibilidad de lectura para respaldos viejos y nuevos.
