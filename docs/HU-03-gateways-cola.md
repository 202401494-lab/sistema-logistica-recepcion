# HU-03 – Asignación de Gateways y Gestión de Cola de Espera

**COMO:** Operador de Recepción
**QUIERO:** consultar la disponibilidad de los gateways compatibles con el tipo de producto o ingresar el pedido a la cola de prioridad en caso de saturación
**PARA:** optimizar el uso de los puntos de descarga y evitar cuellos de botella en la zona de desembarque

## Criterios de aceptación

**Criterio 1**
- DADO que un proveedor transporta productos de tipo general y existe disponibilidad entre los Gateways 1 a 4
- CUANDO el sistema evalúa la asignación
- ENTONCES debe asignar automáticamente el pedido a uno de los Gateways 1 a 4 disponibles

**Criterio 2**
- DADO que un proveedor transporta productos de construcción
- CUANDO el sistema evalúa la asignación de gateway
- ENTONCES únicamente debe considerar el Gateway 5 como opción válida, sin permitir su asignación a los Gateways 1 a 4

**Criterio 3**
- DADO que no existe ningún gateway compatible disponible al momento de la llegada del proveedor
- CUANDO el sistema intenta asignar un gateway
- ENTONCES debe ingresar al proveedor a la cola de prioridad, aplicando reglas de envejecimiento (aging) para evitar la inanición de los proveedores tardíos
