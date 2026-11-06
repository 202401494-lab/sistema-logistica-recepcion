const PUNTUACION_PUNTUALIDAD = {
  'a tiempo': 300,
  anticipado: 200,
  tardío: 100,
};
const INCREMENTO_AGING = 100;

const normalizarPuntualidad = (pedido) => String(
  pedido.estadoPuntualidad || pedido.estado || '',
).trim().toLocaleLowerCase('es');

const obtenerPuntuacionBase = (pedido) => PUNTUACION_PUNTUALIDAD[normalizarPuntualidad(pedido)] || 0;

const obtenerFechaIngresoCola = (pedido) => pedido.fechaHoraIngresoCola
  || pedido.fechaHoraLlegadaReal
  || pedido.fechaCreacion
  || pedido.createdAt
  || new Date();

const calcularMinutosEnEspera = (pedido, ahora = new Date()) => Math.max(
  0,
  Math.floor((ahora.getTime() - new Date(obtenerFechaIngresoCola(pedido)).getTime()) / 60000),
);

const calcularPrioridad = (pedido, minutosEnEspera, factorAgingMinutos) => (
  obtenerPuntuacionBase(pedido)
  + Math.floor(minutosEnEspera / factorAgingMinutos) * INCREMENTO_AGING
);

const compararPedidos = (a, b) => (
  b.prioridadCalculada - a.prioridadCalculada
  || obtenerPuntuacionBase(b) - obtenerPuntuacionBase(a)
  || new Date(a.fechaHoraProgramada).getTime() - new Date(b.fechaHoraProgramada).getTime()
  || b.minutosEnEspera - a.minutosEnEspera
  || new Date(obtenerFechaIngresoCola(a)).getTime() - new Date(obtenerFechaIngresoCola(b)).getTime()
  || String(a._id).localeCompare(String(b._id))
);

class ColaPrioridad {
  constructor(pedidos = []) {
    this.heap = [...pedidos];
    for (let indice = Math.floor(this.heap.length / 2) - 1; indice >= 0; indice -= 1) {
      this.descender(indice);
    }
  }

  insertar(pedido) {
    this.heap.push(pedido);
    let indice = this.heap.length - 1;
    while (indice > 0) {
      const padre = Math.floor((indice - 1) / 2);
      if (compararPedidos(this.heap[padre], this.heap[indice]) <= 0) break;
      [this.heap[padre], this.heap[indice]] = [this.heap[indice], this.heap[padre]];
      indice = padre;
    }
  }

  descender(indice) {
    while (true) {
      const izquierdo = indice * 2 + 1;
      const derecho = izquierdo + 1;
      let mejor = indice;
      if (izquierdo < this.heap.length
        && compararPedidos(this.heap[izquierdo], this.heap[mejor]) < 0) mejor = izquierdo;
      if (derecho < this.heap.length
        && compararPedidos(this.heap[derecho], this.heap[mejor]) < 0) mejor = derecho;
      if (mejor === indice) return;
      [this.heap[indice], this.heap[mejor]] = [this.heap[mejor], this.heap[indice]];
      indice = mejor;
    }
  }

  extraerSiguiente() {
    if (this.heap.length === 0) return null;
    const siguiente = this.heap[0];
    const ultimo = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = ultimo;
      this.descender(0);
    }
    return siguiente;
  }

  obtenerOrdenados() {
    const copia = new ColaPrioridad(this.heap);
    const pedidos = [];
    let siguiente = copia.extraerSiguiente();
    while (siguiente) {
      pedidos.push(siguiente);
      siguiente = copia.extraerSiguiente();
    }
    return pedidos;
  }
}

module.exports = {
  ColaPrioridad,
  INCREMENTO_AGING,
  calcularMinutosEnEspera,
  calcularPrioridad,
  obtenerFechaIngresoCola,
  obtenerPuntuacionBase,
};
