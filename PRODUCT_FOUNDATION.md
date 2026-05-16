# GuateVigila — Product Foundation Document

> Versión 1.0 · Mayo 2026 · hack@latam — Transparency & Corruption track

---

## El problema

Los datos de contratación pública en Guatemala existen y son públicos. El Ministerio de Finanzas los publica en formato abierto. Pero **publicar datos no es lo mismo que hacer preguntas incómodas sobre ellos.**

Los periodistas guatemaltecos que investigan corrupción lo hacen manualmente — nombre por nombre, contrato por contrato. Una investigación que debería tomar horas de análisis les toma semanas de trabajo humano. Prensa Comunitaria analizó "cientos de documentos" para su investigación de carreteras de Giammattei. Ojoconmipisto construyó una lista de 199 nombres y los buscó uno por uno en Guatecompras para investigar contratos deportivos. Nadie tiene una herramienta que haga esto automáticamente.

El resultado: **la corrupción sistemática es invisible no porque los datos estén ocultos, sino porque nadie los ha interrogado a escala.**

---

## Qué resuelve GuateVigila

GuateVigila automatiza las preguntas que los periodistas e investigadores hacen manualmente, y convierte la respuesta en evidencia lista para actuar.

### Las preguntas que respondemos

1. **¿Qué proveedores ganan contratos repetidamente en una sola entidad siendo el único oferente?**
   El Estado debería tener competencia real en sus compras. Cuando una empresa gana decenas de contratos en la misma institución y en la mayoría de casos nadie más participó, hay algo que explicar.

2. **¿Qué licitaciones se publicaron con menos de 48 horas de plazo, y quién las ganó?**
   Está documentado en Guatemala que se publican licitaciones con 1 hora de plazo. Solo puede ganar quien ya sabía que iba a salir. GuateVigila detecta estos casos a escala y revela si hay un proveedor favorecido sistemáticamente.

3. **¿Qué entidades evitan sistemáticamente la licitación abierta y prefieren compra directa?**
   La compra directa tiene menos controles y no requiere competencia. Una entidad que compra directamente el 90% del tiempo, cuando el promedio nacional es 31%, tiene un patrón que merece explicación.

4. **¿Qué entidades adjudican contratos que nunca se formalizan?**
   En 2024, Guatemala registró 221,000 adjudicaciones pero solo 13,000 contratos formalizados — el 6%. Por entidad, ¿quiénes adjudican sistemáticamente sin llegar a contrato? ¿El dinero se mueve de otra forma?

5. **¿Qué entidades tienen tasas anormalmente altas de concursos cancelados o desiertos?**
   Un concurso desierto puede ser legítimo. Pero una entidad donde el 60% de los concursos quedan desiertos, y luego compra directamente, podría estar usando los concursos fallidos como pretexto para evitar licitación.

---

## Cómo lo hacemos

GuateVigila procesa automáticamente los registros de contratación pública del estado guatemalteco (Guatecompras, 2020–2024) y aplica cinco algoritmos de detección que identifican patrones estadísticamente anómalos.

Cuando un patrón supera un umbral, se genera una **alerta**. Una alerta no es un dato crudo — es una conclusión: "esta entidad y este proveedor tienen un comportamiento que difiere significativamente del promedio nacional y merece investigación."

Cada alerta incluye:
- Qué señal la disparó
- La entidad y el proveedor involucrados
- El monto en riesgo
- Un score de riesgo (más señales coincidentes = mayor riesgo)
- Links directos a los contratos originales en Guatecompras para verificación
- Un borrador de contexto periodístico generado automáticamente con IA

**No reemplazamos al periodista.** Le damos el punto de partida de su investigación, ya armado.

---

## Qué es una alerta

Una alerta se crea cuando un par (entidad, proveedor) supera el umbral en al menos una señal de detección. El score de riesgo refleja cuántas señales coinciden simultáneamente:

| Score | Color | Significado |
|---|---|---|
| 3+ señales | Rojo | Patrón consistente con múltiples irregularidades |
| 1–2 señales | Ámbar | Anomalía estadística que merece revisión |

Una alerta existe mientras el patrón persiste en los datos. Con actualizaciones periódicas del dataset, una alerta puede marcarse como `nueva`, `persistente` o `resuelta`. Para el usuario, el estado es simple: activa o no existe.

---

## Lo que GuateVigila no hace

- No acusa ni sentencia. Detecta patrones estadísticos, no delitos.
- No reemplaza la investigación periodística. La inicia.
- No requiere cuenta ni registro. Acceso público total, sin fricción.
- No inventa datos. Todo lo que muestra tiene su fuente original en Guatecompras, con link directo al contrato.

---

## Usuarios

### Primario — El periodista de investigación guatemalteco

Trabaja en medios digitales independientes como Plaza Pública, No Ficción, Prensa Comunitaria u Ojoconmipisto. Tiene intuición periodística sólida pero no tiempo para procesar datos masivos. Su problema no es falta de sospecha sino falta de evidencia estructurada. GuateVigila le da las pistas con la evidencia ya recopilada. Si le ahorra tres semanas de trabajo manual en una investigación, es un éxito.

**Cómo usa el producto:** llega a la cola de alertas, ve qué está ardiendo, hace click en una alerta de alto riesgo, revisa la evidencia, copia el borrador periodístico y abre los contratos en Guatecompras para verificar.

### Secundario — El analista de ONG / watchdog

Trabaja en organizaciones como Acción Ciudadana, Red Ciudadana o ICEFI. Entiende el problema de la corrupción en contrataciones pero no tiene stack técnico para procesar datos a escala. Necesita reportes accionables que pueda llevar a una audiencia pública, a una denuncia formal o a una propuesta de reforma.

**Cómo usa el producto:** busca una entidad específica que ya tiene en el radar, revisa su perfil completo, exporta la alerta como documento para adjuntar a una presentación o denuncia.

### Terciario — El auditor público

Trabaja en la Contraloría General de Cuentas. Tiene poder sancionador pero trabaja de forma reactiva — investiga cuando alguien denuncia. GuateVigila le permite actuar proactivamente, priorizando donde hay mayor probabilidad estadística de irregularidad.

**Cómo usa el producto:** revisa periódicamente las alertas de alto riesgo como insumo para decidir qué entidades auditar.

### Ocasional — El ciudadano interesado en su municipio

No va a hacer análisis profundo. Puede buscar su municipalidad específica y ver si aparece en el radar. La interfaz debe ser comprensible sin conocimiento técnico de contrataciones públicas.

---

## UX del producto

GuateVigila tiene cuatro vistas principales, todas accesibles sin cuenta:

### 1. Cola de alertas (vista de entrada)
Lista priorizada de alertas activas, ordenadas por score de riesgo. Filtrable por entidad, tipo de señal y monto. La primera impresión responde la pregunta: "¿qué está pasando ahora mismo en las contrataciones públicas de Guatemala?"

### 2. Detalle de alerta
La pantalla más importante. Un click desde la cola muestra:
- Las señales que dispararon la alerta con sus valores concretos
- El proveedor identificado con su NIT
- El monto total en riesgo
- Dos acciones directas: ver contratos en Guatecompras (link externo) y buscar en el Registro Mercantil (link con NIT prellenado)
- Borrador de contexto periodístico generado por IA

### 3. Perfil de entidad
Vista de la institución compradora. Métricas de comportamiento histórico, ranking de proveedores por monto, distribución de modalidades de compra, evolución año a año. Accesible buscando por nombre de entidad.

### 4. Perfil de proveedor
Vista del proveedor por NIT o nombre. Historial de contratos por año, en cuántas entidades opera, si creció de forma anómala, cuántas alertas tiene activas. Accesible buscando por nombre o NIT.

---

## Valor agregado: más que un dashboard

GuateVigila no renderiza datos — los interroga y aumenta su valor de tres formas:

**Detección automática:** identifica patrones que ningún portal gubernamental señala. El MINFIN publica los datos; GuateVigila hace las preguntas incómodas.

**Augmentación con IA:** para cada alerta de alto riesgo, genera un borrador de contexto periodístico listo para usar — no solo cifras, sino una narrativa que conecta el patrón con su significado. Esto convierte un hallazgo técnico en el punto de partida de una historia.

**Exportación abierta:** cada alerta es exportable como JSON estructurado, para que otros sistemas, LLMs o herramientas periodísticas puedan consumirla. Consistente con la filosofía de datos abiertos del proyecto.

---

## Lo que diferencia a GuateVigila

| | Guatecompras | Portal MINFIN | NINA (CLIP regional) | GuateVigila |
|---|---|---|---|---|
| Datos Guatemala | ✅ | ✅ | Parcial | ✅ |
| Detección automática de patrones | ❌ | ❌ | ❌ | ✅ |
| Cruza múltiples señales | ❌ | ❌ | ❌ | ✅ |
| Output accionable | ❌ | ❌ | Parcial | ✅ |
| Borrador periodístico con IA | ❌ | ❌ | ❌ | ✅ |
| Sin cuenta requerida | ✅ | ✅ | ❌ | ✅ |

---

## Alcance del hackathon

Para hack@latam (72 horas, equipo de 4):

**En scope:**
- Pipeline de detección sobre OCDS 2020–2024
- Cola de alertas con las 5 señales implementadas
- Detalle de alerta con evidencia y links
- Perfil de entidad y perfil de proveedor
- Borrador periodístico generado con IA (MiniMax)
- Exportación JSON de alertas
- Deploy público, open source

**Fuera de scope (próxima iteración):**
- Actualización automática diaria del dataset
- Colaboración y anotaciones de usuarios
- Cruce con ejecución presupuestaria municipal (SICOIN)
- Cruce con Registro Mercantil a escala (requiere scraping con resolución de CAPTCHA)
- Estados de alerta dinámicos (nueva / persistente / resuelta)

---

*GuateVigila es open source, sin fines de lucro, construido para Guatemala.*
*Datos: OCDS Guatecompras (CC BY 4.0) · datos.minfin.gob.gt*
