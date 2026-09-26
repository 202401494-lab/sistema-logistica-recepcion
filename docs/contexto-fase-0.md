# Fase 0 - Contexto funcional compartido

## Propósito del sistema

El sistema coordina la recepción de proveedores en un centro de distribución. El pedido y su cita son el registro central del flujo; la llegada real se guarda en el pedido existente, no en una colección separada de arribos. Como un proveedor puede tener varios pedidos, la puntualidad corresponde a cada cita.

## Flujo de las historias

1. **HU-01 - Agenda:** el coordinador registra proveedor y pedido, y asigna una ventana de recepción. El backend valida el horario operativo y evita ventanas solapadas.
2. **HU-02 - Llegada:** el operador registra la hora real. El pedido queda clasificado como `Anticipado`, `A tiempo` o `Tardío`. Una llegada anticipada permanece en espera hasta el inicio de su ventana. Si no hay llegada, el pedido queda `Ausente` al vencer la tolerancia configurada.
3. **HU-03 - Descarga:** después de la llegada se evalúa un gateway compatible; si no hay disponibilidad, el pedido entra a la cola de espera.

La HU-02 define explícitamente las categorías `A tiempo`, `Anticipado` y `Ausente`. `Tardío` se usa para una llegada registrada después del fin de la ventana; la tolerancia determina cuándo se marca como ausente si no existe registro de llegada.

## Estados y responsabilidades

- `estado` representa el ciclo del pedido: `PROGRAMADO`, `CANCELADO` o `ATENDIDO`.
- `estadoPuntualidad` representa el resultado de la cita: `A tiempo`, `Anticipado`, `Tardío` o `Ausente`.
- `enEspera` indica que el proveedor llegó antes de su ventana y todavía no puede iniciar la descarga.
- La marcación automática de ausencia solo aplica a pedidos activos y programados sin hora real de llegada.
- La administración de parámetros es exclusiva del rol `administrador`; registrar llegadas está permitido a `operador` y `administrador`.

## Tolerancia de llegada

El parámetro `TOLERANCIA_LLEGADA_MINUTOS` debe tener un valor entero no negativo. El backend consulta este parámetro cada minuto para marcar las ausencias. No hay un valor predeterminado: mientras no esté configurado, el sistema no marca ausencias automáticamente. Un valor de cero marca ausente al terminar la ventana.

## Endpoints backend

- `PATCH /api/pedidos/:id/llegada`: registra `fechaHoraLlegadaReal`; el campo es opcional y, si se omite, se usa la hora actual.
- `GET /api/parametros`: lista parámetros activos.
- `POST /api/parametros`: crea un parámetro con `clave`, `valor` y `descripcion` opcional.
- Si la clave ya existe inactiva, `POST /api/parametros` la reactiva y actualiza su valor; si está activa, responde conflicto.
- `PUT /api/parametros/:id`: actualiza uno o más campos.
- `DELETE /api/parametros/:id`: inactiva el parámetro sin borrarlo físicamente.