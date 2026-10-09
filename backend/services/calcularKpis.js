const ESTADOS_CUMPLIMIENTO = ['A TIEMPO', 'ANTICIPADO', 'TARDÍO', 'AUSENTE'];
const TIPOS_PRODUCTO = ['general', 'construcción'];

const claveDia = (fecha) => fecha.toISOString().slice(0, 10);
const promedio = (valores) => (valores.length
  ? valores.reduce((total, valor) => total + valor, 0) / valores.length
  : null);

const calcularKpis = ({ pedidos, descargas, gateways, desde, hasta, ahora = new Date() }) => {
  const esperas = [];
  const duraciones = Object.fromEntries(TIPOS_PRODUCTO.map((tipo) => [tipo, []]));
  const cumplimiento = Object.fromEntries(ESTADOS_CUMPLIMIENTO.map((estado) => [estado, 0]));
  const volumenPorDia = new Map();
  const ocupacionMs = new Map();
  const periodoMs = hasta.getTime() - desde.getTime();

  for (const pedido of pedidos) {
    if (pedido.fechaHoraLlegadaReal) {
      const llegada = new Date(pedido.fechaHoraLlegadaReal);
      if (llegada >= desde && llegada < hasta) {
        const estado = String(pedido.estadoPuntualidad || '').toUpperCase();
        if (Object.hasOwn(cumplimiento, estado)) cumplimiento[estado] += 1;
        const dia = claveDia(llegada);
        const volumen = volumenPorDia.get(dia) || { fecha: dia, atendidos: 0, finalizados: 0 };
        volumen.atendidos += 1;
        volumenPorDia.set(dia, volumen);
      }
    }
  }

  for (const descarga of descargas) {
    const inicio = new Date(descarga.fechaHoraInicio);
    const fin = descarga.fechaHoraFin ? new Date(descarga.fechaHoraFin) : ahora;
    const inicioSolapado = new Date(Math.max(inicio.getTime(), desde.getTime()));
    const finSolapado = new Date(Math.min(fin.getTime(), hasta.getTime(), ahora.getTime()));
    if (finSolapado > inicioSolapado) {
      const numeroGateway = descarga.gatewayId?.numeroGateway;
      ocupacionMs.set(
        numeroGateway,
        (ocupacionMs.get(numeroGateway) || 0) + finSolapado.getTime() - inicioSolapado.getTime(),
      );
    }

    const pedido = descarga.pedidoId;
    if (!pedido) continue;
    const llegada = pedido.fechaHoraLlegadaReal && new Date(pedido.fechaHoraLlegadaReal);
    if (llegada && inicio >= desde && inicio < hasta && inicio >= llegada) {
      esperas.push((inicio.getTime() - llegada.getTime()) / 60000);
    }
    if (descarga.fechaHoraFin && fin >= desde && fin < hasta && duraciones[pedido.tipoProducto]) {
      const duracionRegistrada = Number(descarga.duracionMinutos);
      duraciones[pedido.tipoProducto].push(Number.isFinite(duracionRegistrada)
        ? duracionRegistrada
        : (fin.getTime() - inicio.getTime()) / 60000);
      const dia = claveDia(fin);
      const volumen = volumenPorDia.get(dia) || { fecha: dia, atendidos: 0, finalizados: 0 };
      volumen.finalizados += 1;
      volumenPorDia.set(dia, volumen);
    }
  }

  const totalCumplimiento = Object.values(cumplimiento).reduce((total, cantidad) => total + cantidad, 0);
  const nivelCumplimiento = Object.fromEntries(Object.entries(cumplimiento).map(([estado, cantidad]) => [
    estado,
    totalCumplimiento ? (cantidad / totalCumplimiento) * 100 : 0,
  ]));

  return {
    periodo: { desde, hasta },
    tiempoPromedioEsperaMinutos: promedio(esperas),
    tiempoPromedioDescargaMinutos: Object.fromEntries(
      TIPOS_PRODUCTO.map((tipo) => [tipo, promedio(duraciones[tipo])]),
    ),
    nivelCumplimiento,
    ocupacionPorGateway: Array.from({ length: 5 }, (_, indice) => {
      const numeroGateway = indice + 1;
      const gateway = gateways.find((item) => item.numeroGateway === numeroGateway);
      return {
        numeroGateway,
        estado: gateway?.estado || 'NO CONFIGURADO',
        porcentaje: periodoMs > 0
          ? Math.min(100, ((ocupacionMs.get(numeroGateway) || 0) / periodoMs) * 100)
          : 0,
      };
    }),
    volumenDiario: Array.from(volumenPorDia.values()).sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
};

module.exports = calcularKpis;