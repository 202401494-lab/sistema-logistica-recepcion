import styles from '../styles/dashboard.module.css';

/* Formatea la fecha y hora en un formato legible para el usuario */
const formatearFecha = (fecha) => (
    new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(fecha))
);

/* Componente que muestra ventanas alternativas cuando hay solapamiento de citas */
export default function AlternativeWindows({
    alternativas,
    onSeleccionar,
}) {
    if (!alternativas || alternativas.length === 0) {
        return null;
    }

    /* Renderiza la lista de ventanas alternativas disponibles */
    return (
        <section className={styles.alternativesCard}>
            <span className={styles.cardLabel}>Solapamiento detectado</span>
            <h3>Ventanas alternativas disponibles</h3>
            <p>Selecciona una opción para cargarla en el formulario.</p>

            <div className={styles.alternativesList}>
                {alternativas.map((alternativa, indice) => (
                    <button
                        type="button"
                        className={styles.alternativeButton}
                        key={`${alternativa.inicioVentana}-${indice}`}
                        onClick={() => onSeleccionar(alternativa)}
                    >
                        <strong>Opción {indice + 1}</strong>
                        <span>
                            {formatearFecha(alternativa.inicioVentana)}
                            {' - '}
                            {new Intl.DateTimeFormat('es-MX', {
                                timeStyle: 'short',
                            }).format(new Date(alternativa.finVentana))}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}