# assistant-chat-gateway

## Información

### Versión

1.0.0

### Descripción

Gateway para los flujos conversacionales de la plataforma de Asistentes

### Autor

Ernesto Laura

## Compilación

```bash
npm run build
```

## Ejecución

```bash
npm run start
```

## Ejecución en entorno local

```bash
npm run dev
```

## Ejecución de pruebas unitarias

```bash
npm run test
```

Revisar el reporte de pruebas unitarias generadas en:

> test-result/test-report.html

## Endpoints de estado de salud

**Liveness:** Implementado por defecto en la URL:

> localhost:8080/liveness

**Readiness:** Implementar en index.ts, elemento "readinessProbes".

> localhost:8080/readiness


Se agrega flujo ci-cd con cursor CLI