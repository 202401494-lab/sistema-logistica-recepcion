const test = require('node:test');
const assert = require('node:assert/strict');
const calcularKpis = require('../services/calcularKpis');

test('calcula espera, descarga, puntualidad, ocupación y volumen del período', () => {
  const desde = new Date('2026-01-01T00:00:00.000Z');
  const hasta = new Date('2026-01-02T00:00:00.000Z');
  const pedido = {
    tipoProducto: 'general',
    fechaHoraLlegadaReal: new Date('2026-01-01T08:00:00.000Z'),
  };
  const resultado = calcularKpis({
    pedidos: [{ ...pedido, estadoPuntualidad: 'A tiempo' }],
    descargas: [{
      pedidoId: pedido,
      gatewayId: { numeroGateway: 1 },
      fechaHoraInicio: new Date('2026-01-01T08:30:00.000Z'),
      fechaHoraFin: new Date('2026-01-01T09:30:00.000Z'),
      duracionMinutos: 60,
    }],
    gateways: [{ numeroGateway: 1, estado: 'OCUPADO' }],
    desde,
    hasta,
    ahora: hasta,
  });

  assert.equal(resultado.tiempoPromedioEsperaMinutos, 30);
  assert.equal(resultado.tiempoPromedioDescargaMinutos.general, 60);
  assert.equal(resultado.tiempoPromedioDescargaMinutos['construcción'], null);
  assert.equal(resultado.nivelCumplimiento['A TIEMPO'], 100);
  assert.equal(resultado.ocupacionPorGateway.length, 5);
  assert.ok(Math.abs(resultado.ocupacionPorGateway[0].porcentaje - (100 / 24)) < 0.0001);
  assert.deepEqual(resultado.volumenDiario, [{ fecha: '2026-01-01', atendidos: 1, finalizados: 1 }]);
});

test('conserva una duración registrada de cero minutos', () => {
  const desde = new Date('2026-01-01T00:00:00.000Z');
  const hasta = new Date('2026-01-02T00:00:00.000Z');
  const resultado = calcularKpis({
    pedidos: [],
    descargas: [{
      pedidoId: { tipoProducto: 'general' },
      gatewayId: { numeroGateway: 1 },
      fechaHoraInicio: new Date('2026-01-01T08:00:00.000Z'),
      fechaHoraFin: new Date('2026-01-01T08:00:30.000Z'),
      duracionMinutos: 0,
    }],
    gateways: [],
    desde,
    hasta,
    ahora: hasta,
  });

  assert.equal(resultado.tiempoPromedioDescargaMinutos.general, 0);
});