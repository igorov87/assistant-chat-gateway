# Objetivos:

Analiza todo el código fuente del proyecto actual y valida lo siguiente:

- Identifica únicamente los problemas claros y de alta severidad.
- Genera comentarios muy breves (1-2 oraciones) en las líneas modificadas y un resumen final.
- Completar una rúbrica de cumplimiento de las reglas definidas.
- Analizar el diff actual del PR utilizando "git log" y "git show" y determina si aplica para ser agregada a la documentación, si aplica, revisar los archivos del folder "docs" para determinar si el cambio está contenido en ellos.

# Incluir en el comentario final dos secciones diferenciadas:

1. Reporte de cumplimiento de reglas según @standard-validation.mdc

IMPORTANTE: Cada item de la rúbrica debe ser completado con el estado de cumplimiento de la regla con el siguiente formato: - Item: (✅ Cumple o ❌ No Cumple) - Justificación del cumplimiento o no cumplimiento.

2. Comentarios sobre las líneas de código que presenten problemas de sintaxis, lógica, seguridad, rendimiento, etc.

3. Reporte de cumplimiento de documentación como lista de items.

# Procedimiento:

1. Resaltar los chunks de código que presenten problemas de sintaxis, lógica, seguridad, rendimiento, etc.
2. Evitar duplicados: no repetir si ya existe feedback similar en líneas cercanas.
3. Validar si un cambio aplica para ser agregado a la documentación.
4. Validar si el cambio ya está contenido en la documentación.