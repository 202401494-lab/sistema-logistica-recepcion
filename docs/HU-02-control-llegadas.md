# HU-02 – Control de Llegadas y Clasificación Automática de Puntualidad

**COMO:** Operador de Recepción
**QUIERO:** capturar la hora real de arribo del proveedor y que el sistema determine automáticamente su estado de puntualidad
**PARA:** contar con trazabilidad del desempeño del proveedor e insumos confiables para priorizar su atención

## Criterios de aceptación

**Criterio 1**
- DADO que un proveedor tiene una cita programada con una ventana horaria estimada
- CUANDO el Operador registra la hora real de arribo dentro de dicha ventana
- ENTONCES el sistema debe clasificar automáticamente al proveedor como "A tiempo"

**Criterio 2**
- DADO que un proveedor arriba antes del inicio de su ventana horaria asignada
- CUANDO el Operador registra su hora de arribo
- ENTONCES el sistema debe clasificarlo como "Anticipado" y mantenerlo en espera hasta el inicio de su ventana

**Criterio 3**
- DADO que ha transcurrido la ventana horaria estimada sin registro de arribo
- CUANDO se cumple el tiempo límite de tolerancia configurado
- ENTONCES el sistema debe marcar automáticamente al proveedor como "Ausente"
