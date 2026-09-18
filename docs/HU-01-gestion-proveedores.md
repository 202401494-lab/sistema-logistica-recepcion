# HU-01 – Gestión de Proveedores, Pedidos y Agendamiento de Citas

**COMO:** Coordinador Logístico
**QUIERO:** registrar proveedores, pedidos de compra y programar la fecha y ventana horaria estimada de entrega
**PARA:** centralizar el control de ingresos y establecer la agenda operativa de recepciones

## Criterios de aceptación

**Criterio 1**
- DADO que el Coordinador Logístico ha registrado previamente al proveedor en el sistema
- CUANDO crea un nuevo pedido de compra y selecciona una fecha y ventana horaria de entrega
- ENTONCES el sistema debe guardar el pedido con estado "Programado" y mostrarlo en el calendario de recepciones

**Criterio 2**
- DADO que existe una ventana horaria ya asignada a otro proveedor
- CUANDO el Coordinador intenta agendar una nueva cita sobre esa misma ventana
- ENTONCES el sistema debe rechazar la operación y sugerir las ventanas horarias disponibles más cercanas

**Criterio 3**
- DADO que un proveedor no está registrado en el sistema
- CUANDO el Coordinador intenta agendarle un pedido
- ENTONCES el sistema debe solicitar el registro completo del proveedor antes de permitir el agendamiento
