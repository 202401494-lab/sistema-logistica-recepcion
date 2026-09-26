const test = require('node:test');
const assert = require('node:assert/strict');
const {
  clasificarLlegada,
  esToleranciaValida,
  obtenerFechaLlegada,
  ESTADOS_PUNTUALIDAD,
} = require('../services/clasificacionLlegada');

const inicio = new Date('2026-01-01T10:00:00.000Z');
const fin = new Date('2026-01-01T11:00:00.000Z');

test('clasifica una llegada anterior a la ventana como anticipada', () => {
  assert.equal(
    clasificarLlegada(new Date('2026-01-01T09:59:00.000Z'), inicio, fin),
    ESTADOS_PUNTUALIDAD.ANTICIPADO,
  );
});

test('incluye los extremos de la ventana en A tiempo', () => {
  assert.equal(clasificarLlegada(inicio, inicio, fin), ESTADOS_PUNTUALIDAD.A_TIEMPO);
  assert.equal(clasificarLlegada(fin, inicio, fin), ESTADOS_PUNTUALIDAD.A_TIEMPO);
});

test('clasifica una llegada posterior a la ventana como tardía', () => {
  assert.equal(
    clasificarLlegada(new Date('2026-01-01T11:01:00.000Z'), inicio, fin),
    ESTADOS_PUNTUALIDAD.TARDIO,
  );
});

test('acepta solo tolerancias enteras no negativas', () => {
  assert.equal(esToleranciaValida(0), true);
  assert.equal(esToleranciaValida(15), true);
  assert.equal(esToleranciaValida(-1), false);
  assert.equal(esToleranciaValida(1.5), false);
  assert.equal(esToleranciaValida('15'), false);
});

test('acepta la hora actual o pasada, pero rechaza horas futuras e inválidas', () => {
  const ahora = new Date('2026-01-01T10:00:00.000Z');
  assert.equal(obtenerFechaLlegada(undefined, ahora), ahora);
  assert.equal(
    obtenerFechaLlegada('2026-01-01T09:59:00.000Z', ahora).toISOString(),
    '2026-01-01T09:59:00.000Z',
  );
  assert.equal(obtenerFechaLlegada('2026-01-01T10:01:00.000Z', ahora), null);
  assert.equal(obtenerFechaLlegada('fecha inválida', ahora), null);
});