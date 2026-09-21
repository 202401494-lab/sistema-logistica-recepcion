import { useState } from 'react';
import { registrarProveedor } from '../lib/api';
import {
    validarEmail,
    validarIdentificacion,
} from '../lib/validaciones';
import styles from '../styles/dashboard.module.css';

/* Formulario para registrar un nuevo proveedor */
const formularioInicial = {
    razonSocial: '',
    identificacionTributaria: '',
    categoria: '',
    contactoNombre: '',
    telefono: '',
    emailContacto: '',
};

/* Componente de formulario para registrar un proveedor */
export default function ProveedorForm({ onProveedorCreado }) {
    const [formulario, setFormulario] = useState(formularioInicial);
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
    };

    /* Maneja el envío del formulario y la validación de los campos */
    const manejarEnvio = async (e) => {
        e.preventDefault();
        setMensaje('');

        /* Validación de campos vacíos y formato de los datos */
        if (Object.values(formulario).some((valor) => !valor.trim())) {
            setTipoMensaje('error');
            setMensaje('Completa todos los campos del proveedor.');
            return;
        }

        /* Validación de la identificación tributaria y correo electrónico */
        if (!validarIdentificacion(formulario.identificacionTributaria.trim())) {
            setTipoMensaje('error');
            setMensaje('La identificación tributaria no tiene un formato válido.');
            return;
        }

        /* Validación del correo electrónico de contacto */
        if (!validarEmail(formulario.emailContacto.trim())) {
            setTipoMensaje('error');
            setMensaje('Ingresa un correo electrónico válido.');
            return;
        }

        setCargando(true);

        /* Intento de registrar el proveedor en el backend */
        try {
            const proveedorCreado = await registrarProveedor({
                razonSocial: formulario.razonSocial.trim(),
                identificacionTributaria:
                    formulario.identificacionTributaria.trim(),
                categoria: formulario.categoria,
                contactoNombre: formulario.contactoNombre.trim(),
                telefono: formulario.telefono.trim(),
                emailContacto: formulario.emailContacto.trim(),
            });

            /* Resetea el formulario y muestra un mensaje de éxito */
            setFormulario(formularioInicial);
            setTipoMensaje('success');
            setMensaje('Proveedor registrado correctamente.');

            if (onProveedorCreado) {
                onProveedorCreado(proveedorCreado);
            }
        } catch (error) {
            setTipoMensaje('error');
            setMensaje(error.message);
        } finally {
            setCargando(false);
        }
    };

    /* Renderiza el formulario de registro de proveedor */
    return (
        <section className={styles.formCard}>
            <div className={styles.formHeadingCentrado}>
                <div>
                    <span className={styles.cardLabel}>Nuevo registro</span>
                    <h2>Registrar proveedor</h2>
                    <p>Agrega un proveedor al sistema logístico.</p>
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

            {/* Formulario de registro de proveedor */}
            <form className={styles.form} onSubmit={manejarEnvio}>
                <div className={styles.formGrid}>
                    <div className={styles.field}>
                        <label htmlFor="razonSocial">Razón social</label>
                        <input
                            id="razonSocial"
                            name="razonSocial"
                            value={formulario.razonSocial}
                            onChange={manejarCambio}
                            placeholder="Ej. Constructora del Norte"
                            required
                        />
                    </div>

                    {/* Campo de identificación tributaria con validación de formato */}
                    <div className={styles.field}>
                        <label htmlFor="identificacionTributaria">
                            Identificación tributaria
                        </label>
                        <input
                            id="identificacionTributaria"
                            name="identificacionTributaria"
                            value={formulario.identificacionTributaria}
                            onChange={manejarCambio}
                            placeholder="Ej. ABC-12345"
                            maxLength="20"
                            required
                        />
                    </div>

                    {/* Campo de categoría con opciones predefinidas */}
                    <div className={styles.field}>
                        <label htmlFor="categoria">Categoría</label>
                        <select
                            id="categoria"
                            name="categoria"
                            value={formulario.categoria}
                            onChange={manejarCambio}
                            required
                        >
                            <option value="">Selecciona una categoría</option>
                            <option value="construcción">Construcción</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    {/* Campo de nombre del contacto */}
                    <div className={styles.field}>
                        <label htmlFor="contactoNombre">Nombre del contacto</label>
                        <input
                            id="contactoNombre"
                            name="contactoNombre"
                            value={formulario.contactoNombre}
                            onChange={manejarCambio}
                            placeholder="Ej. Ana López"
                            required
                        />
                    </div>

                    {/* Campo de teléfono */}
                    <div className={styles.field}>
                        <label htmlFor="telefono">Teléfono</label>
                        <input
                            id="telefono"
                            name="telefono"
                            type="tel"
                            value={formulario.telefono}
                            onChange={manejarCambio}
                            placeholder="Ej. 5555-5555"
                            required
                        />
                    </div>

                    {/* Campo de correo electrónico de contacto con validación */}
                    <div className={styles.field}>
                        <label htmlFor="emailContacto">Correo electrónico</label>
                        <input
                            id="emailContacto"
                            name="emailContacto"
                            type="email"
                            value={formulario.emailContacto}
                            onChange={manejarCambio}
                            placeholder="contacto@empresa.com"
                            required
                        />
                    </div>
                </div>

                <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={cargando}
                >
                    {cargando ? 'Registrando...' : 'Registrar proveedor'}
                </button>
            </form>
        </section>
    );
}