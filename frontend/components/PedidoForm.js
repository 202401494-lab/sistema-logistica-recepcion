import { useState } from 'react';
import { crearPedido } from '../lib/api';
import {
    convertirAISO,
    validarHorario,
} from '../lib/validaciones';
import AlternativeWindows from './AlternativeWindows';
import styles from '../styles/dashboard.module.css';

/* Formulario para agendar un nuevo pedido */
const formularioInicial = {
    numeroPedido: '',
    proveedorId: '',
    tipoProducto: '',
    fechaHoraProgramada: '',
    inicioVentana: '',
    finVentana: '',
    duracionEstimadaMinutos: '60',
};

/* Convierte una fecha a un formato compatible con el input de tipo datetime-local */
const convertirParaInput = (fecha) => {
    const valor = new Date(fecha);
    const offset = valor.getTimezoneOffset() * 60000;

    return new Date(valor.getTime() - offset)
        .toISOString()
        .slice(0, 16);
};

/* Componente de formulario para agendar un pedido */
export default function PedidoForm({
    proveedores,
    onPedidoCreado,
}) {
    const [formulario, setFormulario] = useState(formularioInicial);
    const [alternativas, setAlternativas] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarCambio = (e) => {
        const { name, value } = e.target;

        setFormulario((actual) => ({
            ...actual,
            [name]: value,
        }));

        setMensaje('');

        if (name === 'inicioVentana' || name === 'finVentana') {
            setAlternativas([]);
        }
    };

    /* Maneja el envío del formulario y la validación de los campos */
    const manejarEnvio = async (e) => {
        e.preventDefault();
        setMensaje('');
        setAlternativas([]);

        const duracion = Number(formulario.duracionEstimadaMinutos);

        if (Object.entries(formulario).some(([campo, valor]) => (
            campo !== 'duracionEstimadaMinutos' && !valor
        ))) {
            setTipoMensaje('error');
            setMensaje('Completa todos los campos del pedido.');
            return;
        }

        const errorHorario = validarHorario(formulario);

        if (errorHorario) {
            setTipoMensaje('error');
            setMensaje(errorHorario);
            return;
        }

        setCargando(true);

        /* Intento de crear el pedido en el backend */
        try {
            const pedidoCreado = await crearPedido({
                numeroPedido: formulario.numeroPedido.trim(),
                proveedorId: formulario.proveedorId,
                tipoProducto: formulario.tipoProducto,
                fechaHoraProgramada: convertirAISO(
                    formulario.fechaHoraProgramada,
                ),
                inicioVentana: convertirAISO(formulario.inicioVentana),
                finVentana: convertirAISO(formulario.finVentana),
                duracionEstimadaMinutos: duracion,
            });

            setFormulario(formularioInicial);
            setTipoMensaje('success');
            setMensaje('Pedido agendado correctamente.');

            if (onPedidoCreado) {
                onPedidoCreado(pedidoCreado);
            }
        } catch (error) {
            setTipoMensaje('error');
            setMensaje(error.message);
            setAlternativas(error.alternativas || []);
        } finally {
            setCargando(false);
        }
    };

    /* Maneja la selección de una ventana alternativa y actualiza el formulario */
    const seleccionarAlternativa = (alternativa) => {
        setFormulario((actual) => ({
            ...actual,
            inicioVentana: convertirParaInput(alternativa.inicioVentana),
            finVentana: convertirParaInput(alternativa.finVentana),
            fechaHoraProgramada: convertirParaInput(
                alternativa.inicioVentana,
            ),
        }));

        setAlternativas([]);
        setTipoMensaje('success');
        setMensaje(
            'Alternativa seleccionada. Revisa los datos y vuelve a enviar.',
        );
    };
    /* Renderiza el formulario de agendar pedido con validaciones y manejo de estado */
    return (
        <section className={styles.formCard}>
            <div className={styles.formHeading}>
                <div>
                    <span className={styles.cardLabel}>Nueva programación</span>
                    <h2>Agendar pedido</h2>
                    {/* El texto visible debe coincidir con la validación de RN-02. */}
                    <p>Horario operativo permitido: 07:00 a 17:00.</p>
                </div>
            </div>

            {mensaje && (
                <div
                    className={tipoMensaje === 'success'
                        ? styles.successMessage
                        : styles.errorMessage}
                    role="alert"
                >
                    {tipoMensaje === 'success' ? '✓' : '⚠️'} {mensaje}
                </div>
            )}

            {/* Renderiza el formulario de agendar pedido con campos y validaciones */}
            <form className={styles.form} onSubmit={manejarEnvio}>
                <div className={styles.formGrid}>
                    <div className={styles.field}>
                        <label htmlFor="numeroPedido">Número de pedido</label>
                        <input
                            id="numeroPedido"
                            name="numeroPedido"
                            value={formulario.numeroPedido}
                            onChange={manejarCambio}
                            placeholder="Ej. PED-001"
                            required
                        />
                    </div>

                    {/* Campo de selección de proveedor con validación de existencia */}
                    <div className={styles.field}>
                        <label htmlFor="proveedorId">Proveedor</label>
                        <select
                            id="proveedorId"
                            name="proveedorId"
                            value={formulario.proveedorId}
                            onChange={manejarCambio}
                            required
                        >
                            <option value="">Selecciona un proveedor</option>
                            {proveedores.map((proveedor) => (
                                <option
                                    key={proveedor._id}
                                    value={proveedor._id}
                                >
                                    {proveedor.razonSocial}
                                </option>
                            ))}
                        </select>

                        {proveedores.length === 0 && (
                            <small className={styles.fieldHint}>
                                Primero registra un proveedor.
                            </small>
                        )}
                    </div>

                    {/* Campo de tipo de producto con opciones predefinidas */}
                    <div className={styles.field}>
                        <label htmlFor="tipoProducto">Tipo de producto</label>
                        <select
                            id="tipoProducto"
                            name="tipoProducto"
                            value={formulario.tipoProducto}
                            onChange={manejarCambio}
                            required
                        >
                            <option value="">Selecciona un tipo</option>
                            <option value="construcción">Construcción</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    {/* Campo de duración estimada en minutos con validación de número positivo */}
                    <div className={styles.field}>
                        <label htmlFor="duracionEstimadaMinutos">
                            Duración estimada en minutos
                        </label>
                        <input
                            id="duracionEstimadaMinutos"
                            name="duracionEstimadaMinutos"
                            type="number"
                            min="1"
                            value={formulario.duracionEstimadaMinutos}
                            onChange={manejarCambio}
                            required
                        />
                    </div>

                    {/* Campo de fecha y hora programada con validación de formato y rango horario */}
                    <div className={styles.field}>
                        <label htmlFor="fechaHoraProgramada">
                            Fecha y hora programada
                        </label>
                        <input
                            id="fechaHoraProgramada"
                            name="fechaHoraProgramada"
                            type="datetime-local"
                            value={formulario.fechaHoraProgramada}
                            onChange={manejarCambio}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="inicioVentana">Inicio de ventana</label>
                        <input
                            id="inicioVentana"
                            name="inicioVentana"
                            type="datetime-local"
                            value={formulario.inicioVentana}
                            onChange={manejarCambio}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="finVentana">Fin de ventana</label>
                        <input
                            id="finVentana"
                            name="finVentana"
                            type="datetime-local"
                            value={formulario.finVentana}
                            onChange={manejarCambio}
                            required
                        />
                    </div>
                </div>

                <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={cargando || proveedores.length === 0}
                >
                    {cargando ? 'Agendando...' : 'Agendar pedido'}
                </button>
            </form>

            <AlternativeWindows
                alternativas={alternativas}
                onSeleccionar={seleccionarAlternativa}
            />
        </section>
    );
}